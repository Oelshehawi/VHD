"use client";

import { motion } from "framer-motion";
import { StarIcon } from "@heroicons/react/24/solid";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Button } from "../../ui/button";

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
      className="mt-6"
    >
      <Card className="overflow-hidden py-0">
        <CardHeader className="from-primary to-primary/80 rounded-t-xl bg-gradient-to-r py-4">
          <CardTitle className="text-primary-foreground text-center text-xl">
            We Value Your Feedback
          </CardTitle>
        </CardHeader>
        <CardContent className="py-4">
          <div className="flex flex-col items-center text-center">
            <motion.div
              className="mb-4 flex"
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
                  className="relative"
                >
                  <StarIcon
                    className={`h-7 w-7 ${
                      hoveredStar !== null && i <= hoveredStar
                        ? "text-yellow-500"
                        : "text-yellow-400"
                    } transition-colors duration-200`}
                  />
                  <motion.div
                    className="absolute inset-0 -z-10 rounded-full bg-yellow-400"
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
            <p className="text-muted-foreground mb-4">
              Your feedback helps us improve our services. We&apos;d appreciate
              if you could take a moment to share your experience.
            </p>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button asChild>
                <a
                  href={reviewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center"
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
                </a>
              </Button>
            </motion.div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default GoogleReviewCard;
