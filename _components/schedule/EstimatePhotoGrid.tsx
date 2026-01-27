"use client";

import { useState } from "react";
import { PhotoType } from "../../app/lib/typeDefinitions";
import { CldImage } from "next-cloudinary";
import { toPublicId } from "../../app/lib/imageUtils";
import { Trash2, FileImage } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";

interface EstimatePhotoGridProps {
  photos: PhotoType[];
  onDelete: (photoId: string) => void;
  onPhotoClick: (index: number) => void;
  isDeleting?: boolean;
}

export default function EstimatePhotoGrid({
  photos,
  onDelete,
  onPhotoClick,
  isDeleting = false,
}: EstimatePhotoGridProps) {
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleDeleteClick = (e: React.MouseEvent, photoId: string) => {
    e.stopPropagation();
    setDeleteConfirmId(photoId);
  };

  const handleConfirmDelete = () => {
    if (deleteConfirmId) {
      onDelete(deleteConfirmId);
      setDeleteConfirmId(null);
    }
  };

  if (photos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <FileImage className="text-muted-foreground mb-4 h-16 w-16" />
        <h3 className="text-foreground mb-2 text-lg font-medium">
          No Estimate Photos
        </h3>
        <p className="text-muted-foreground text-sm">
          Upload reference photos from the estimate to help technicians
          understand the job scope.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {photos.map((photo, index) => {
          const publicId = toPublicId(photo.url);

          return (
            <div
              key={photo._id.toString()}
              className="group relative aspect-video cursor-pointer overflow-hidden rounded-lg transition-transform hover:scale-105"
              onClick={() => onPhotoClick(index)}
            >
              {publicId ? (
                <CldImage
                  src={publicId}
                  alt="Estimate reference photo"
                  width={800}
                  height={600}
                  crop="fill"
                  format="auto"
                  quality="auto"
                  dpr="auto"
                  className="h-full w-full object-cover"
                />
              ) : (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={photo.url}
                  alt="Estimate reference photo"
                  className="h-full w-full object-cover"
                />
              )}

              <div className="absolute inset-0 bg-black opacity-0 transition-opacity group-hover:opacity-20" />

              <button
                onClick={(e) => handleDeleteClick(e, photo._id.toString())}
                disabled={isDeleting}
                className="absolute top-2 right-2 rounded-full bg-red-500 p-2 text-white opacity-0 shadow-lg transition-all group-hover:opacity-100 hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Delete photo"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>

      <AlertDialog
        open={!!deleteConfirmId}
        onOpenChange={(open) => !open && setDeleteConfirmId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Estimate Photo?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              estimate photo from both the database and cloud storage.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
