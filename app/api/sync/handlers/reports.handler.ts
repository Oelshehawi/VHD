import { Report } from "../../../../models/reactDataSchema";
import { HandlerResult, TableHandler, ReportSyncData } from "../types";
import {
  isValidObjectId,
  toObjectId,
  validationError,
  notFoundError,
  serverError,
  success,
} from "../utils/validation";

export const reportsHandler: TableHandler = {
  async put(data: Record<string, unknown>): Promise<HandlerResult> {
    try {
      const reportData = data as unknown as ReportSyncData;

      if (!reportData.id || typeof reportData.id !== "string") {
        return validationError("id is required");
      }

      if (!isValidObjectId(reportData.id)) {
        return validationError("Invalid id format");
      }

      if (!reportData.scheduleId || !isValidObjectId(reportData.scheduleId)) {
        return validationError("Valid scheduleId is required");
      }

      if (!reportData.invoiceId || !isValidObjectId(reportData.invoiceId)) {
        return validationError("Valid invoiceId is required");
      }

      if (!reportData.technicianId) {
        return validationError("technicianId is required");
      }

      if (!reportData.dateCompleted) {
        return validationError("dateCompleted is required");
      }

      const report = {
        _id: toObjectId(reportData.id),
        scheduleId: toObjectId(reportData.scheduleId),
        invoiceId: toObjectId(reportData.invoiceId),
        technicianId: reportData.technicianId,
        dateCompleted: new Date(reportData.dateCompleted),
        reportStatus: reportData.reportStatus,
        jobTitle: reportData.jobTitle || undefined,
        location: reportData.location || undefined,
        cookingVolume: reportData.cookingVolume || undefined,
        recommendedCleaningFrequency:
          reportData.recommendedCleaningFrequency ?? undefined,
        comments: reportData.comments || undefined,
        cleaningDetails: reportData.cleaningDetails,
        inspectionItems: reportData.inspectionItems,
      };

      const result = await Report.findByIdAndUpdate(
        report._id,
        { $set: report },
        { upsert: true, new: true, runValidators: true },
      );

      return success({ report: result });
    } catch (error) {
      console.error("Report PUT error:", error);
      return serverError(
        error instanceof Error ? error.message : "Unknown error",
      );
    }
  },

  async batchPut(_: Record<string, unknown>): Promise<HandlerResult> {
    return validationError("batchPut is not supported for reports");
  },

  async patch(data: Record<string, unknown>): Promise<HandlerResult> {
    try {
      const reportData = data as unknown as Partial<ReportSyncData>;

      if (!reportData.id || typeof reportData.id !== "string") {
        return validationError("id is required");
      }

      if (!isValidObjectId(reportData.id)) {
        return validationError("Invalid id format");
      }

      // Build partial update object
      const updateFields: Record<string, unknown> = {};

      if (reportData.reportStatus) {
        updateFields.reportStatus = reportData.reportStatus;
      }
      if (reportData.jobTitle !== undefined) {
        updateFields.jobTitle = reportData.jobTitle || undefined;
      }
      if (reportData.location !== undefined) {
        updateFields.location = reportData.location || undefined;
      }
      if (reportData.cookingVolume !== undefined) {
        updateFields.cookingVolume = reportData.cookingVolume || undefined;
      }
      if (reportData.recommendedCleaningFrequency !== undefined) {
        updateFields.recommendedCleaningFrequency =
          reportData.recommendedCleaningFrequency ?? undefined;
      }
      if (reportData.comments !== undefined) {
        updateFields.comments = reportData.comments || undefined;
      }
      if (reportData.dateCompleted) {
        updateFields.dateCompleted = new Date(reportData.dateCompleted);
      }

      // Handle cleaning details (nested updates)
      if (reportData.cleaningDetails) {
        if (reportData.cleaningDetails.hoodCleaned !== undefined) {
          updateFields["cleaningDetails.hoodCleaned"] =
            reportData.cleaningDetails.hoodCleaned;
        }
        if (reportData.cleaningDetails.filtersCleaned !== undefined) {
          updateFields["cleaningDetails.filtersCleaned"] =
            reportData.cleaningDetails.filtersCleaned;
        }
        if (reportData.cleaningDetails.ductworkCleaned !== undefined) {
          updateFields["cleaningDetails.ductworkCleaned"] =
            reportData.cleaningDetails.ductworkCleaned;
        }
        if (reportData.cleaningDetails.fanCleaned !== undefined) {
          updateFields["cleaningDetails.fanCleaned"] =
            reportData.cleaningDetails.fanCleaned;
        }
      }

      // Handle inspection items (nested updates)
      if (reportData.inspectionItems) {
        if (reportData.inspectionItems.adequateAccessPanels !== undefined) {
          updateFields["inspectionItems.adequateAccessPanels"] =
            reportData.inspectionItems.adequateAccessPanels;
        }
      }

      if (Object.keys(updateFields).length === 0) {
        return validationError("No valid fields to update");
      }

      const result = await Report.findByIdAndUpdate(
        toObjectId(reportData.id),
        { $set: updateFields },
        { new: true, runValidators: true },
      );

      if (!result) {
        return notFoundError("Report not found");
      }

      return success({ report: result });
    } catch (error) {
      console.error("Report PATCH error:", error);
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

      const result = await Report.findByIdAndDelete(toObjectId(id));

      if (!result) {
        return notFoundError("Report not found");
      }

      return success({ deleted: true });
    } catch (error) {
      console.error("Report DELETE error:", error);
      return serverError(
        error instanceof Error ? error.message : "Unknown error",
      );
    }
  },
};
