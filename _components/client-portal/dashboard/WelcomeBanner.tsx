"use client";

import { motion } from "framer-motion";

interface WelcomeBannerProps {
  clientName: string;
}

const WelcomeBanner = ({ clientName }: WelcomeBannerProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden rounded-xl bg-linear-to-r from-green-600 to-green-900 p-6 text-white shadow-md"
    >
      {/* Decorative elements */}
      <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-green-500 opacity-20" />
      <div className="absolute -bottom-8 -left-16 h-40 w-40 rounded-full bg-green-500 opacity-20" />

      <div className="relative">
        <motion.h1
          className="mb-2 text-3xl font-bold"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          Welcome, {clientName}
        </motion.h1>
        <motion.p
          className="text-blue-100"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          Welcome to your client portal. Here you can view your services,
          reports, and invoices.
        </motion.p>
      </div>
    </motion.div>
  );
};

export default WelcomeBanner;
