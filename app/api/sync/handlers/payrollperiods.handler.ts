import { PayrollPeriod } from "../../../../models/reactDataSchema";
import { HandlerResult, TableHandler } from "../types";
import {
  isValidObjectId,
  toObjectId,
  validationError,
  notFoundError,
  serverError,
  success,
} from "../utils/validation";

export const payrollPeriodsHandler: TableHandler = {
  async put(data: Record<string, unknown>): Promise<HandlerResult> {
    try {
      const { id, startDate, endDate, cutoffDate, payDay, ...otherFields } =
        data;

      if (!id || typeof id !== "string") {
        return validationError("id is required");
      }

      if (!isValidObjectId(id)) {
        return validationError("Invalid id format");
      }

      if (!startDate) {
        return validationError("startDate is required");
      }

      if (!endDate) {
        return validationError("endDate is required");
      }

      if (!cutoffDate) {
        return validationError("cutoffDate is required");
      }

      if (!payDay) {
        return validationError("payDay is required");
      }

      const start = new Date(startDate as string);
      const end = new Date(endDate as string);
      const cutoff = new Date(cutoffDate as string);
      const pay = new Date(payDay as string);

      if (isNaN(start.getTime())) {
        return validationError("Invalid startDate format");
      }

      if (isNaN(end.getTime())) {
        return validationError("Invalid endDate format");
      }

      if (isNaN(cutoff.getTime())) {
        return validationError("Invalid cutoffDate format");
      }

      if (isNaN(pay.getTime())) {
        return validationError("Invalid payDay format");
      }

      const result = await PayrollPeriod.findByIdAndUpdate(
        toObjectId(id),
        {
          $set: {
            startDate: start,
            endDate: end,
            cutoffDate: cutoff,
            payDay: pay,
            ...otherFields,
          },
        },
        { upsert: true, new: true, runValidators: true },
      );

      return success({ payrollPeriod: result });
    } catch (error) {
      console.error("PayrollPeriod PUT error:", error);
      return serverError(
        error instanceof Error ? error.message : "Unknown error",
      );
    }
  },
  async batchPut(_: Record<string, unknown>): Promise<HandlerResult> {
    return validationError("batchPut is not supported for payrollperiods");
  },

  async patch(data: Record<string, unknown>): Promise<HandlerResult> {
    try {
      const { id, startDate, endDate, cutoffDate, payDay, ...otherFields } =
        data;

      if (!id || typeof id !== "string") {
        return validationError("id is required");
      }

      if (!isValidObjectId(id)) {
        return validationError("Invalid id format");
      }

      const existing = await PayrollPeriod.findById(toObjectId(id));
      if (!existing) {
        return notFoundError("Payroll period not found");
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

      if (cutoffDate !== undefined) {
        const cutoff = new Date(cutoffDate as string);
        if (isNaN(cutoff.getTime())) {
          return validationError("Invalid cutoffDate format");
        }
        updateData.cutoffDate = cutoff;
      }

      if (payDay !== undefined) {
        const pay = new Date(payDay as string);
        if (isNaN(pay.getTime())) {
          return validationError("Invalid payDay format");
        }
        updateData.payDay = pay;
      }

      const result = await PayrollPeriod.findByIdAndUpdate(
        toObjectId(id),
        { $set: updateData },
        { new: true, runValidators: true },
      );

      return success({ payrollPeriod: result });
    } catch (error) {
      console.error("PayrollPeriod PATCH error:", error);
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

      const result = await PayrollPeriod.findByIdAndDelete(toObjectId(id));

      if (!result) {
        return notFoundError("Payroll period not found");
      }

      return success({ deleted: true });
    } catch (error) {
      console.error("PayrollPeriod DELETE error:", error);
      return serverError(
        error instanceof Error ? error.message : "Unknown error",
      );
    }
  },
};
