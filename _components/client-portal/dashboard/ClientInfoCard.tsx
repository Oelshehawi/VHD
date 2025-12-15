"use client";

import { motion } from "framer-motion";
import { PhoneIcon, EnvelopeIcon, UserIcon } from "@heroicons/react/24/outline";

interface ClientInfoCardProps {
  clientName: string;
  phoneNumber: string;
  email: string;
}

const ClientInfoCard = ({
  clientName,
  phoneNumber,
  email,
}: ClientInfoCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="overflow-hidden rounded-xl bg-white shadow-sm"
    >
      <div className="bg-linear-to-r from-green-600 to-green-900 px-6 py-4">
        <h2 className="text-xl font-semibold text-white">Client Information</h2>
      </div>
      <div className="space-y-4 p-6">
        <div className="flex items-center">
          <div className="mr-3 rounded-full bg-blue-50 p-2">
            <UserIcon className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Name</p>
            <p className="font-medium text-gray-900">{clientName}</p>
          </div>
        </div>

        <div className="flex items-center">
          <div className="mr-3 rounded-full bg-blue-50 p-2">
            <PhoneIcon className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Phone</p>
            <p className="font-medium text-gray-900">{phoneNumber}</p>
          </div>
        </div>

        <div className="flex items-center">
          <div className="mr-3 rounded-full bg-blue-50 p-2">
            <EnvelopeIcon className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Email</p>
            <p className="font-medium text-gray-900">{email}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ClientInfoCard;
