import { Schedule } from "../../../../models/reactDataSchema";
import { HandlerResult, TableHandler } from "../types";
import {
  isValidObjectId,
  toObjectId,
  validationError,
  notFoundError,
  serverError,
  success,
} from "../utils/validation";

export const schedulesHandler: TableHandler = {
  async put(data: Record<string, unknown>): Promise<HandlerResult> {
    try {
      const { id, ...fields } = data;

      if (!id || typeof id !== "string") {
        return validationError("id is required");
      }

      if (!isValidObjectId(id)) {
        return validationError("Invalid id format");
      }

      const result = await Schedule.findByIdAndUpdate(
        toObjectId(id),
        { $set: fields },
        { upsert: true, new: true, runValidators: true },
      );

      return success({ schedule: result });
    } catch (error) {
      console.error("Schedule PUT error:", error);
      return serverError(
        error instanceof Error ? error.message : "Unknown error",
      );
    }
  },
  async batchPut(_: Record<string, unknown>): Promise<HandlerResult> {
    return validationError("batchPut is not supported for schedules");
  },

  async patch(data: Record<string, unknown>): Promise<HandlerResult> {
    try {
      const { id, technicianNotes, ...otherFields } = data;

      if (!id || typeof id !== "string") {
        return validationError("id is required");
      }

      if (!isValidObjectId(id)) {
        return validationError("Invalid id format");
      }

      // Special case: only update technicianNotes if that's what's being updated
      const updateData =
        technicianNotes !== undefined && Object.keys(otherFields).length === 0
          ? { technicianNotes }
          : { technicianNotes, ...otherFields };

      const result = await Schedule.findByIdAndUpdate(
        toObjectId(id),
        { $set: updateData },
        { new: true, runValidators: true },
      );

      if (!result) {
        return notFoundError("Schedule not found");
      }

      return success({ schedule: result });
    } catch (error) {
      console.error("Schedule PATCH error:", error);
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

      const result = await Schedule.findByIdAndDelete(toObjectId(id));

      if (!result) {
        return notFoundError("Schedule not found");
      }

      return success({ deleted: true });
    } catch (error) {
      console.error("Schedule DELETE error:", error);
      return serverError(
        error instanceof Error ? error.message : "Unknown error",
      );
    }
  },
};
