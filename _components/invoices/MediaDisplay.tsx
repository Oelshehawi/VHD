"use client";

import { PhotoType, SignatureType } from "../../app/lib/typeDefinitions";
import { CldImage } from "next-cloudinary";
import { useState, useCallback, useEffect, useMemo } from "react";
import { formatDateFns } from "../../app/lib/utils";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
// Import zoom plugin
import Zoom from "yet-another-react-lightbox/plugins/zoom";
// Import fullscreen plugin
import Fullscreen from "yet-another-react-lightbox/plugins/fullscreen";
// Import download plugin
import Download from "yet-another-react-lightbox/plugins/download";
// Import thumbnails plugin
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";
import "yet-another-react-lightbox/plugins/thumbnails.css";
// Import counter plugin
import Counter from "yet-another-react-lightbox/plugins/counter";
import "yet-another-react-lightbox/plugins/counter.css";
// Import captions plugin
import Captions from "yet-another-react-lightbox/plugins/captions";
import "yet-another-react-lightbox/plugins/captions.css";
// Import CSS module
import styles from "./lightbox.module.css";

interface MediaDisplayProps {
  photos: PhotoType[];
  signature: SignatureType | null;
}

export default function MediaDisplay({
  photos = [],
  signature,
}: MediaDisplayProps) {
  // State for lightbox
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const [slides, setSlides] = useState<
    Array<{
      src: string;
      title?: string;
      description?: string;
      downloadUrl?: string;
      downloadFilename?: string;
    }>
  >([]);

  // Filter photos by type - memoize to prevent infinite loop
  const beforePhotos = useMemo(
    () => photos.filter((photo) => photo.type === "before"),
    [photos],
  );

  const afterPhotos = useMemo(
    () => photos.filter((photo) => photo.type === "after"),
    [photos],
  );

  // Prepare slides for the lightbox
  useEffect(() => {
    const newSlides = [];

    // Add before photos
    if (beforePhotos && beforePhotos.length > 0) {
      beforePhotos.forEach((photo, idx) => {
        newSlides.push({
          src: photo.url,
          title: "Before Photo",
          description: `Uploaded on: ${formatDateFns(photo.timestamp)}`,
          downloadUrl: photo.url,
          downloadFilename: `before-photo-${idx + 1}.jpg`,
        });
      });
    }

    // Add after photos
    if (afterPhotos && afterPhotos.length > 0) {
      afterPhotos.forEach((photo, idx) => {
        newSlides.push({
          src: photo.url,
          title: "After Photo",
          description: `Taken on: ${formatDateFns(photo.timestamp)}`,
          downloadUrl: photo.url,
          downloadFilename: `after-photo-${idx + 1}.jpg`,
        });
      });
    }

    // Add signature if available
    if (signature) {
      newSlides.push({
        src: signature.url,
        title: "Signature",
        description: `Signed by: ${signature.signerName} on ${formatDateFns(signature.timestamp)}`,
        downloadUrl: signature.url,
        downloadFilename: `signature-${signature.signerName.replace(/\s+/g, "-").toLowerCase()}.jpg`,
      });
    }

    setSlides(newSlides);
  }, [beforePhotos, afterPhotos, signature]);

  // Function to open lightbox at specific index
  const openLightbox = useCallback((photoIndex: number) => {
    setIndex(photoIndex);
    setOpen(true);
  }, []);

  // Calculate indexes for the different sections
  const beforeStartIndex = 0;
  const afterStartIndex = beforePhotos.length;
  const signatureIndex = beforePhotos.length + afterPhotos.length;

  return (
    <>
      {/* Signature Section */}
      {signature && (
        <div className="mb-4 w-full px-2">
          <div className="rounded border shadow">
            <div className="flex items-center justify-between border-b px-4 py-2 text-xl">
              <span>Signature</span>
            </div>
            <div className="p-4">
              <div
                className="relative h-32 w-full cursor-pointer"
                onClick={() => openLightbox(signatureIndex)}
              >
                <CldImage
                  src={signature.url}
                  alt="Signature"
                  width={200}
                  height={200}
                  crop="fit"
                  className="object-contain"
                />
              </div>
              <div className="mt-2 space-y-1 text-sm text-gray-600">
                <p>Signed by: {signature.signerName}</p>
                <p>Date: {formatDateFns(signature.timestamp)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Photos Section */}
      {(beforePhotos.length > 0 || afterPhotos.length > 0) && (
        <div className="mb-8 w-full">
          <div className="rounded border shadow">
            <div className="border-b px-4 py-2 text-xl">Job Photos</div>
            <div className="p-4">
              {/* Before Photos */}
              {beforePhotos.length > 0 && (
                <div className="mb-6">
                  <h4 className="mb-2 font-medium">Before</h4>
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                    {beforePhotos.map((photo, index) => (
                      <div
                        key={index}
                        className="group relative aspect-video cursor-pointer overflow-hidden rounded-lg"
                        onClick={() => openLightbox(beforeStartIndex + index)}
                      >
                        <CldImage
                          src={photo.url}
                          alt={`Before photo ${index + 1}`}
                          width={800}
                          height={600}
                          crop="fill"
                          className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* After Photos */}
              {afterPhotos.length > 0 && (
                <div>
                  <h4 className="mb-2 font-medium">After</h4>
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                    {afterPhotos.map((photo, index) => (
                      <div
                        key={index}
                        className="group relative aspect-video cursor-pointer overflow-hidden rounded-lg"
                        onClick={() => openLightbox(afterStartIndex + index)}
                      >
                        <CldImage
                          src={photo.url}
                          alt={`After photo ${index + 1}`}
                          width={800}
                          height={600}
                          crop="fill"
                          className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Lightbox for improved image viewing */}
      <div className={styles.lightboxContainer}>
        <Lightbox
          index={index}
          open={open}
          close={() => setOpen(false)}
          slides={slides}
          plugins={[Zoom, Fullscreen, Download, Thumbnails, Counter, Captions]}
          zoom={{
            maxZoomPixelRatio: 6,
            zoomInMultiplier: 2,
            doubleTapDelay: 300,
            doubleClickDelay: 300,
            keyboardMoveDistance: 50,
            wheelZoomDistanceFactor: 100,
            pinchZoomDistanceFactor: 100,
            scrollToZoom: true,
          }}
          counter={{
            separator: " of ",
            container: {
              style: {
                backgroundColor: "rgba(0, 0, 0, 0.5)",
                borderRadius: "20px",
                left: "50%",
                transform: "translateX(-50%)",
                fontWeight: "500",
                fontSize: "14px",
              },
            },
          }}
          carousel={{
            finite: false,
            preload: 2,
            padding: "16px",
            spacing: "30%",
            imageFit: "contain",
          }}
          thumbnails={{
            width: 120,
            height: 80,
            padding: 4,
            position: "bottom",
            borderRadius: 4,
          }}
          captions={{
            showToggle: true,
            descriptionTextAlign: "center",
            descriptionMaxLines: 3,
          }}
          download={
            slides.length > 0
              ? {
                  download: ({ slide }) => {
                    const a = document.createElement("a");
                    a.href = slide.src;
                    a.download = (slide as any).downloadFilename || "image.jpg";
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                  },
                }
              : undefined
          }
          styles={{
            root: {
              "--yarl__color_backdrop": "rgba(0, 0, 0, 0.9)",
              "--yarl__slide_title_color": "#fff",
              "--yarl__slide_description_color": "#ccc",
            },
          }}
          render={{
            iconZoomIn: () => (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-7 w-7"
              >
                <path
                  fillRule="evenodd"
                  d="M10.5 3.75a6.75 6.75 0 100 13.5 6.75 6.75 0 000-13.5zM2.25 10.5a8.25 8.25 0 1114.59 5.28l4.69 4.69a.75.75 0 11-1.06 1.06l-4.69-4.69A8.25 8.25 0 012.25 10.5zm8.25-3.75a.75.75 0 01.75.75v2.25h2.25a.75.75 0 010 1.5h-2.25v2.25a.75.75 0 01-1.5 0v-2.25H7.5a.75.75 0 010-1.5h2.25V7.5a.75.75 0 01.75-.75z"
                  clipRule="evenodd"
                />
              </svg>
            ),
            iconZoomOut: () => (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-7 w-7"
              >
                <path
                  fillRule="evenodd"
                  d="M10.5 3.75a6.75 6.75 0 100 13.5 6.75 6.75 0 000-13.5zM2.25 10.5a8.25 8.25 0 1114.59 5.28l4.69 4.69a.75.75 0 11-1.06 1.06l-4.69-4.69A8.25 8.25 0 012.25 10.5zm6 0a.75.75 0 01.75-.75h4.5a.75.75 0 010 1.5h-4.5a.75.75 0 01-.75-.75z"
                  clipRule="evenodd"
                />
              </svg>
            ),
            iconDownload: () => (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className={`h-7 w-7 ${styles.downloadButton}`}
              >
                <path
                  fillRule="evenodd"
                  d="M12 2.25a.75.75 0 01.75.75v11.69l3.22-3.22a.75.75 0 111.06 1.06l-4.5 4.5a.75.75 0 01-1.06 0l-4.5-4.5a.75.75 0 111.06-1.06l3.22 3.22V3a.75.75 0 01.75-.75zm-9 13.5a.75.75 0 01.75.75v2.25a1.5 1.5 0 001.5 1.5h13.5a1.5 1.5 0 001.5-1.5V16.5a.75.75 0 011.5 0v2.25a3 3 0 01-3 3H5.25a3 3 0 01-3-3V16.5a.75.75 0 01.75-.75z"
                  clipRule="evenodd"
                />
              </svg>
            ),
          }}
        />
      </div>
    </>
  );
}
