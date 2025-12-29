import { useState } from "react";
import { ScheduleType } from "../../../app/lib/typeDefinitions";
import toast from "react-hot-toast";

export interface UploadProgress {
  fileName: string;
  status: "pending" | "uploading" | "success" | "error";
  progress: number;
  error?: string;
}

interface UploadResult {
  successful: number;
  failed: number;
  errors: string[];
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export const useEstimatePhotoUpload = () => {
  const [uploadProgress, setUploadProgress] = useState<
    Record<string, UploadProgress>
  >({});
  const [isUploading, setIsUploading] = useState(false);

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return `${file.name}: Invalid file type. Only JPEG, PNG, and WebP images are allowed.`;
    }
    if (file.size > MAX_FILE_SIZE) {
      return `${file.name}: File size exceeds 10MB limit.`;
    }
    return null;
  };

  const uploadSingleFile = async (
    file: File,
    job: ScheduleType,
    userId: string,
  ): Promise<boolean> => {
    // Update progress to uploading
    setUploadProgress((prev) => ({
      ...prev,
      [file.name]: { fileName: file.name, status: "uploading", progress: 0 },
    }));

    try {
      // Step 1: Get signed upload parameters from Cloudinary API
      const tokenResponse = await fetch("/api/cloudinaryUpload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          mediaType: "image",
          jobTitle: job.jobTitle,
          type: "estimate",
          startDate: job.startDateTime,
        }),
      });

      if (!tokenResponse.ok) {
        throw new Error("Failed to get upload token");
      }

      const { apiKey, timestamp, signature, cloudName, folderPath } =
        await tokenResponse.json();

      // Update progress
      setUploadProgress((prev) => ({
        ...prev,
        [file.name]: { fileName: file.name, status: "uploading", progress: 33 },
      }));

      // Step 2: Upload file directly to Cloudinary
      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", apiKey);
      formData.append("timestamp", timestamp.toString());
      formData.append("signature", signature);
      formData.append("folder", folderPath);

      const uploadResponse = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: "POST",
          body: formData,
        },
      );

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(
          errorData.error?.message || "Cloudinary upload failed",
        );
      }

      const cloudinaryResult = await uploadResponse.json();
      const cloudinaryUrl = cloudinaryResult.secure_url;

      // Update progress
      setUploadProgress((prev) => ({
        ...prev,
        [file.name]: { fileName: file.name, status: "uploading", progress: 66 },
      }));

      // Step 3: Save photo metadata to MongoDB
      const saveResponse = await fetch("/api/update-photos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cloudinaryUrl,
          type: "estimate",
          technicianId: userId,
          scheduleId: job._id,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!saveResponse.ok) {
        throw new Error("Failed to save photo metadata");
      }

      // Success
      setUploadProgress((prev) => ({
        ...prev,
        [file.name]: {
          fileName: file.name,
          status: "success",
          progress: 100,
        },
      }));

      return true;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      setUploadProgress((prev) => ({
        ...prev,
        [file.name]: {
          fileName: file.name,
          status: "error",
          progress: 0,
          error: errorMessage,
        },
      }));

      return false;
    }
  };

  const uploadFiles = async (
    files: File[],
    job: ScheduleType,
    userId: string,
  ): Promise<UploadResult> => {
    setIsUploading(true);

    // Validate all files first
    const validationErrors: string[] = [];
    const validFiles: File[] = [];

    for (const file of files) {
      const error = validateFile(file);
      if (error) {
        validationErrors.push(error);
      } else {
        validFiles.push(file);
        // Initialize progress
        setUploadProgress((prev) => ({
          ...prev,
          [file.name]: {
            fileName: file.name,
            status: "pending",
            progress: 0,
          },
        }));
      }
    }

    // Show validation errors
    if (validationErrors.length > 0) {
      validationErrors.forEach((error) => toast.error(error));
    }

    // Upload valid files sequentially
    let successful = 0;
    let failed = 0;
    const uploadErrors: string[] = [];

    for (const file of validFiles) {
      const success = await uploadSingleFile(file, job, userId);
      if (success) {
        successful++;
      } else {
        failed++;
        const progress = uploadProgress[file.name];
        if (progress?.error) {
          uploadErrors.push(`${file.name}: ${progress.error}`);
        }
      }
    }

    setIsUploading(false);

    return {
      successful,
      failed,
      errors: [...validationErrors, ...uploadErrors],
    };
  };

  const resetProgress = () => {
    setUploadProgress({});
  };

  return {
    uploadFiles,
    uploadProgress,
    isUploading,
    resetProgress,
  };
};
