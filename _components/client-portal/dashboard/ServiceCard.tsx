"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarIcon,
  MapPinIcon,
  CheckCircleIcon,
  PhotoIcon,
  ClockIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { ObjectId } from "mongodb";
import { formatDateStringUTC } from "../../../app/lib/utils";
import MediaDisplay from "../../invoices/MediaDisplay";
import { createPortal } from "react-dom";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import { Card, CardHeader, CardTitle } from "../../ui/card";

interface PhotoType {
  _id: string;
  url: string;
  timestamp: Date;
  technicianId: string;
  type: "before" | "after";
}

// Define the Schedule type to match what's coming from the API
export interface ScheduleType {
  _id: string | ObjectId;
  jobTitle?: string;
  startDateTime: string | Date;
  location?: string;
  confirmed?: boolean;
  photos?: PhotoType[];
  dateDue?: string | Date;
}

export interface ServiceCardProps {
  service: ScheduleType;
  upcoming: boolean;
}

const ServiceCard = ({ service, upcoming }: ServiceCardProps) => {
  const [showPhotoGallery, setShowPhotoGallery] = useState(false);

  // Format date and time for display
  const formatDateTime = (dateInput: string | Date) => {
    const date =
      typeof dateInput === "string" ? new Date(dateInput) : dateInput;
    return date.toLocaleString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZoneName: "short",
    });
  };

  const hasPhotos = service.photos && service.photos.length > 0;
  const photos = service.photos || [];

  // Count before and after photos
  const beforePhotos = photos.filter((photo) => photo.type === "before").length;
  const afterPhotos = photos.filter((photo) => photo.type === "after").length;

  // Get badge variant based on status
  const getBadgeVariant = () => {
    if (upcoming) {
      return service.confirmed ? "default" : "secondary";
    }
    return service.confirmed ? "default" : "outline";
  };

  // Get badge text based on status
  const getBadgeText = () => {
    if (upcoming) {
      return service.confirmed ? "Confirmed" : "Scheduled";
    }
    return service.confirmed ? "Completed" : "Partial";
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        whileHover={{ scale: 1.01, transition: { duration: 0.2 } }}
        className="hover:bg-muted/50 overflow-hidden p-4 transition-colors sm:p-5"
      >
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-foreground text-base font-medium sm:text-lg">
            {service.jobTitle || "Kitchen Exhaust Service"}
          </h3>
          <Badge variant={getBadgeVariant()} className="w-fit">
            {getBadgeText()}
          </Badge>
        </div>

        <div className="space-y-2">
          <div className="text-muted-foreground flex items-center">
            <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
            <span className="text-sm">
              {formatDateTime(service.startDateTime)}
            </span>
          </div>

          {upcoming && service.dateDue && (
            <div className="flex items-center text-orange-600 dark:text-orange-400">
              <ClockIcon className="mr-2 h-4 w-4 shrink-0" />
              <span className="text-sm font-medium">
                Due: {formatDateStringUTC(service.dateDue)}
              </span>
            </div>
          )}

          {!upcoming && service.dateDue && (
            <div className="text-primary flex items-center">
              <ClockIcon className="mr-2 h-4 w-4 shrink-0" />
              <span className="text-sm font-medium">
                Next Due: {formatDateStringUTC(service.dateDue)}
              </span>
            </div>
          )}

          {service.location && (
            <div className="text-muted-foreground flex items-center">
              <MapPinIcon className="mr-2 h-4 w-4 shrink-0" />
              <span className="truncate text-sm">{service.location}</span>
            </div>
          )}

          {hasPhotos && !upcoming && (
            <div className="mt-3 flex items-center">
              <PhotoIcon className="text-primary mr-2 h-4 w-4 shrink-0" />
              <button
                onClick={() => setShowPhotoGallery(true)}
                className="text-primary hover:text-primary/80 text-sm hover:underline"
              >
                View {photos.length} photo{photos.length !== 1 ? "s" : ""}
                {beforePhotos > 0 &&
                  afterPhotos > 0 &&
                  ` (${beforePhotos} before, ${afterPhotos} after)`}
              </button>
            </div>
          )}
        </div>

        {upcoming && service.confirmed && (
          <div className="mt-3 flex items-center text-green-600 dark:text-green-400">
            <CheckCircleIcon className="mr-1 h-4 w-4 shrink-0" />
            <span className="text-xs font-medium">Appointment confirmed</span>
          </div>
        )}
      </motion.div>

      {/* Photo Gallery Modal */}
      {showPhotoGallery &&
        typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
              onClick={() => setShowPhotoGallery(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-background relative max-h-[90vh] w-full max-w-7xl overflow-hidden rounded-lg shadow-xl"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <Card className="rounded-none border-0 border-b shadow-none">
                  <CardHeader className="from-primary to-primary/80 bg-gradient-to-r py-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-primary-foreground text-lg">
                        Service Photos
                      </CardTitle>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowPhotoGallery(false)}
                        className="text-primary-foreground hover:bg-white/20"
                      >
                        <XMarkIcon className="h-6 w-6" />
                      </Button>
                    </div>
                  </CardHeader>
                </Card>

                {/* Content */}
                <div className="max-h-[70vh] overflow-y-auto p-4">
                  <MediaDisplay photos={photos} signature={null} />
                </div>

                {/* Footer */}
                <div className="border-border bg-muted/50 border-t px-4 py-3">
                  <div className="flex justify-end">
                    <Button
                      variant="secondary"
                      onClick={() => setShowPhotoGallery(false)}
                    >
                      Close
                    </Button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
};

export default ServiceCard;
