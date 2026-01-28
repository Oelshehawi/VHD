import { ExpoPushToken } from "../../../../models/expoPushTokenSchema";
import { HandlerResult, TableHandler } from "../types";
import {
  validationError,
  notFoundError,
  serverError,
  success,
} from "../utils/validation";

// Validate Expo push token format: ExponentPushToken[xxx] or ExpoPushToken[xxx]
const EXPO_TOKEN_REGEX = /^Expo(?:nent)?PushToken\[.+\]$/;

function isValidExpoToken(token: string): boolean {
  return EXPO_TOKEN_REGEX.test(token);
}

export const expoPushTokensHandler: TableHandler = {
  async put(data: Record<string, unknown>): Promise<HandlerResult> {
    try {
      const {
        id,
        userId,
        token,
        platform,
        deviceName,
        notifyNewJobs,
        notifyScheduleChanges,
        lastUsedAt,
      } = data;

      // Validate required fields
      if (!id || typeof id !== "string") {
        return validationError("id is required");
      }

      if (!userId || typeof userId !== "string") {
        return validationError("userId is required");
      }

      if (!token || typeof token !== "string") {
        return validationError("token is required");
      }

      if (!isValidExpoToken(token)) {
        return validationError("Invalid Expo push token format");
      }

      if (!platform || !["ios", "android"].includes(platform as string)) {
        return validationError("platform must be 'ios' or 'android'");
      }

      if (!deviceName || typeof deviceName !== "string") {
        return validationError("deviceName is required");
      }

      // Upsert by token (token is globally unique)
      const result = await ExpoPushToken.findOneAndUpdate(
        { token },
        {
          $set: {
            userId,
            token,
            platform,
            deviceName,
            notifyNewJobs: notifyNewJobs === 1 || notifyNewJobs === true,
            notifyScheduleChanges:
              notifyScheduleChanges === 1 || notifyScheduleChanges === true,
            lastUsedAt: lastUsedAt
              ? new Date(lastUsedAt as string)
              : new Date(),
            updatedAt: new Date(),
          },
        },
        { upsert: true, new: true, runValidators: true }
      );

      return success({ expoPushToken: result });
    } catch (error) {
      console.error("ExpoPushToken PUT error:", error);
      return serverError(
        error instanceof Error ? error.message : "Unknown error"
      );
    }
  },

  async batchPut(_: Record<string, unknown>): Promise<HandlerResult> {
    return validationError("batchPut is not supported for expoPushTokens");
  },

  async patch(data: Record<string, unknown>): Promise<HandlerResult> {
    try {
      const { id, token, notifyNewJobs, notifyScheduleChanges, ...otherFields } =
        data;

      // Allow lookup by id or token
      if (
        (!id || typeof id !== "string") &&
        (!token || typeof token !== "string")
      ) {
        return validationError("id or token is required");
      }

      const query = token ? { token } : { _id: id };
      const existing = await ExpoPushToken.findOne(query);

      if (!existing) {
        return notFoundError("ExpoPushToken not found");
      }

      const updateData: Record<string, unknown> = { ...otherFields };

      if (notifyNewJobs !== undefined) {
        updateData.notifyNewJobs =
          notifyNewJobs === 1 || notifyNewJobs === true;
      }

      if (notifyScheduleChanges !== undefined) {
        updateData.notifyScheduleChanges =
          notifyScheduleChanges === 1 || notifyScheduleChanges === true;
      }

      updateData.updatedAt = new Date();

      const result = await ExpoPushToken.findOneAndUpdate(
        query,
        { $set: updateData },
        { new: true, runValidators: true }
      );

      return success({ expoPushToken: result });
    } catch (error) {
      console.error("ExpoPushToken PATCH error:", error);
      return serverError(
        error instanceof Error ? error.message : "Unknown error"
      );
    }
  },

  async delete(id: string): Promise<HandlerResult> {
    try {
      // Support deletion by token string (for unregistering device)
      const isToken = EXPO_TOKEN_REGEX.test(id);
      const query = isToken ? { token: id } : { _id: id };

      const result = await ExpoPushToken.findOneAndDelete(query);

      if (!result) {
        return notFoundError("ExpoPushToken not found");
      }

      return success({ deleted: true });
    } catch (error) {
      console.error("ExpoPushToken DELETE error:", error);
      return serverError(
        error instanceof Error ? error.message : "Unknown error"
      );
    }
  },
};
