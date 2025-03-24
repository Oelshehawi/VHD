"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarIcon,
  MapPinIcon,
  CheckCircleIcon,
  PhotoIcon,
} from "@heroicons/react/24/outline";
import { ObjectId } from "mongodb";
import { formatDateFns } from "../../../app/lib/utils";
import MediaDisplay from "../../invoices/MediaDisplay";
import { createPortal } from "react-dom";

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
}

export interface ServiceCardProps {
  service: ScheduleType;
  upcoming: boolean;
}

const ServiceCard = ({ service, upcoming }: ServiceCardProps) => {
  const [showPhotoGallery, setShowPhotoGallery] = useState(false);

  // Format date if it's a Date object
  const dateString = formatDateFns(service.startDateTime);

  const hasPhotos = service.photos && service.photos.length > 0;
  const photos = service.photos || [];

  // Count before and after photos
  const beforePhotos = photos.filter((photo) => photo.type === "before").length;
  const afterPhotos = photos.filter((photo) => photo.type === "after").length;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        whileHover={{ scale: 1.01, transition: { duration: 0.2 } }}
        className="overflow-hidden p-4 hover:bg-gray-50 sm:p-5"
      >
        <div className="mb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <h3 className="mb-2 text-base font-medium text-gray-900 sm:mb-0 sm:text-lg">
            {service.jobTitle || "Kitchen Exhaust Service"}
          </h3>
          <span
            className={`self-start rounded-full px-2 py-1 text-xs font-semibold sm:self-auto sm:px-3 sm:py-1 ${
              upcoming
                ? service.confirmed
                  ? "bg-green-100 text-green-800"
                  : "bg-blue-100 text-blue-800"
                : service.confirmed
                  ? "bg-indigo-100 text-indigo-800"
                  : "bg-gray-100 text-gray-800"
            }`}
          >
            {upcoming
              ? service.confirmed
                ? "Confirmed"
                : "Scheduled"
              : service.confirmed
                ? "Completed"
                : "Partial"}
          </span>
        </div>

        <div className="space-y-2">
          <div className="flex items-center text-gray-600">
            <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
            <span className="text-sm">{dateString}</span>
          </div>

          {service.location && (
            <div className="flex items-center text-gray-600">
              <MapPinIcon className="mr-2 h-4 w-4 flex-shrink-0" />
              <span className="truncate text-sm">{service.location}</span>
            </div>
          )}

          {hasPhotos && !upcoming && (
            <div className="mt-3 flex items-center">
              <PhotoIcon className="mr-2 h-4 w-4 flex-shrink-0 text-darkGreen" />
              <button
                onClick={() => setShowPhotoGallery(true)}
                className="text-sm text-darkGreen hover:underline"
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
          <div className="mt-3 flex items-center text-green-600">
            <CheckCircleIcon className="mr-1 h-4 w-4 flex-shrink-0" />
            <span className="text-xs font-medium">Appointment confirmed</span>
          </div>
        )}
      </motion.div>

      {/* Photo Gallery Modal */}
      {showPhotoGallery &&
        createPortal(
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-black/80 fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
              onClick={() => setShowPhotoGallery(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="relative max-h-[90vh] w-full max-w-7xl overflow-hidden rounded-lg bg-white shadow-xl"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="bg-gradient-to-r from-green-600 to-green-900 px-4 py-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-white">
                      Service Photos
                    </h2>
                    <button
                      onClick={() => setShowPhotoGallery(false)}
                      className="rounded-full p-1 text-white transition-colors hover:bg-green-800/70"
                    >
                      <svg
                        className="h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="max-h-[70vh] overflow-y-auto p-4">
                  <MediaDisplay photos={photos} signature={null} />
                </div>

                {/* Footer */}
                <div className="border-t border-gray-200 bg-gray-50 px-4 py-3">
                  <div className="flex justify-end">
                    <button
                      onClick={() => setShowPhotoGallery(false)}
                      className="rounded-md bg-gray-700 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
                    >
                      Close
                    </button>
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
