import { TimeOffRequest } from "../../../../models/reactDataSchema";
import { HandlerResult, TableHandler } from "../types";
import {
  isValidObjectId,
  toObjectId,
  validationError,
  notFoundError,
  serverError,
  success,
} from "../utils/validation";

const validStatuses = ["pending", "approved", "rejected"] as const;

export const timeOffRequestsHandler: TableHandler = {
  async put(data: Record<string, unknown>): Promise<HandlerResult> {
    try {
      const {
        id,
        technicianId,
        startDate,
        endDate,
        reason,
        status,
        ...otherFields
      } = data;

      if (!id || typeof id !== "string") {
        return validationError("id is required");
      }

      if (!isValidObjectId(id)) {
        return validationError("Invalid id format");
      }

      if (!technicianId || typeof technicianId !== "string") {
        return validationError("technicianId is required");
      }

      if (!startDate) {
        return validationError("startDate is required");
      }

      if (!endDate) {
        return validationError("endDate is required");
      }

      if (!reason || typeof reason !== "string" || reason.trim() === "") {
        return validationError("reason is required");
      }

      const start = new Date(startDate as string);
      const end = new Date(endDate as string);

      if (isNaN(start.getTime())) {
        return validationError("Invalid startDate format");
      }

      if (isNaN(end.getTime())) {
        return validationError("Invalid endDate format");
      }

      if (start > end) {
        return validationError("startDate must be before endDate");
      }

      const finalStatus =
        status &&
        validStatuses.includes(status as (typeof validStatuses)[number])
          ? status
          : "pending";

      const result = await TimeOffRequest.findByIdAndUpdate(
        toObjectId(id),
        {
          $set: {
            technicianId,
            startDate: start,
            endDate: end,
            reason,
            status: finalStatus,
            requestedAt: new Date(),
            ...otherFields,
          },
        },
        { upsert: true, new: true, runValidators: true },
      );

      return success({ timeOffRequest: result });
    } catch (error) {
      console.error("TimeOffRequest PUT error:", error);
      return serverError(
        error instanceof Error ? error.message : "Unknown error",
      );
    }
  },
  async batchPut(_: Record<string, unknown>): Promise<HandlerResult> {
    return validationError("batchPut is not supported for timeoffrequests");
  },

  async patch(data: Record<string, unknown>): Promise<HandlerResult> {
    try {
      const { id, startDate, endDate, reason, status, ...otherFields } = data;

      if (!id || typeof id !== "string") {
        return validationError("id is required");
      }

      if (!isValidObjectId(id)) {
        return validationError("Invalid id format");
      }

      const existing = await TimeOffRequest.findById(toObjectId(id));
      if (!existing) {
        return notFoundError("Time-off request not found");
      }

      const updateData: Record<string, unknown> = { ...otherFields };

      if (startDate !== undefined) {
        const start = new Date(startDate as string);
        if (isNaN(start.getTime())) {
          return validationError("Invalid startDate format");
        }
        updateData.startDate = start;
      }

      if (endDate !== undefined) {
        const end = new Date(endDate as string);
        if (isNaN(end.getTime())) {
          return validationError("Invalid endDate format");
        }
        updateData.endDate = end;
      }

      if (reason !== undefined) {
        if (typeof reason !== "string" || reason.trim() === "") {
          return validationError("reason cannot be empty");
        }
        updateData.reason = reason;
      }

      if (status !== undefined) {
        if (!validStatuses.includes(status as (typeof validStatuses)[number])) {
          return validationError(
            `status must be one of: ${validStatuses.join(", ")}`,
          );
        }
        updateData.status = status;
      }

      // Validate date logic
      const finalStart = (updateData.startDate as Date) ?? existing.startDate;
      const finalEnd = (updateData.endDate as Date) ?? existing.endDate;
      if (finalStart > finalEnd) {
        return validationError("startDate must be before endDate");
      }

      const result = await TimeOffRequest.findByIdAndUpdate(
        toObjectId(id),
        { $set: updateData },
        { new: true, runValidators: true },
      );

      return success({ timeOffRequest: result });
    } catch (error) {
      console.error("TimeOffRequest PATCH error:", error);
      return serverError(
        error instanceof Error ? error.message : "Unknown error",
      );
    }
  },

  async delete(id: string): Promise<HandlerResult> {
    try {
      if (!isValidObjectId(id)) {
        return validationError("Invalid id format");
      }

      const result = await TimeOffRequest.findByIdAndDelete(toObjectId(id));

      if (!result) {
        return notFoundError("Time-off request not found");
      }

      return success({ deleted: true });
    } catch (error) {
      console.error("TimeOffRequest DELETE error:", error);
      return serverError(
        error instanceof Error ? error.message : "Unknown error",
      );
    }
  },
};
