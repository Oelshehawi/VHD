import { v2 as cloudinary } from "cloudinary";
import { Photo, Schedule } from "../../../../models/reactDataSchema";
import { HandlerResult, TableHandler, PhotoType, SkippedItem } from "../types";
import { PhotoRecordType } from "../../../lib/typeDefinitions";
import {
  isValidObjectId,
  toObjectId,
  validationError,
  notFoundError,
  serverError,
  success,
} from "../utils/validation";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

function extractPublicId(cloudinaryUrl: string): string | null {
  const matches = cloudinaryUrl.match(/\/upload\/(?:v\d+\/)?(.+?)\./);
  return matches?.[1] ?? null;
}

const validPhotoTypes: PhotoType[] = [
  "before",
  "after",
  "estimate",
  "signature",
];

export const photosHandler: TableHandler = {
  async put(data: Record<string, unknown>): Promise<HandlerResult> {
    try {
      const {
        id,
        scheduleId,
        cloudinaryUrl,
        type,
        technicianId,
        timestamp,
        signerName,
      } = data;

      if (!id || typeof id !== "string") {
        return validationError("id is required");
      }

      if (!isValidObjectId(id)) {
        return validationError("Invalid id format");
      }

      if (!scheduleId || typeof scheduleId !== "string") {
        return validationError("scheduleId is required");
      }

      if (!isValidObjectId(scheduleId)) {
        return validationError("Invalid scheduleId format");
      }

      if (!type || !validPhotoTypes.includes(type as PhotoType)) {
        return validationError(
          `type must be one of: ${validPhotoTypes.join(", ")}`,
        );
      }

      if (!technicianId || typeof technicianId !== "string") {
        return validationError("technicianId is required");
      }

      if (type === "signature" && !signerName) {
        return validationError("signerName is required for signature uploads");
      }

      // Verify schedule exists
      const schedule = await Schedule.findById(toObjectId(scheduleId));
      if (!schedule) {
        return validationError("Referenced schedule does not exist");
      }

      const result = await Photo.findByIdAndUpdate(
        toObjectId(id),
        {
          $set: {
            scheduleId: toObjectId(scheduleId),
            cloudinaryUrl: cloudinaryUrl ?? null,
            type,
            technicianId,
            timestamp: timestamp ? new Date(timestamp as string) : new Date(),
            signerName: signerName ?? null,
          },
        },
        { upsert: true, new: true, runValidators: true },
      );

      return success({ photo: result });
    } catch (error) {
      console.error("Photo PUT error:", error);
      return serverError(
        error instanceof Error ? error.message : "Unknown error",
      );
    }
  },
  async batchPut(data: Record<string, unknown>): Promise<HandlerResult> {
    try {
      const photosInput = Array.isArray(data)
        ? data
        : Array.isArray(data.photos)
          ? data.photos
          : data.photo
            ? [data.photo]
            : "scheduleId" in data
              ? [data]
              : [];

      if (photosInput.length === 0) {
        return validationError("photos array is required");
      }

      const photos = photosInput as Record<string, unknown>[];
      const skippedItems: SkippedItem[] = [];
      const validPhotos: Record<string, unknown>[] = [];
      const scheduleIds = new Set<string>();

      for (const photo of photos) {
        const id = photo.id;
        const scheduleId = photo.scheduleId;
        const cloudinaryUrl = photo.cloudinaryUrl;
        const type = photo.type;
        const technicianId = photo.technicianId;
        const signerName = photo.signerName;

        if (!id || typeof id !== "string") {
          skippedItems.push({
            id: typeof id === "string" ? id : "unknown",
            reason: "id is required",
            code: "VALIDATION_ERROR",
          });
          continue;
        }

        if (!isValidObjectId(id)) {
          skippedItems.push({
            id,
            reason: "Invalid id format",
            code: "VALIDATION_ERROR",
          });
          continue;
        }

        if (!scheduleId || typeof scheduleId !== "string") {
          skippedItems.push({
            id,
            reason: "scheduleId is required",
            code: "VALIDATION_ERROR",
          });
          continue;
        }

        if (!isValidObjectId(scheduleId)) {
          skippedItems.push({
            id,
            reason: "Invalid scheduleId format",
            code: "VALIDATION_ERROR",
          });
          continue;
        }

        if (!type || !validPhotoTypes.includes(type as PhotoType)) {
          skippedItems.push({
            id,
            reason: `type must be one of: ${validPhotoTypes.join(", ")}`,
            code: "VALIDATION_ERROR",
          });
          continue;
        }

        if (!technicianId || typeof technicianId !== "string") {
          skippedItems.push({
            id,
            reason: "technicianId is required",
            code: "VALIDATION_ERROR",
          });
          continue;
        }

        if (type === "signature" && !signerName) {
          skippedItems.push({
            id,
            reason: "signerName is required for signature uploads",
            code: "VALIDATION_ERROR",
          });
          continue;
        }

        if (
          cloudinaryUrl !== undefined &&
          cloudinaryUrl !== null &&
          typeof cloudinaryUrl !== "string"
        ) {
          skippedItems.push({
            id,
            reason: "Invalid cloudinaryUrl",
            code: "VALIDATION_ERROR",
          });
          continue;
        }

        scheduleIds.add(scheduleId);
        validPhotos.push(photo);
      }

      if (validPhotos.length > 0) {
        const scheduleIdArray = Array.from(scheduleIds);
        const schedules = await Schedule.find({
          _id: { $in: scheduleIdArray.map((id) => toObjectId(id)) },
        }).select("_id");

        const existingScheduleIds = new Set(
          schedules.map((schedule) => schedule._id.toString()),
        );

        const filteredPhotos: Record<string, unknown>[] = [];
        for (const photo of validPhotos) {
          const scheduleId = photo.scheduleId as string;
          if (!existingScheduleIds.has(scheduleId)) {
            skippedItems.push({
              id: photo.id as string,
              reason: "Referenced schedule does not exist",
              code: "MISSING_REFERENCE",
            });
            continue;
          }
          filteredPhotos.push(photo);
        }

        if (filteredPhotos.length > 0) {
          const bulkOps = filteredPhotos.map((photo) => ({
            updateOne: {
              filter: { _id: toObjectId(photo.id as string) },
              update: {
                $set: {
                  scheduleId: toObjectId(photo.scheduleId as string),
                  cloudinaryUrl: photo.cloudinaryUrl ?? null,
                  type: photo.type,
                  technicianId: photo.technicianId,
                  timestamp: photo.timestamp
                    ? new Date(photo.timestamp as string)
                    : new Date(),
                  signerName: photo.signerName ?? null,
                },
              },
              upsert: true,
            },
          }));

          const result = await Photo.bulkWrite(bulkOps);

          return success({
            matched: result.matchedCount,
            modified: result.modifiedCount,
            upserted: result.upsertedCount,
            skipped: skippedItems.length,
            skippedItems,
          });
        }
      }

      return success({
        matched: 0,
        modified: 0,
        upserted: 0,
        skipped: skippedItems.length,
        skippedItems,
      });
    } catch (error) {
      console.error("Photo batch PUT error:", error);
      return serverError(
        error instanceof Error ? error.message : "Unknown error",
      );
    }
  },
  async batchPatch(
    data: Record<string, unknown>[] | Record<string, unknown>,
  ): Promise<HandlerResult> {
    try {
      const items = Array.isArray(data)
        ? data
        : Array.isArray((data as Record<string, unknown>).photos)
          ? ((data as Record<string, unknown>).photos as Record<
              string,
              unknown
            >[])
          : [];

      if (items.length === 0) {
        return validationError("photos array is required");
      }

      const skippedItems: SkippedItem[] = [];
      const ids: string[] = [];
      const scheduleIds = new Set<string>();
      const validItems: Record<string, unknown>[] = [];

      for (const item of items) {
        const id = item.id;
        if (!id || typeof id !== "string") {
          skippedItems.push({
            id: typeof id === "string" ? id : "unknown",
            reason: "id is required",
            code: "VALIDATION_ERROR",
          });
          continue;
        }
        if (!isValidObjectId(id)) {
          skippedItems.push({
            id,
            reason: "Invalid id format",
            code: "VALIDATION_ERROR",
          });
          continue;
        }
        ids.push(id);

        if ("scheduleId" in item) {
          if (
            !item.scheduleId ||
            typeof item.scheduleId !== "string" ||
            !isValidObjectId(item.scheduleId)
          ) {
            skippedItems.push({
              id,
              reason: "Invalid scheduleId format",
              code: "VALIDATION_ERROR",
            });
            continue;
          }
          scheduleIds.add(item.scheduleId);
        }

        if ("type" in item) {
          if (!item.type || !validPhotoTypes.includes(item.type as PhotoType)) {
            skippedItems.push({
              id,
              reason: `type must be one of: ${validPhotoTypes.join(", ")}`,
              code: "VALIDATION_ERROR",
            });
            continue;
          }
        }

        if ("technicianId" in item) {
          if (!item.technicianId || typeof item.technicianId !== "string") {
            skippedItems.push({
              id,
              reason: "technicianId is required",
              code: "VALIDATION_ERROR",
            });
            continue;
          }
        }

        if ("timestamp" in item) {
          if (typeof item.timestamp !== "string") {
            skippedItems.push({
              id,
              reason: "Invalid timestamp",
              code: "VALIDATION_ERROR",
            });
            continue;
          }
          const parsed = new Date(item.timestamp);
          if (Number.isNaN(parsed.getTime())) {
            skippedItems.push({
              id,
              reason: "Invalid timestamp",
              code: "VALIDATION_ERROR",
            });
            continue;
          }
        }

        if ("cloudinaryUrl" in item) {
          if (
            item.cloudinaryUrl !== null &&
            typeof item.cloudinaryUrl !== "string"
          ) {
            skippedItems.push({
              id,
              reason: "Invalid cloudinaryUrl",
              code: "VALIDATION_ERROR",
            });
            continue;
          }
        }

        if ("signerName" in item) {
          if (
            item.signerName !== null &&
            item.signerName !== undefined &&
            typeof item.signerName !== "string"
          ) {
            skippedItems.push({
              id,
              reason: "Invalid signerName",
              code: "VALIDATION_ERROR",
            });
            continue;
          }
        }

        validItems.push(item);
      }

      if (validItems.length === 0) {
        return success({
          matched: 0,
          modified: 0,
          skipped: skippedItems.length,
          skippedItems,
        });
      }

      const existingPhotos = await Photo.find({
        _id: { $in: ids.map((id) => toObjectId(id)) },
      }).lean<PhotoRecordType[]>();

      const existingById = new Map(
        existingPhotos.map((photo) => [photo._id.toString(), photo]),
      );

      if (scheduleIds.size > 0) {
        const scheduleIdArray = Array.from(scheduleIds);
        const schedules = await Schedule.find({
          _id: { $in: scheduleIdArray.map((sid) => toObjectId(sid)) },
        }).select("_id");

        const existingScheduleIds = new Set(
          schedules.map((schedule) => schedule._id.toString()),
        );

        for (const item of validItems) {
          if ("scheduleId" in item) {
            const scheduleId = item.scheduleId as string;
            if (!existingScheduleIds.has(scheduleId)) {
              skippedItems.push({
                id: item.id as string,
                reason: "Referenced schedule does not exist",
                code: "MISSING_REFERENCE",
              });
              item._skip = true;
            }
          }
        }
      }

      const bulkOps = [];

      for (const item of validItems) {
        if (item._skip) {
          continue;
        }
        const updateData: Record<string, unknown> = {};
        const existingPhoto = existingById.get(item.id as string);

        if (!existingPhoto) {
          skippedItems.push({
            id: item.id as string,
            reason: "Photo not found",
            code: "NOT_FOUND",
          });
          continue;
        }

        if ("scheduleId" in item) {
          updateData.scheduleId = toObjectId(item.scheduleId as string);
        }

        if ("cloudinaryUrl" in item) {
          updateData.cloudinaryUrl = item.cloudinaryUrl ?? null;
        }

        if ("type" in item) {
          updateData.type = item.type;
        }

        if ("technicianId" in item) {
          updateData.technicianId = item.technicianId;
        }

        if ("timestamp" in item) {
          updateData.timestamp = new Date(item.timestamp as string);
        }

        if ("signerName" in item) {
          updateData.signerName = item.signerName ?? null;
        }

        if (Object.keys(updateData).length === 0) {
          skippedItems.push({
            id: item.id as string,
            reason: "No fields to update",
            code: "EMPTY_UPDATE",
          });
          continue;
        }

        const finalType =
          ("type" in item ? (item.type as PhotoType) : existingPhoto?.type) ??
          null;
        const finalSignerName =
          "signerName" in item
            ? (item.signerName as string | null | undefined)
            : existingPhoto?.signerName;

        if (finalType === "signature" && !finalSignerName) {
          skippedItems.push({
            id: item.id as string,
            reason: "signerName is required for signature photos",
            code: "VALIDATION_ERROR",
          });
          continue;
        }

        bulkOps.push({
          updateOne: {
            filter: { _id: toObjectId(item.id as string) },
            update: { $set: updateData },
          },
        });
      }

      if (bulkOps.length === 0) {
        return success({
          matched: 0,
          modified: 0,
          skipped: skippedItems.length,
          skippedItems,
        });
      }

      const result = await Photo.bulkWrite(bulkOps);

      return success({
        matched: result.matchedCount,
        modified: result.modifiedCount,
        skipped: skippedItems.length,
        skippedItems,
      });
    } catch (error) {
      console.error("Photo batch PATCH error:", error);
      return serverError(
        error instanceof Error ? error.message : "Unknown error",
      );
    }
  },

  async patch(data: Record<string, unknown>): Promise<HandlerResult> {
    try {
      const { id, scheduleId, type, signerName, ...otherFields } = data;

      if (!id || typeof id !== "string") {
        return validationError("id is required");
      }

      if (!isValidObjectId(id)) {
        return validationError("Invalid id format");
      }

      const updateData: Record<string, unknown> = { ...otherFields };

      if (scheduleId !== undefined) {
        if (!isValidObjectId(scheduleId as string)) {
          return validationError("Invalid scheduleId format");
        }
        // Verify schedule exists
        const schedule = await Schedule.findById(
          toObjectId(scheduleId as string),
        );
        if (!schedule) {
          return validationError("Referenced schedule does not exist");
        }
        updateData.scheduleId = toObjectId(scheduleId as string);
      }

      if (type !== undefined) {
        if (!validPhotoTypes.includes(type as PhotoType)) {
          return validationError(
            `type must be one of: ${validPhotoTypes.join(", ")}`,
          );
        }
        updateData.type = type;
      }

      if (signerName !== undefined) {
        updateData.signerName = signerName;
      }

      // Check signature requirement
      const existingPhoto = await Photo.findById(toObjectId(id));
      if (!existingPhoto) {
        return notFoundError("Photo not found");
      }

      const finalType = (type as PhotoType) ?? existingPhoto.type;
      const finalSignerName = signerName ?? existingPhoto.signerName;
      if (finalType === "signature" && !finalSignerName) {
        return validationError("signerName is required for signature photos");
      }

      const result = await Photo.findByIdAndUpdate(
        toObjectId(id),
        { $set: updateData },
        { new: true, runValidators: true },
      );

      return success({ photo: result });
    } catch (error) {
      console.error("Photo PATCH error:", error);
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

      const photo = await Photo.findById(toObjectId(id));

      if (!photo) {
        // Idempotent: photo already deleted is success
        return success({ deleted: true, alreadyDeleted: true });
      }

      // Delete from Cloudinary if URL exists
      if (photo.cloudinaryUrl) {
        const publicId = extractPublicId(photo.cloudinaryUrl);
        if (publicId) {
          try {
            const cloudinaryResult =
              await cloudinary.uploader.destroy(publicId);
            if (
              cloudinaryResult.result !== "ok" &&
              cloudinaryResult.result !== "not found"
            ) {
              console.error("Cloudinary deletion failed:", cloudinaryResult);
              return {
                success: false,
                status: 500,
                error: "CLOUDINARY_ERROR",
                message:
                  "Failed to delete image from Cloudinary. Photo retained for retry.",
                data: { id, cloudinaryResult },
              };
            }
          } catch (cloudinaryError) {
            console.error("Cloudinary deletion error:", cloudinaryError);
            return {
              success: false,
              status: 500,
              error: "CLOUDINARY_ERROR",
              message:
                cloudinaryError instanceof Error
                  ? cloudinaryError.message
                  : "Unknown Cloudinary error. Photo retained for retry.",
              data: { id },
            };
          }
        }
      }

      await Photo.deleteOne({ _id: toObjectId(id) });

      return success({ deleted: true });
    } catch (error) {
      console.error("Photo DELETE error:", error);
      return serverError(
        error instanceof Error ? error.message : "Unknown error",
      );
    }
  },
};
