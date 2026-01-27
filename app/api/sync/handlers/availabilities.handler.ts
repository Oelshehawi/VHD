import { Availability } from "../../../../models/reactDataSchema";
import { HandlerResult, TableHandler } from "../types";
import {
  isValidObjectId,
  toObjectId,
  validateTimeFormat,
  validateTimeLogic,
  validationError,
  notFoundError,
  serverError,
  success,
} from "../utils/validation";

export const availabilitiesHandler: TableHandler = {
  async put(data: Record<string, unknown>): Promise<HandlerResult> {
    try {
      const {
        id,
        technicianId,
        startTime,
        endTime,
        isFullDay,
        isRecurring,
        dayOfWeek,
        specificDate,
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

      if (!startTime || typeof startTime !== "string") {
        return validationError("startTime is required");
      }

      if (!endTime || typeof endTime !== "string") {
        return validationError("endTime is required");
      }

      if (!validateTimeFormat(startTime)) {
        return validationError("Invalid startTime format. Use HH:mm");
      }

      if (!validateTimeFormat(endTime)) {
        return validationError("Invalid endTime format. Use HH:mm");
      }

      const timeError = validateTimeLogic(
        startTime,
        endTime,
        Boolean(isFullDay),
      );
      if (timeError) {
        return validationError(timeError);
      }

      // Recurring validation
      if (isRecurring && dayOfWeek === undefined) {
        return validationError(
          "dayOfWeek is required for recurring availability",
        );
      }

      // Non-recurring validation
      if (!isRecurring && !specificDate) {
        return validationError(
          "specificDate is required for non-recurring availability",
        );
      }

      const result = await Availability.findByIdAndUpdate(
        toObjectId(id),
        {
          $set: {
            technicianId,
            startTime,
            endTime,
            isFullDay: Boolean(isFullDay),
            isRecurring: Boolean(isRecurring),
            dayOfWeek: isRecurring ? dayOfWeek : undefined,
            specificDate: specificDate
              ? new Date(specificDate as string)
              : undefined,
            ...otherFields,
            updatedAt: new Date(),
          },
        },
        { upsert: true, new: true, runValidators: true },
      );

      return success({ availability: result });
    } catch (error) {
      console.error("Availability PUT error:", error);
      return serverError(
        error instanceof Error ? error.message : "Unknown error",
      );
    }
  },
  async batchPut(_: Record<string, unknown>): Promise<HandlerResult> {
    return validationError("batchPut is not supported for availabilities");
  },

  async patch(data: Record<string, unknown>): Promise<HandlerResult> {
    try {
      const {
        id,
        startTime,
        endTime,
        isFullDay,
        isRecurring,
        dayOfWeek,
        specificDate,
        ...otherFields
      } = data;

      if (!id || typeof id !== "string") {
        return validationError("id is required");
      }

      if (!isValidObjectId(id)) {
        return validationError("Invalid id format");
      }

      const existing = await Availability.findById(toObjectId(id));
      if (!existing) {
        return notFoundError("Availability not found");
      }

      const updateData: Record<string, unknown> = { ...otherFields };

      // Time validations
      if (startTime !== undefined) {
        if (!validateTimeFormat(startTime as string)) {
          return validationError("Invalid startTime format. Use HH:mm");
        }
        updateData.startTime = startTime;
      }

      if (endTime !== undefined) {
        if (!validateTimeFormat(endTime as string)) {
          return validationError("Invalid endTime format. Use HH:mm");
        }
        updateData.endTime = endTime;
      }

      // Time logic validation
      if (startTime !== undefined || endTime !== undefined) {
        const finalStartTime = (startTime as string) ?? existing.startTime;
        const finalEndTime = (endTime as string) ?? existing.endTime;
        const finalIsFullDay =
          isFullDay !== undefined ? Boolean(isFullDay) : existing.isFullDay;

        const timeError = validateTimeLogic(
          finalStartTime,
          finalEndTime,
          finalIsFullDay,
        );
        if (timeError) {
          return validationError(timeError);
        }
      }

      if (isFullDay !== undefined) {
        updateData.isFullDay = Boolean(isFullDay);
      }

      if (isRecurring !== undefined) {
        updateData.isRecurring = Boolean(isRecurring);
      }

      if (dayOfWeek !== undefined) {
        updateData.dayOfWeek = dayOfWeek;
      }

      if (specificDate !== undefined) {
        updateData.specificDate = specificDate
          ? new Date(specificDate as string)
          : undefined;
      }

      // Recurring/non-recurring validation
      const finalIsRecurring =
        isRecurring !== undefined ? Boolean(isRecurring) : existing.isRecurring;
      const finalDayOfWeek = dayOfWeek ?? existing.dayOfWeek;
      const finalSpecificDate = specificDate ?? existing.specificDate;

      if (finalIsRecurring && finalDayOfWeek === undefined) {
        return validationError(
          "dayOfWeek is required for recurring availability",
        );
      }

      if (!finalIsRecurring && !finalSpecificDate) {
        return validationError(
          "specificDate is required for non-recurring availability",
        );
      }

      updateData.updatedAt = new Date();

      const result = await Availability.findByIdAndUpdate(
        toObjectId(id),
        { $set: updateData },
        { new: true, runValidators: true },
      );

      return success({ availability: result });
    } catch (error) {
      console.error("Availability PATCH error:", error);
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

      const result = await Availability.findByIdAndDelete(toObjectId(id));

      if (!result) {
        return notFoundError("Availability not found");
      }

      return success({ deleted: true });
    } catch (error) {
      console.error("Availability DELETE error:", error);
      return serverError(
        error instanceof Error ? error.message : "Unknown error",
      );
    }
  },
};
