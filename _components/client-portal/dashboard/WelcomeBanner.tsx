"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "../../ui/card";

interface WelcomeBannerProps {
  clientName: string;
}

const WelcomeBanner = ({ clientName }: WelcomeBannerProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="from-primary to-primary/80 relative overflow-hidden border-0 bg-gradient-to-r shadow-lg">
        {/* Decorative elements */}
        <div className="absolute -top-16 -right-16 h-64 w-64 rounded-full bg-white/10" />
        <div className="absolute -bottom-8 -left-16 h-40 w-40 rounded-full bg-white/10" />

        <CardContent className="relative py-6">
          <motion.h1
            className="text-primary-foreground mb-2 text-2xl font-bold sm:text-3xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            Welcome, {clientName}
          </motion.h1>
          <motion.p
            className="text-primary-foreground/80"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            Welcome to your client portal. Here you can view your services,
            reports, and invoices.
          </motion.p>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default WelcomeBanner;
