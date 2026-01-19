"use server";

import webpush from "web-push";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import connectMongo from "../connect";
import {
  PushSubscription,
  Notification,
} from "../../../models/notificationSchema";
import { NotificationTypeEnum, NOTIFICATION_TYPES } from "../typeDefinitions";
import { requireAdmin } from "../auth/utils";

webpush.setVapidDetails(
  "mailto:oelshehawi@gmail.com",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
);

// ============ Push Subscription Actions ============

export async function subscribeUser(sub: {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    await connectMongo();

    // Upsert subscription - update if exists, create if not
    await PushSubscription.findOneAndUpdate(
      { userId, endpoint: sub.endpoint },
      {
        userId,
        endpoint: sub.endpoint,
        keys: sub.keys,
      },
      { upsert: true, new: true },
    );

    return { success: true };
  } catch (error) {
    console.error("Error subscribing user:", error);
    return { success: false, error: "Failed to subscribe" };
  }
}

export async function unsubscribeUser() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    await connectMongo();
    await PushSubscription.deleteMany({ userId });

    return { success: true };
  } catch (error) {
    console.error("Error unsubscribing user:", error);
    return { success: false, error: "Failed to unsubscribe" };
  }
}

// ============ Notification Actions ============

export async function getNotifications(limit: number = 20) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Unauthorized", notifications: [] };
    }

    await connectMongo();

    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return {
      success: true,
      notifications: JSON.parse(JSON.stringify(notifications)),
    };
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return {
      success: false,
      error: "Failed to fetch notifications",
      notifications: [],
    };
  }
}

export async function getUnreadCount() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Unauthorized", count: 0 };
    }

    await connectMongo();

    const count = await Notification.countDocuments({
      userId,
      readAt: null,
    });

    return { success: true, count };
  } catch (error) {
    console.error("Error fetching unread count:", error);
    return { success: false, error: "Failed to fetch count", count: 0 };
  }
}

export async function markAsRead(notificationId: string) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    await connectMongo();

    await Notification.findOneAndUpdate(
      { _id: notificationId, userId },
      { readAt: new Date() },
    );

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return { success: false, error: "Failed to mark as read" };
  }
}

export async function markAllAsRead() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    await connectMongo();

    await Notification.updateMany(
      { userId, readAt: null },
      { readAt: new Date() },
    );

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    return { success: false, error: "Failed to mark all as read" };
  }
}

// Create a notification for a specific user (used by other server actions)
export async function createNotification({
  userId,
  title,
  body,
  type,
  metadata,
}: {
  userId: string;
  title: string;
  body: string;
  type: NotificationTypeEnum;
  metadata?: {
    invoiceId?: string;
    scheduleId?: string;
    clientId?: string;
    estimateId?: string;
    schedulingRequestId?: string;
    link?: string;
  };
}) {
  try {
    await connectMongo();

    const notification = await Notification.create({
      userId,
      title,
      body,
      type,
      metadata,
    });

    // Try to send push notification if user has subscriptions
    const subscriptions = await PushSubscription.find({ userId });

    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: sub.keys,
          },
          JSON.stringify({
            title,
            body,
            icon: "/icon_192.png",
            data: metadata,
          }),
        );
      } catch (pushError: any) {
        // If subscription is expired/invalid, remove it
        if (pushError.statusCode === 410 || pushError.statusCode === 404) {
          await PushSubscription.deleteOne({ _id: sub._id });
        }
        console.error("Push notification failed:", pushError);
      }
    }

    return {
      success: true,
      notification: JSON.parse(JSON.stringify(notification)),
    };
  } catch (error) {
    console.error("Error creating notification:", error);
    return { success: false, error: "Failed to create notification" };
  }
}

// Send a test notification to the current user
export async function sendTestNotification(message: string) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    return await createNotification({
      userId,
      title: "Test Notification",
      body: message,
      type: NOTIFICATION_TYPES.SYSTEM,
    });
  } catch (error) {
    console.error("Error sending test notification:", error);
    return { success: false, error: "Failed to send notification" };
  }
}

// Get manager user IDs from Clerk (users with isManager public metadata)
async function getManagerUserIds(): Promise<string[]> {
  try {
    const { clerkClient } = await import("@clerk/nextjs/server");
    const clerk = await clerkClient();

    // Fetch all users (Clerk limits to 500 by default)
    const users = await clerk.users.getUserList({ limit: 500 });

    // Filter to users with isManager metadata
    const managerIds = users.data
      .filter((user) => {
        const metadata = user.publicMetadata as
          | { isManager?: boolean }
          | undefined;
        return metadata?.isManager === true;
      })
      .map((user) => user.id);

    return managerIds;
  } catch (error) {
    console.error("Error fetching manager users from Clerk:", error);
    return [];
  }
}

// Create scheduling request notification for all managers
export async function createSchedulingRequestNotification({
  schedulingRequestId,
  clientName,
  jobTitle,
  primaryDate,
  primaryTime,
}: {
  schedulingRequestId: string;
  clientName: string;
  jobTitle: string;
  primaryDate: string;
  primaryTime: string;
}) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    await connectMongo();

    // Get manager user IDs from Clerk
    const managerIds = await getManagerUserIds();

    if (managerIds.length === 0) {
      console.warn("No managers found to notify for scheduling request");
      return { success: true };
    }

    const results = await Promise.all(
      managerIds.map((userId) =>
        createNotification({
          userId,
          title: `Scheduling Request: ${clientName}`,
          body: `${jobTitle} - ${primaryDate} at ${primaryTime}`,
          type: NOTIFICATION_TYPES.SCHEDULING_REQUEST,
          metadata: {
            schedulingRequestId,
          },
        }),
      ),
    );

    return { success: results.every((r) => r.success) };
  } catch (error) {
    console.error("Error creating scheduling request notification:", error);
    return { success: false, error: "Failed to create notification" };
  }
}

// Dismiss scheduling request notifications when request is confirmed
export async function dismissSchedulingRequestNotification(
  schedulingRequestId: string,
) {
  try {
    await requireAdmin();

    await connectMongo();

    await Notification.deleteMany({
      type: NOTIFICATION_TYPES.SCHEDULING_REQUEST,
      "metadata.schedulingRequestId": schedulingRequestId,
    });

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Error dismissing scheduling request notification:", error);
    if (error instanceof Error && error.message.startsWith("Unauthorized")) {
      return { success: false, error: "Unauthorized" };
    }
    return { success: false, error: "Failed to dismiss notification" };
  }
}
