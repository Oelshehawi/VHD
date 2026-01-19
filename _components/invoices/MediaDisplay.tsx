"use client";

import { PhotoType, SignatureType } from "../../app/lib/typeDefinitions";
import { CldImage } from "next-cloudinary";
import { useState, useCallback, useMemo } from "react";
import { formatDateFns } from "../../app/lib/utils";
import { toPublicId } from "../../app/lib/imageUtils";
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
import Slideshow from "yet-another-react-lightbox/plugins/slideshow";

// Must match next.config.ts image sizes for Next.js image optimization
const NEXT_IMAGE_SIZES = [64, 128, 256]; // imageSizes from next.config.ts
const NEXT_DEVICE_SIZES = [320, 640, 1024, 1440, 1920, 2560]; // deviceSizes from next.config.ts
const ALL_SIZES = [...NEXT_IMAGE_SIZES, ...NEXT_DEVICE_SIZES].sort(
  (a, b) => a - b,
);

// Generate Next.js optimized image URL
function nextImageUrl(src: string, size: number): string {
  return `/_next/image?url=${encodeURIComponent(src)}&w=${size}&q=75`;
}

interface MediaDisplayProps {
  photos: PhotoType[];
  signature: SignatureType | null;
}

interface Slide {
  src: string;
  width: number;
  height: number;
  srcSet: { src: string; width: number; height: number }[];
  title: string;
  description: string;
  downloadUrl?: string;
  downloadFilename?: string;
}

export default function MediaDisplay({
  photos = [],
  signature,
}: MediaDisplayProps) {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);

  // Filter photos by type
  const beforePhotos = useMemo(
    () => photos.filter((photo) => photo.type === "before"),
    [photos],
  );

  const afterPhotos = useMemo(
    () => photos.filter((photo) => photo.type === "after"),
    [photos],
  );

  // Build Cloudinary URL from photo URL (base URL without transformations for Next.js optimization)
  const getCloudinaryUrl = useCallback((url: string): string => {
    const publicId = toPublicId(url);
    if (!publicId) return url;
    return `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/${publicId}`;
  }, []);

  // Create slide with Next.js image optimization srcSet (works with Zoom plugin)
  const createSlide = useCallback(
    (url: string, title: string, description: string, filename: string) => {
      const cloudinaryUrl = getCloudinaryUrl(url);
      const maxWidth = 2560; // Full resolution - matches original Cloudinary image size
      return {
        src: nextImageUrl(cloudinaryUrl, maxWidth),
        width: maxWidth,
        height: Math.round(maxWidth * 0.75), // 4:3 aspect ratio
        srcSet: ALL_SIZES.filter((size) => size <= maxWidth).map((size) => ({
          src: nextImageUrl(cloudinaryUrl, size),
          width: size,
          height: Math.round(size * 0.75),
        })),
        title,
        description,
        downloadUrl: cloudinaryUrl, // Original URL for download
        downloadFilename: filename,
      } as Slide;
    },
    [getCloudinaryUrl],
  );

  // Prepare slides for lightbox with Next.js optimization
  const slides = useMemo(() => {
    const newSlides: ReturnType<typeof createSlide>[] = [];

    // Add before photos
    beforePhotos.forEach((photo, idx) => {
      newSlides.push(
        createSlide(
          photo.url,
          "Before Photo",
          `Uploaded on: ${formatDateFns(photo.timestamp)}`,
          `before-photo-${idx + 1}.jpg`,
        ),
      );
    });

    // Add after photos
    afterPhotos.forEach((photo, idx) => {
      newSlides.push(
        createSlide(
          photo.url,
          "After Photo",
          `Uploaded on: ${formatDateFns(photo.timestamp)}`,
          `after-photo-${idx + 1}.jpg`,
        ),
      );
    });

    // Add signature
    if (signature) {
      newSlides.push(
        createSlide(
          signature.url,
          "Signature",
          `Signed by: ${signature.signerName} on ${formatDateFns(signature.timestamp)}`,
          `signature-${signature.signerName.replace(/\s+/g, "-").toLowerCase()}.jpg`,
        ),
      );
    }

    return newSlides;
  }, [beforePhotos, afterPhotos, signature, createSlide]);

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
                  src={toPublicId(signature.url)!}
                  alt="Signature"
                  width={200}
                  height={200}
                  crop="fit"
                  format="auto"
                  quality="auto"
                  dpr="auto"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 800px"
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
                    {beforePhotos.map((photo, idx) => (
                      <div
                        key={idx}
                        className="group relative aspect-video cursor-pointer overflow-hidden rounded-lg"
                        onClick={() => openLightbox(beforeStartIndex + idx)}
                      >
                        <CldImage
                          src={toPublicId(photo.url)!}
                          alt={`Before photo ${idx + 1}`}
                          width={800}
                          height={600}
                          crop="fill"
                          format="auto"
                          quality="auto"
                          dpr="auto"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 800px"
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
                    {afterPhotos.map((photo, idx) => (
                      <div
                        key={idx}
                        className="group relative aspect-video cursor-pointer overflow-hidden rounded-lg"
                        onClick={() => openLightbox(afterStartIndex + idx)}
                      >
                        <CldImage
                          src={toPublicId(photo.url)!}
                          alt={`After photo ${idx + 1}`}
                          width={800}
                          height={600}
                          crop="fill"
                          format="auto"
                          quality="auto"
                          dpr="auto"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 800px"
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

      {/* Lightbox with Next.js image optimization */}
      <Lightbox
        index={index}
        open={open}
        close={() => setOpen(false)}
        slides={slides}
        plugins={[
          Zoom,
          Fullscreen,
          Download,
          Thumbnails,
          Counter,
          Captions,
          Slideshow,
        ]}
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
        slideshow={{
          autoplay: false,
          delay: 3000,
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
                  const downloadUrl = slide.downloadUrl || slide.src;
                  const filename = slide.downloadFilename || "image.jpg";
                  void (async () => {
                    try {
                      const response = await fetch(downloadUrl);
                      if (!response.ok) {
                        throw new Error("Failed to fetch image");
                      }
                      const blob = await response.blob();
                      const objectUrl = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = objectUrl;
                      a.download = filename;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(objectUrl);
                    } catch {
                      window.open(downloadUrl, "_blank");
                    }
                  })();
                },
              }
            : undefined
        }
        styles={{
          root: {
            "--yarl__color_backdrop": "rgba(0, 0, 0, 0.9)",
            "--yarl__slide_title_color": "#fff",
            "--yarl__slide_description_color": "#ccc",
            "--yarl__portal_zindex": 10000, // CSS variable for portal z-index - above dialogs (z-50)
            pointerEvents: "auto", // Ensure lightbox is interactive when body has pointer-events: none
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
              className="h-7 w-7"
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
    </>
  );
}
