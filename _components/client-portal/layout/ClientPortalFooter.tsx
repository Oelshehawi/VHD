"use client";

import { motion } from "framer-motion";
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
      className="bg-card mt-auto border-t"
    >
      <div className="container mx-auto px-4 py-4 sm:py-6">
        <div className="flex flex-col items-center justify-between space-y-4 md:flex-row md:space-y-0">
          <div className="flex flex-col items-center space-y-3 sm:flex-row sm:space-y-0 sm:space-x-4 md:space-x-6">
            <a
              href="tel:6042738717"
              className="text-muted-foreground hover:text-foreground flex items-center text-sm transition-colors sm:text-base"
            >
              <PhoneIcon className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
              604-273-8717
            </a>
            <a
              href="https://vancouverventcleaning.ca"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground flex items-center text-sm transition-colors sm:text-base"
            >
              <GlobeAltIcon className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
              vancouverventcleaning.ca
            </a>
            <a
              href="mailto:support@vancouverventcleaning.ca"
              className="text-muted-foreground hover:text-foreground flex items-center text-sm transition-colors sm:text-base"
            >
              <EnvelopeIcon className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
              <span className="sm:inline hidden">
                support@vancouverventcleaning.ca
              </span>
              <span className="sm:hidden">Email Us</span>
            </a>
          </div>
          <div className="text-center md:text-right">
            <p className="text-muted-foreground text-xs sm:text-sm">
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
