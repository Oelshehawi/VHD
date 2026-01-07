"use client";

import { useRef, useState } from "react";
import { ScheduleType } from "../../app/lib/typeDefinitions";
import { useEstimatePhotoUpload } from "./hooks/useEstimatePhotoUpload";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Upload, X, CheckCircle, AlertCircle, Loader2, ImagePlus } from "lucide-react";
import { toast } from "sonner";
import { cn } from "../../app/lib/utils";

interface EstimatePhotoUploadProps {
  job: ScheduleType;
  userId: string;
  onUploadComplete: () => void;
}

interface FilePreview {
  file: File;
  previewUrl: string;
}

export default function EstimatePhotoUpload({
  job,
  userId,
  onUploadComplete,
}: EstimatePhotoUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<FilePreview[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const { uploadFiles, uploadProgress, isUploading, resetProgress } =
    useEstimatePhotoUpload();

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);

    // Create preview URLs
    const newPreviews: FilePreview[] = fileArray.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
    }));

    setSelectedFiles((prev) => [...prev, ...newPreviews]);

    // Reset input so the same file can be selected again if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(event.target.files);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    handleFiles(files);
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => {
      const updated = [...prev];
      // Revoke the blob URL to prevent memory leaks
      URL.revokeObjectURL(updated[index]!.previewUrl);
      updated.splice(index, 1);
      return updated;
    });
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      toast.error("Please select at least one photo to upload");
      return;
    }

    const files = selectedFiles.map((fp) => fp.file);
    const result = await uploadFiles(files, job, userId);

    if (result.successful > 0) {
      toast.success(
        `Successfully uploaded ${result.successful} photo${result.successful > 1 ? "s" : ""}`,
      );
    }

    if (result.failed > 0) {
      toast.error(
        `Failed to upload ${result.failed} photo${result.failed > 1 ? "s" : ""}`,
      );
    }

    // Clear previews
    selectedFiles.forEach((fp) => URL.revokeObjectURL(fp.previewUrl));
    setSelectedFiles([]);
    resetProgress();

    // Notify parent component to refresh the photo list
    onUploadComplete();
  };

  const handleCancel = () => {
    selectedFiles.forEach((fp) => URL.revokeObjectURL(fp.previewUrl));
    setSelectedFiles([]);
    resetProgress();
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Upload Estimate Photos</CardTitle>
          {selectedFiles.length > 0 && (
            <Badge variant="secondary">
              {selectedFiles.length} photo{selectedFiles.length > 1 ? "s" : ""} selected
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Drag and Drop Zone */}
        {selectedFiles.length === 0 && (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50 flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 transition-all",
              isDragging && "border-primary bg-primary/5 scale-[1.02]",
              isUploading && "pointer-events-none opacity-50"
            )}
          >
            <div className="flex flex-col items-center gap-2 text-center">
              <div className={cn(
                "bg-muted flex h-16 w-16 items-center justify-center rounded-full transition-colors",
                isDragging && "bg-primary/10"
              )}>
                <ImagePlus className={cn(
                  "text-muted-foreground h-8 w-8",
                  isDragging && "text-primary"
                )} />
              </div>
              <div className="space-y-1">
                <p className="text-foreground font-medium">
                  {isDragging ? "Drop photos here" : "Drag and drop photos"}
                </p>
                <p className="text-muted-foreground text-sm">
                  or click to browse
                </p>
              </div>
              <p className="text-muted-foreground text-xs">
                JPEG, PNG, or WebP (max 10MB each)
              </p>
            </div>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Preview Grid */}
        {selectedFiles.length > 0 && (
          <>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
              {selectedFiles.map((filePreview, index) => {
                const progress = uploadProgress[filePreview.file.name];

                return (
                  <div
                    key={index}
                    className="bg-muted group relative aspect-video overflow-hidden rounded-lg border"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={filePreview.previewUrl}
                      alt={filePreview.file.name}
                      className="h-full w-full object-cover"
                    />

                    {!isUploading && (
                      <Button
                        size="icon"
                        variant="destructive"
                        onClick={() => handleRemoveFile(index)}
                        className="absolute right-2 top-2 h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}

                    {progress && (
                      <div className="bg-background/95 absolute inset-0 flex flex-col items-center justify-center backdrop-blur-sm">
                        {progress.status === "uploading" && (
                          <Loader2 className="text-primary h-8 w-8 animate-spin" />
                        )}
                        {progress.status === "success" && (
                          <CheckCircle className="text-green-500 h-8 w-8" />
                        )}
                        {progress.status === "error" && (
                          <AlertCircle className="text-destructive h-8 w-8" />
                        )}
                        <p className="text-foreground mt-2 text-xs font-medium">
                          {progress.status === "uploading" &&
                            `${progress.progress}%`}
                          {progress.status === "success" && "Uploaded"}
                          {progress.status === "error" && "Failed"}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between gap-3 border-t pt-4">
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                variant="outline"
                size="sm"
              >
                <Upload className="mr-2 h-4 w-4" />
                Add More
              </Button>

              <div className="flex gap-2">
                <Button
                  onClick={handleCancel}
                  disabled={isUploading}
                  variant="outline"
                  size="sm"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpload}
                  disabled={isUploading}
                  size="sm"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload {selectedFiles.length} Photo{selectedFiles.length > 1 ? "s" : ""}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
