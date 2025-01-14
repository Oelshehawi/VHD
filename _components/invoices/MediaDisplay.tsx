"use client";

import { PhotoType, SignatureType } from "../../app/lib/typeDefinitions";
import { CldImage } from "next-cloudinary";
import { useState } from "react";
import ImageModal from "./ImageModal";
import { formatDateFns } from "../../app/lib/utils";

interface MediaDisplayProps {
  photos: {
    before?: PhotoType[];
    after?: PhotoType[];
  };
  signature: SignatureType | null;
}

export default function MediaDisplay({
  photos: { before = [], after = [] },
  signature,
}: MediaDisplayProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  return (
    <>
      {/* Signature Section */}
      {signature && (
        <div className="mb-4 w-full px-2">
          <div className="rounded border shadow">
            <div className="border-b px-4 py-2 text-xl">Signature</div>
            <div className="p-4">
              <div
                className="relative h-32 w-full cursor-pointer"
                onClick={() => setSelectedImage(signature.url)}
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
      {(before.length > 0 || after.length > 0) && (
        <div className="mb-8 w-full">
          <div className="rounded border shadow">
            <div className="border-b px-4 py-2 text-xl">Job Photos</div>
            <div className="p-4">
              {/* Before Photos */}
              {before.length > 0 && (
                <div className="mb-6">
                  <h4 className="mb-2 font-medium">Before</h4>
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                    {before.map((photo, index) => (
                      <div
                        key={index}
                        className="relative aspect-video cursor-pointer overflow-hidden rounded-lg"
                        onClick={() => setSelectedImage(photo.url)}
                      >
                        <CldImage
                          src={photo.url}
                          alt={`Before photo ${index + 1}`}
                          width={800}
                          height={600}
                          crop="fill"
                          className="h-full w-full object-cover transition-transform duration-200 hover:scale-105"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* After Photos */}
              {after.length > 0 && (
                <div>
                  <h4 className="mb-2 font-medium">After</h4>
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                    {after.map((photo, index) => (
                      <div
                        key={index}
                        className="relative aspect-video cursor-pointer overflow-hidden rounded-lg"
                        onClick={() => setSelectedImage(photo.url)}
                      >
                        <CldImage
                          src={photo.url}
                          alt={`After photo ${index + 1}`}
                          width={800}
                          height={600}
                          crop="fill"
                          className="h-full w-full object-cover transition-transform duration-200 hover:scale-105"
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

      <ImageModal
        isOpen={!!selectedImage}
        onClose={() => setSelectedImage(null)}
        imageUrl={selectedImage || ""}
      />
    </>
  );
}
