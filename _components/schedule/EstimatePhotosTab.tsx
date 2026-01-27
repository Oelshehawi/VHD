"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { useMutation } from "@tanstack/react-query";
import { ScheduleType } from "../../app/lib/typeDefinitions";
import { toPublicId } from "../../app/lib/imageUtils";
import { formatDateFns } from "../../app/lib/utils";
import { toast } from "sonner";
import EstimatePhotoUpload from "./EstimatePhotoUpload";
import EstimatePhotoGrid from "./EstimatePhotoGrid";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import Fullscreen from "yet-another-react-lightbox/plugins/fullscreen";
import Download from "yet-another-react-lightbox/plugins/download";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";
import "yet-another-react-lightbox/plugins/thumbnails.css";
import Counter from "yet-another-react-lightbox/plugins/counter";
import "yet-another-react-lightbox/plugins/counter.css";
import Captions from "yet-another-react-lightbox/plugins/captions";
import "yet-another-react-lightbox/plugins/captions.css";
import {
  deletePhoto,
  getSchedulePhotos,
} from "../../app/lib/actions/photos.actions";

interface EstimatePhotosTabProps {
  job: ScheduleType;
  onRefresh?: () => void;
}

export default function EstimatePhotosTab({
  job,
  onRefresh,
}: EstimatePhotosTabProps) {
  const { user } = useUser();

  // Lightbox state
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [estimatePhotos, setEstimatePhotos] = useState<
    {
      _id: string;
      url: string;
      timestamp: Date;
      technicianId: string;
      type: "estimate";
    }[]
  >([]);
  const [isLoadingPhotos, setIsLoadingPhotos] = useState(false);

  const fetchEstimatePhotos = useCallback(async () => {
    setIsLoadingPhotos(true);
    try {
      const data = await getSchedulePhotos(job._id.toString(), "estimate");
      setEstimatePhotos(
        data.map((photo) => ({
          _id: photo.id,
          url: photo.cloudinaryUrl,
          timestamp: new Date(photo.timestamp),
          technicianId: photo.technicianId,
          type: "estimate",
        })),
      );
    } catch (error) {
      console.error("Failed to load estimate photos:", error);
      toast.error("Failed to load estimate photos");
    } finally {
      setIsLoadingPhotos(false);
    }
  }, [job._id]);

  useEffect(() => {
    if (job?._id) {
      void fetchEstimatePhotos();
    }
  }, [job?._id, fetchEstimatePhotos]);

  // Prepare lightbox slides
  const lightboxSlides = useMemo(() => {
    const getOptimizedUrl = (url: string): string => {
      const publicId = toPublicId(url);
      if (!publicId) return url;

      return `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/f_auto,q_auto,dpr_auto,w_1600/${publicId}`;
    };

    return estimatePhotos.map((photo, idx) => {
      const optimizedUrl = getOptimizedUrl(photo.url);
      return {
        src: optimizedUrl,
        title: "Estimate Reference Photo",
        description: `Uploaded on: ${formatDateFns(photo.timestamp)}`,
        downloadUrl: optimizedUrl,
        downloadFilename: `estimate-photo-${idx + 1}.jpg`,
      };
    });
  }, [estimatePhotos]);

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (photoId: string) => {
      return deletePhoto(photoId);
    },
    onSuccess: () => {
      toast.success("Photo deleted successfully");
      void fetchEstimatePhotos();
    },
    onError: (error: Error) => {
      console.error("Failed to delete photo:", error);
      toast.error(error.message || "Failed to delete photo");
    },
  });

  const handlePhotoClick = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const handleDelete = (photoId: string) => {
    deleteMutation.mutate(photoId);
  };

  const handleUploadComplete = () => {
    // Invalidate queries to refetch the job data
    void fetchEstimatePhotos();
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-muted-foreground">Please sign in to manage photos</p>
      </div>
    );
  }

  return (
    <>
      <EstimatePhotoUpload
        job={job}
        userId={user.id}
        onUploadComplete={handleUploadComplete}
      />

      <EstimatePhotoGrid
        photos={estimatePhotos}
        onDelete={handleDelete}
        onPhotoClick={handlePhotoClick}
        isDeleting={deleteMutation.isPending}
      />

      <Lightbox
        open={lightboxOpen}
        close={() => setLightboxOpen(false)}
        index={lightboxIndex}
        slides={lightboxSlides}
        plugins={[Zoom, Fullscreen, Download, Thumbnails, Counter, Captions]}
        captions={{
          showToggle: true,
          descriptionTextAlign: "center",
        }}
        zoom={{
          maxZoomPixelRatio: 3,
          scrollToZoom: true,
        }}
        thumbnails={{
          position: "bottom",
          width: 120,
          height: 80,
          border: 1,
          borderRadius: 4,
          padding: 4,
          gap: 16,
        }}
        counter={{
          container: { style: { top: "unset", bottom: 0 } },
        }}
      />
    </>
  );
}
