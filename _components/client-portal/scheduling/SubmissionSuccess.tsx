"use client";

import { motion } from "framer-motion";
import { TimeSelection, RequestedTime } from "../../../app/lib/typeDefinitions";
import { formatDateMonthDayUTC } from "../../../app/lib/utils";
import { Card, CardContent } from "../../ui/card";
import { CheckCircleIcon } from "@heroicons/react/24/solid";

interface SubmissionSuccessProps {
  primarySelection: TimeSelection;
  backupSelection: TimeSelection;
}

// Format exact time for display
const formatExactTime = (time: RequestedTime): string => {
  const period = time.hour >= 12 ? "PM" : "AM";
  const displayHour = time.hour % 12 || 12;
  const displayMinute = time.minute.toString().padStart(2, "0");
  return `${displayHour}:${displayMinute} ${period} ±15 min`;
};

export default function SubmissionSuccess({
  primarySelection,
  backupSelection,
}: SubmissionSuccessProps) {
  const formatDate = (dateStr: string | Date): string =>
    formatDateMonthDayUTC(dateStr);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="py-8 text-center"
    >
      {/* Success Icon */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        className="bg-primary/10 mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full"
      >
        <CheckCircleIcon className="text-primary h-12 w-12" />
      </motion.div>

      {/* Success Message */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h2 className="text-foreground mb-2 text-2xl font-semibold">
          Request Received!
        </h2>
        <p className="text-muted-foreground mx-auto mb-8 max-w-md">
          Thank you for your scheduling request. We will review your choices and
          confirm your appointment within 24 hours.
        </p>
      </motion.div>

      {/* Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="mx-auto mb-8 max-w-md">
          <CardContent className="pt-6">
            <h3 className="text-muted-foreground mb-4 text-sm font-medium tracking-wide uppercase">
              Your Requested Times
            </h3>
            <div className="space-y-3 text-left">
              <div className="flex items-start space-x-3">
                <span className="bg-primary text-primary-foreground flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium">
                  1
                </span>
                <div>
                  <p className="text-foreground font-medium">
                    {formatDate(primarySelection.date)}
                  </p>
                  <p className="text-muted-foreground text-sm">
                    {formatExactTime(primarySelection.requestedTime)}
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <span className="bg-muted text-muted-foreground flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium">
                  2
                </span>
                <div>
                  <p className="text-foreground font-medium">
                    {formatDate(backupSelection.date)}
                  </p>
                  <p className="text-muted-foreground text-sm">
                    {formatExactTime(backupSelection.requestedTime)}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* What's Next */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card className="bg-primary/5 border-primary/20 mx-auto max-w-md">
          <CardContent className="pt-6">
            <h3 className="text-foreground mb-3 font-medium">
              What happens next?
            </h3>
            <ul className="text-muted-foreground space-y-2 text-left text-sm">
              <li className="flex items-start space-x-2">
                <CheckCircleIcon className="text-primary mt-0.5 h-5 w-5 shrink-0" />
                <span>
                  We&apos;ll review your request and check availability
                </span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircleIcon className="text-primary mt-0.5 h-5 w-5 shrink-0" />
                <span>
                  You&apos;ll receive a confirmation email within 24 hours
                </span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircleIcon className="text-primary mt-0.5 h-5 w-5 shrink-0" />
                <span>
                  If neither time works, we&apos;ll offer the closest 2
                  alternatives
                </span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </motion.div>

      {/* Contact */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="text-muted-foreground mt-8 text-sm"
      >
        Questions? Call us at{" "}
        <a href="tel:604-273-8717" className="text-primary hover:underline">
          604-273-8717
        </a>
      </motion.p>
    </motion.div>
  );
}
