"use client";

import { motion } from "framer-motion";
import { StarIcon } from "@heroicons/react/24/solid";
import { useState } from "react";

interface GoogleReviewCardProps {
  reviewUrl: string;
}

const GoogleReviewCard = ({ reviewUrl }: GoogleReviewCardProps) => {
  const [hoveredStar, setHoveredStar] = useState<number | null>(null);

  // Animation variants for the container
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3,
      },
    },
  };

  // Animation variants for individual stars
  const starVariants = {
    hidden: { opacity: 0, scale: 0.5, rotate: -10 },
    visible: {
      opacity: 1,
      scale: 1,
      rotate: 0,
      transition: { type: "spring", stiffness: 150 },
    },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="mt-6 overflow-hidden rounded-xl bg-white shadow-sm"
    >
      <div className="bg-linear-to-r from-green-600 to-green-900 px-6 py-4">
        <h2 className="text-xl font-semibold text-white">
          We Value Your Feedback
        </h2>
      </div>
      <div className="p-6">
        <div className="flex flex-col items-center text-center">
          <motion.div
            className="mb-3 flex"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                variants={starVariants}
                whileHover={{
                  scale: 1.2,
                  rotate: [0, 5, -5, 0],
                  transition: { duration: 0.3 },
                }}
                onHoverStart={() => setHoveredStar(i)}
                onHoverEnd={() => setHoveredStar(null)}
              >
                <StarIcon
                  className={`h-7 w-7 ${
                    hoveredStar !== null && i <= hoveredStar
                      ? "text-yellow-500"
                      : "text-yellow-400"
                  } transition-colors duration-200`}
                />
                <motion.div
                  className="absolute inset-0 -z-10"
                  initial={{ opacity: 0 }}
                  animate={
                    hoveredStar !== null && i <= hoveredStar
                      ? {
                          opacity: [0, 0.5, 0],
                          scale: [1, 1.5, 1.8],
                        }
                      : { opacity: 0 }
                  }
                  transition={{
                    duration: 1,
                    repeat:
                      hoveredStar !== null && i <= hoveredStar ? Infinity : 0,
                    repeatType: "loop",
                  }}
                />
              </motion.div>
            ))}
          </motion.div>
          <p className="mb-4 text-gray-600">
            Your feedback helps us improve our services. We'd appreciate if you
            could take a moment to share your experience.
          </p>
          <motion.a
            href={reviewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center justify-center rounded-md bg-green-900 px-4 py-2 text-sm font-medium text-white shadow transition-all hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <svg
              className="mr-2 h-5 w-5"
              viewBox="0 0 24 24"
              fill="currentColor"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 11V8L16 12L12 16V13H8V11H12Z" />
            </svg>
            Leave a Google Review
          </motion.a>
        </div>
      </div>
    </motion.div>
  );
};

export default GoogleReviewCard;
