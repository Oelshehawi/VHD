"use client";

import React from "react";
import { PayrollPeriodType } from "../../app/lib/typeDefinitions";
import { motion } from "framer-motion";
import { format, differenceInDays, isBefore, isAfter } from "date-fns";

interface PayrollOverviewProps {
  payrollPeriods: PayrollPeriodType[];
}

const PayrollOverview = ({ payrollPeriods }: PayrollOverviewProps) => {
  const currentPeriod = payrollPeriods
    .sort(
      (a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime(),
    )
    .find(
      (period) =>
        isBefore(new Date(period.startDate), new Date()) &&
        isAfter(new Date(period.endDate), new Date()),
    );

  if (!currentPeriod) {
    return (
      <motion.div
        className="rounded-lg bg-linear-to-r from-green-500 to-teal-600 p-6 shadow-md"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="mb-4 text-2xl font-bold text-white">Payroll Overview</h2>
        <p className="text-white">No active payroll period found.</p>
      </motion.div>
    );
  }

  const now = new Date();
  const startDate = new Date(currentPeriod.startDate);
  const endDate = new Date(currentPeriod.endDate);
  const cutoffDate = new Date(currentPeriod.cutoffDate);
  const payDay = new Date(currentPeriod.payDay);

  const totalDays = differenceInDays(endDate, startDate) + 1;
  const daysElapsed = differenceInDays(now, startDate) + 1;
  const progressPercentage = Math.min(
    Math.max((daysElapsed / totalDays) * 100, 0),
    100,
  );

  const cutoffPosition =
    (differenceInDays(cutoffDate, startDate) / totalDays) * 100;

  return (
    <motion.div
      className="rounded-lg bg-linear-to-r from-green-500 to-teal-600 p-6 shadow-md"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="mb-6 text-2xl font-bold text-white">Payroll Overview</h2>
      <div className="mb-4">
        <p className="text-lg font-semibold text-white">
          Period: {format(startDate, "PPP")} - {format(endDate, "PPP")}
        </p>
        <p className="text-md text-white">
          Cutoff Date: {format(cutoffDate, "PPP p")}
        </p>
        <p className="text-md text-white">Pay Day: {format(payDay, "PPP p")}</p>
      </div>
      <div className="relative h-8 w-full rounded bg-gray-300">
        <div
          className="h-8 rounded bg-blue-500 transition-all duration-500"
          style={{ width: `${progressPercentage}%` }}
        ></div>
        {/* Cutoff Marker with Tooltip */}
        <div
          className="absolute top-0 h-8 w-1 bg-red-500"
          style={{ left: `${cutoffPosition}%` }}
        >
          <span className="absolute top-full mt-1 w-max -translate-x-1/2 rounded bg-gray-700 px-2 py-1 text-xs text-white">
            Cutoff Date
          </span>
        </div>

        {/* Current Date Indicator */}
        {progressPercentage >= 0 && progressPercentage <= 100 && (
          <motion.div
            className="absolute top-0 flex h-8 w-6 -translate-x-1/2 items-center justify-center rounded-full bg-yellow-300"
            style={{ left: `${progressPercentage}%` }}
            animate={{ y: [0, -10, 0] }}
            transition={{
              repeat: Infinity,
              duration: 2,
              ease: "easeInOut",
            }}
          >
            <span className="text-black text-xs font-bold">
              {format(now, "d")}
            </span>
            <span className="absolute top-full mt-1 w-max -translate-x-1/2 rounded bg-gray-700 px-2 py-1 text-xs text-white">
              Today
            </span>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default PayrollOverview;
