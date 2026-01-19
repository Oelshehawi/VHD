"use client";

import { motion } from "framer-motion";
import { PhoneIcon, EnvelopeIcon, UserIcon } from "@heroicons/react/24/outline";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";

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
    >
      <Card className="overflow-hidden py-0">
        <CardHeader className="from-primary to-primary/80 rounded-t-xl bg-gradient-to-r py-4">
          <CardTitle className="text-primary-foreground text-center text-xl">
            Client Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 py-4">
          <div className="flex items-center">
            <div className="bg-primary/10 mr-3 shrink-0 rounded-full p-2">
              <UserIcon className="text-primary h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-muted-foreground text-sm">Name</p>
              <p
                className="text-foreground truncate font-medium"
                title={clientName}
              >
                {clientName}
              </p>
            </div>
          </div>

          <div className="flex items-center">
            <div className="bg-primary/10 mr-3 shrink-0 rounded-full p-2">
              <PhoneIcon className="text-primary h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-muted-foreground text-sm">Phone</p>
              <p
                className="text-foreground truncate font-medium"
                title={phoneNumber}
              >
                {phoneNumber}
              </p>
            </div>
          </div>

          <div className="flex items-center">
            <div className="bg-primary/10 mr-3 shrink-0 rounded-full p-2">
              <EnvelopeIcon className="text-primary h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-muted-foreground text-sm">Email</p>
              <p className="text-foreground truncate font-medium" title={email}>
                {email}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ClientInfoCard;
