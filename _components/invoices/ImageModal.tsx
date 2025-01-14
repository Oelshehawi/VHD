"use client";

import { CldImage } from "next-cloudinary";
import { Dialog } from "@headlessui/react";
import { motion, AnimatePresence } from "framer-motion";

interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
}

export default function ImageModal({
  isOpen,
  onClose,
  imageUrl,
}: ImageModalProps) {
  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <Dialog
          static
          open={isOpen}
          onClose={onClose}
          className="relative z-50"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="bg-black/80 fixed inset-0 backdrop-blur-sm"
            aria-hidden="true"
          />

          <div className="fixed inset-0 flex items-center justify-center">
            <Dialog.Panel className="relative w-full max-w-3xl p-4">
              <motion.button
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ duration: 0.2 }}
                onClick={onClose}
                className="text-black absolute -right-2 -top-2 z-10 rounded-full bg-white p-2 shadow-lg"
              >
                ✕
              </motion.button>
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: "spring", duration: 0.3, bounce: 0.2 }}
                className="overflow-hidden rounded-lg bg-white shadow-2xl"
              >
                <CldImage
                  src={imageUrl}
                  width={1200}
                  height={800}
                  alt="Enlarged view"
                  className="h-auto w-full"
                  crop="fit"
                />
              </motion.div>
            </Dialog.Panel>
          </div>
        </Dialog>
      )}
    </AnimatePresence>
  );
}
