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
import { ACTUAL_SERVICE_DURATION_MAX_MINUTES } from "../../../lib/serviceDurationRules";

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
      const {
        id,
        technicianNotes,
        actualServiceDurationMinutes,
        actualServiceDurationSource: _ignoredSource,
        ...otherFields
      } = data;

      if (!id || typeof id !== "string") {
        return validationError("id is required");
      }

      if (!isValidObjectId(id)) {
        return validationError("Invalid id format");
      }

      const updateData: Record<string, unknown> = {};
      let durationWriteSkipped = false;
      let existingSchedule: any = null;

      if (technicianNotes !== undefined) {
        updateData.technicianNotes = technicianNotes;
      }

      for (const [key, value] of Object.entries(otherFields)) {
        if (value !== undefined) {
          updateData[key] = value;
        }
      }

      if (actualServiceDurationMinutes !== undefined) {
        if (
          typeof actualServiceDurationMinutes !== "number" ||
          !Number.isFinite(actualServiceDurationMinutes)
        ) {
          return validationError(
            "actualServiceDurationMinutes must be a finite number",
          );
        }

        if (actualServiceDurationMinutes < 0) {
          return validationError(
            "actualServiceDurationMinutes must be non-negative",
          );
        }

        if (
          actualServiceDurationMinutes > ACTUAL_SERVICE_DURATION_MAX_MINUTES
        ) {
          return validationError(
            `actualServiceDurationMinutes must be <= ${ACTUAL_SERVICE_DURATION_MAX_MINUTES}`,
          );
        }

        existingSchedule = await Schedule.findById(toObjectId(id)).select(
          "_id actualServiceDurationSource",
        );
        if (!existingSchedule) {
          return notFoundError("Schedule not found");
        }

        if (existingSchedule.actualServiceDurationSource === "admin_edit") {
          durationWriteSkipped = true;
        } else {
          updateData.actualServiceDurationMinutes =
            actualServiceDurationMinutes;
          updateData.actualServiceDurationSource = "mark_completed";
        }
      }

      if (Object.keys(updateData).length === 0) {
        if (durationWriteSkipped && existingSchedule) {
          return success({
            schedule: existingSchedule.toObject(),
            skippedActualServiceDuration: true,
            skipReason: "admin_edit_override_preserved",
          });
        }
        return validationError("No valid fields to update");
      }

      const result = await Schedule.findByIdAndUpdate(
        toObjectId(id),
        { $set: updateData },
        { new: true, runValidators: true },
      );

      if (!result) {
        return notFoundError("Schedule not found");
      }

      return success({
        schedule: result,
        ...(durationWriteSkipped
          ? {
              skippedActualServiceDuration: true,
              skipReason: "admin_edit_override_preserved",
            }
          : {}),
      });
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
