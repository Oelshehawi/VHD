"use client";

import { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "../../ui/dialog";
import { Button } from "../../ui/button";
import MediaDisplay from "../../invoices/MediaDisplay";

interface PhotoType {
  _id: string;
  url: string;
  timestamp: Date;
  technicianId: string;
  type: "before" | "after";
}

interface PhotoGalleryModalProps {
  photos: PhotoType[];
  isOpen: boolean;
  onClose: () => void;
}

const PhotoGalleryModal = ({
  photos,
  isOpen,
  onClose,
}: PhotoGalleryModalProps) => {
  const beforePhotos = photos.filter((photo) => photo.type === "before").length;
  const afterPhotos = photos.filter((photo) => photo.type === "after").length;

  const handleModalClose = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  // Prevent clicks inside content from bubbling to overlay
  const handleContentClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      e.stopPropagation();
    },
    [],
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleModalClose}>
      <DialogContent
        className="flex max-h-[90vh] max-w-7xl flex-col overflow-hidden p-0"
        onClick={handleContentClick}
      >
        {/* Header */}
        <DialogHeader className="from-primary to-primary/80 shrink-0 bg-gradient-to-r px-6 py-4">
          <DialogTitle className="text-primary-foreground text-lg font-semibold">
            Service Photos
            {beforePhotos > 0 && afterPhotos > 0 && (
              <span className="text-primary-foreground/80 ml-2 text-sm font-normal">
                ({beforePhotos} before, {afterPhotos} after)
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6" data-lightbox="container">
          <MediaDisplay photos={photos} signature={null} />
        </div>

        {/* Footer */}
        <DialogFooter className="border-border bg-muted/50 shrink-0 border-t px-6 py-3">
          <DialogClose asChild>
            <Button variant="secondary">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PhotoGalleryModal;
