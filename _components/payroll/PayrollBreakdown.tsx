"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import {
  PayrollPeriodType,
  TechnicianType,
  ScheduleType,
} from "../../app/lib/typeDefinitions";

interface PayrollBreakdownProps {
  technicians: TechnicianType[];
  schedules: ScheduleType[];
}

const PayrollBreakdown = ({
  technicians,
  schedules,
}: PayrollBreakdownProps) => {
  // Filter out Ziad and Omar
  const validTechnicians = technicians.filter(
    (tech) => tech.name !== "Ziad" && tech.name !== "Omar",
  );

  const hourlyRates: Record<string, number> = {
    Migo: 17.40,
    Mohnad: 18.00,
  };

  // Calculate total hours and gross pay per technician
  const technicianBreakdown = useMemo(() => {
    const breakdown: {
      technicianName: string;
      totalHours: number;
      rate: number;
      grossPay: number;
    }[] = [];

    validTechnicians.forEach((tech) => {
      const techSchedules = schedules.filter((schedule) =>
        schedule.assignedTechnicians.includes(tech.id)
      );

      const totalHours = techSchedules.reduce(
        (acc, schedule) => acc + (schedule.hours || 0),
        0
      );

      const rate = hourlyRates[tech.name] || 0; 
      const grossPay = totalHours * rate;

      breakdown.push({
        technicianName: tech.name,
        totalHours,
        rate,
        grossPay,
      });
    });

    return breakdown;
  }, [validTechnicians, schedules, hourlyRates]);

  const totalEmployees = validTechnicians.length;
  const totalHours = technicianBreakdown.reduce(
    (acc, tech) => acc + tech.totalHours,
    0
  );
  const grossPay = technicianBreakdown.reduce(
    (acc, tech) => acc + tech.grossPay,
    0
  );

  return (
    <motion.div
      className="mb-6 rounded bg-gradient-to-r from-green-400 to-blue-500 p-4 text-white shadow-md"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <h3 className="mb-4 text-lg font-semibold">Payroll Breakdown - Canada</h3>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded bg-white bg-opacity-20 p-4">
          <p className="text-sm">Total Employees</p>
          <p className="text-2xl font-bold">{totalEmployees}</p>
        </div>
        <div className="rounded bg-white bg-opacity-20 p-4">
          <p className="text-sm">Total Hours Worked</p>
          <p className="text-2xl font-bold">{totalHours}</p>
        </div>
        <div className="rounded bg-white bg-opacity-20 p-4">
          <p className="text-sm">Gross Pay</p>
          <p className="text-2xl font-bold">${grossPay.toLocaleString()}</p>
        </div>
      </div>
    </motion.div>
  );
};
export default PayrollBreakdown;
