"use client";

import { motion } from "framer-motion";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";

export default function AuthErrorPage() {
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center px-4 text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8 flex flex-col items-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="mb-4 rounded-full bg-pink-100 p-5"
        >
          <ExclamationTriangleIcon className="h-12 w-12 text-pink-700" />
        </motion.div>
        <h1 className="mb-2 text-3xl font-bold text-gray-900 md:text-4xl">
          Authentication Error
        </h1>
        <p className="mb-6 max-w-md text-gray-600">
          We couldn&apos;t authenticate your access to this portal. This could be
          because you&apos;re not authorized to access this area or your session has
          expired.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="max-w-md rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
      >
        <h2 className="mb-3 text-lg font-medium text-gray-900">Need Help?</h2>
        <p className="mb-4 text-sm text-gray-600">
          If you believe this is an error, please contact our support team for
          assistance.
        </p>
        <a
          href="mailto:support@vancouverventcleaning.ca"
          className="text-sm font-medium text-blue-600 hover:text-blue-800"
        >
          support@vancouverventcleaning.ca
        </a>
      </motion.div>
    </div>
  );
}
