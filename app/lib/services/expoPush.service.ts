import Expo, {
  ExpoPushMessage,
  ExpoPushTicket,
} from "expo-server-sdk";
import { ExpoPushToken } from "../../../models/expoPushTokenSchema";

const expo = new Expo();

export interface ExpoPushPayload {
  title: string;
  body: string;
  data?: Record<string, unknown>;
  badge?: number;
  sound?: "default" | null;
  channelId?: string;
}

export interface SendPushResult {
  success: boolean;
  sentCount: number;
  failedCount: number;
  invalidTokens: string[];
}

/**
 * Send Expo push notifications to a user's registered devices
 * Handles preference filtering based on notification type
 */
export async function sendExpoPushToUser(
  userId: string,
  payload: ExpoPushPayload,
  notificationType?: "newJob" | "scheduleChange" | "general"
): Promise<SendPushResult> {
  // Build query based on notification type preferences
  const query: Record<string, unknown> = { userId };

  if (notificationType === "newJob") {
    query.notifyNewJobs = true;
  } else if (notificationType === "scheduleChange") {
    query.notifyScheduleChanges = true;
  }
  // "general" notifications go to all devices regardless of preferences

  const tokens = await ExpoPushToken.find(query).lean();

  if (tokens.length === 0) {
    return { success: true, sentCount: 0, failedCount: 0, invalidTokens: [] };
  }

  const messages: ExpoPushMessage[] = [];
  const validTokens: string[] = [];

  for (const tokenDoc of tokens) {
    // Validate Expo push token format
    if (!Expo.isExpoPushToken(tokenDoc.token)) {
      console.warn(`Invalid Expo push token: ${tokenDoc.token}`);
      continue;
    }

    validTokens.push(tokenDoc.token);
    messages.push({
      to: tokenDoc.token,
      title: payload.title,
      body: payload.body,
      data: payload.data,
      sound: payload.sound ?? "default",
      badge: payload.badge,
      channelId: payload.channelId ?? "default",
    });
  }

  if (messages.length === 0) {
    return { success: true, sentCount: 0, failedCount: 0, invalidTokens: [] };
  }

  // Chunk messages (Expo recommends batches of ~100)
  const chunks = expo.chunkPushNotifications(messages);
  const tickets: ExpoPushTicket[] = [];
  const invalidTokens: string[] = [];

  for (const chunk of chunks) {
    try {
      const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      tickets.push(...ticketChunk);
    } catch (error) {
      console.error("Error sending Expo push chunk:", error);
    }
  }

  // Process tickets to identify invalid tokens
  let sentCount = 0;
  let failedCount = 0;

  for (let i = 0; i < tickets.length; i++) {
    const ticket = tickets[i];
    const token = validTokens[i];

    if (ticket?.status === "ok") {
      sentCount++;
    } else if (ticket?.status === "error") {
      failedCount++;

      // Handle DeviceNotRegistered - token is invalid
      if (ticket.details?.error === "DeviceNotRegistered" && token) {
        invalidTokens.push(token);
        // Delete invalid token from database
        await ExpoPushToken.deleteOne({ token });
        console.log(`Removed invalid Expo push token: ${token}`);
      }
    }
  }

  // Update lastUsedAt for successful sends
  if (sentCount > 0) {
    const successfulTokens = validTokens.filter(
      (_, i) => tickets[i]?.status === "ok"
    );
    await ExpoPushToken.updateMany(
      { token: { $in: successfulTokens } },
      { lastUsedAt: new Date() }
    );
  }

  return {
    success: failedCount === 0,
    sentCount,
    failedCount,
    invalidTokens,
  };
}

/**
 * Send Expo push notifications to multiple users
 */
export async function sendExpoPushToUsers(
  userIds: string[],
  payload: ExpoPushPayload,
  notificationType?: "newJob" | "scheduleChange" | "general"
): Promise<SendPushResult> {
  const results = await Promise.all(
    userIds.map((userId) =>
      sendExpoPushToUser(userId, payload, notificationType)
    )
  );

  return {
    success: results.every((r) => r.success),
    sentCount: results.reduce((sum, r) => sum + r.sentCount, 0),
    failedCount: results.reduce((sum, r) => sum + r.failedCount, 0),
    invalidTokens: results.flatMap((r) => r.invalidTokens),
  };
}

/**
 * Cleanup stale tokens (not used in specified days)
 */
export async function cleanupStaleTokens(
  daysOld: number = 90
): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  const result = await ExpoPushToken.deleteMany({
    lastUsedAt: { $lt: cutoffDate },
  });

  return result.deletedCount;
}
