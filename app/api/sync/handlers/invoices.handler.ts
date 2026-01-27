import { Invoice } from "../../../../models/reactDataSchema";
import { HandlerResult, TableHandler } from "../types";
import {
  isValidObjectId,
  toObjectId,
  validationError,
  notFoundError,
  serverError,
  success,
} from "../utils/validation";

export const invoicesHandler: TableHandler = {
  async put(data: Record<string, unknown>): Promise<HandlerResult> {
    try {
      const { id, ...fields } = data;

      if (!id || typeof id !== "string") {
        return validationError("id is required");
      }

      if (!isValidObjectId(id)) {
        return validationError("Invalid id format");
      }

      const result = await Invoice.findByIdAndUpdate(
        toObjectId(id),
        { $set: fields },
        { upsert: true, new: true, runValidators: true },
      );

      return success({ invoice: result });
    } catch (error) {
      console.error("Invoice PUT error:", error);
      return serverError(
        error instanceof Error ? error.message : "Unknown error",
      );
    }
  },
  async batchPut(_: Record<string, unknown>): Promise<HandlerResult> {
    return validationError("batchPut is not supported for invoices");
  },

  async patch(data: Record<string, unknown>): Promise<HandlerResult> {
    try {
      const { id, paymentMethod, datePaid, notes, ...otherFields } = data;

      if (!id || typeof id !== "string") {
        return validationError("id is required");
      }

      if (!isValidObjectId(id)) {
        return validationError("Invalid id format");
      }

      let updateData: Record<string, unknown>;

      // Special case: cheque payment
      if (paymentMethod === "cheque") {
        updateData = {
          status: "paid",
          paymentInfo: {
            method: "cheque" as const,
            datePaid: datePaid ? new Date(datePaid as string) : new Date(),
            notes: notes || undefined,
          },
        };
      } else {
        // Standard partial update
        updateData = { ...otherFields };
        if (paymentMethod !== undefined)
          updateData.paymentMethod = paymentMethod;
        if (datePaid !== undefined) updateData.datePaid = datePaid;
        if (notes !== undefined) updateData.notes = notes;
      }

      const result = await Invoice.findByIdAndUpdate(
        toObjectId(id),
        { $set: updateData },
        { new: true, runValidators: true },
      );

      if (!result) {
        return notFoundError("Invoice not found");
      }

      return success({ invoice: result });
    } catch (error) {
      console.error("Invoice PATCH error:", error);
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

      const result = await Invoice.findByIdAndDelete(toObjectId(id));

      if (!result) {
        return notFoundError("Invoice not found");
      }

      return success({ deleted: true });
    } catch (error) {
      console.error("Invoice DELETE error:", error);
      return serverError(
        error instanceof Error ? error.message : "Unknown error",
      );
    }
  },
};
