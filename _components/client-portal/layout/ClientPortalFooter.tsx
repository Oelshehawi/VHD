"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  PhoneIcon,
  GlobeAltIcon,
  EnvelopeIcon,
} from "@heroicons/react/24/outline";

const ClientPortalFooter = () => {
  return (
    <motion.footer
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mt-auto border-t bg-gradient-to-r from-green-700 to-green-900 text-white"
    >
      <div className="container mx-auto px-4 py-4 sm:py-6">
        <div className="flex flex-col items-center justify-between space-y-4 md:flex-row md:space-y-0">
          <div className="flex flex-col items-center space-y-3 sm:flex-row sm:space-x-4 sm:space-y-0 md:space-x-6">
            <div className="flex items-center">
              <PhoneIcon className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
              <a
                href="tel:6042738717"
                className="text-sm hover:text-gray-300 sm:text-base"
              >
                604-273-8717
              </a>
            </div>
            <div className="flex items-center">
              <GlobeAltIcon className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
              <a
                href="https://vancouverventcleaning.ca"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm hover:text-gray-300 sm:text-base"
              >
                vancouverventcleaning.ca
              </a>
            </div>
            <div className="flex items-center">
              <EnvelopeIcon className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
              <a
                href="mailto:support@vancouverventcleaning.ca"
                className="text-sm hover:text-gray-300 sm:text-base"
              >
                <span className="xs:inline hidden">
                  support@vancouverventcleaning.ca
                </span>
                <span className="xs:hidden">Email Us</span>
              </a>
            </div>
          </div>
          <div className="text-center md:text-right">
            <p className="text-xs sm:text-sm">
              &copy; {new Date().getFullYear()} Vancouver Hood Doctors. All
              rights reserved.
            </p>
          </div>
        </div>
      </div>
    </motion.footer>
  );
};

export default ClientPortalFooter;
