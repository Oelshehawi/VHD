"use client";
import React from "react";
import { motion } from "framer-motion";

interface WelcomeBannerProps {
  technicianName: string;
}

const WelcomeBanner: React.FC<WelcomeBannerProps> = ({ technicianName }) => {
  return (
    <motion.div
      className="mb-6 rounded bg-linear-to-r from-purple-500 to-pink-500 p-6 text-white shadow-lg"
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 100 }}
    >
      <h1 className="text-3xl font-bold">Welcome, {technicianName}!</h1>
      <p className="mt-2 text-lg">Here’s your dashboard overview.</p>
    </motion.div>
  );
};

export default WelcomeBanner;
