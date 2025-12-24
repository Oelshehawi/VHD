"use client";

import React, { useMemo } from "react";
import { TechnicianType, ScheduleType } from "../../app/lib/typeDefinitions";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

interface PayrollBreakdownProps {
  technicians: TechnicianType[];
  schedules: ScheduleType[];
}

const PayrollBreakdown = ({
  technicians,
  schedules,
}: PayrollBreakdownProps) => {
  // Filter out Ziad and Omar
  const validTechnicians = useMemo(() => {
    return technicians.filter(
      (tech) =>
        tech.name !== "Ziad" && tech.name !== "Omar" && tech.name !== "Migo",
    );
  }, [technicians]);

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
        schedule.assignedTechnicians.includes(tech.id),
      );

      const totalHours = techSchedules.reduce(
        (acc, schedule) => acc + (schedule.hours || 0),
        0,
      );

      const rate = tech.hourlyRate || 0;
      const grossPay = totalHours * rate;

      breakdown.push({
        technicianName: tech.name,
        totalHours,
        rate,
        grossPay,
      });
    });

    return breakdown;
  }, [validTechnicians, schedules]);

  const totalEmployees = validTechnicians.length;
  const totalHours = technicianBreakdown.reduce(
    (acc, tech) => acc + tech.totalHours,
    0,
  );
  const grossPay = technicianBreakdown.reduce(
    (acc, tech) => acc + tech.grossPay,
    0,
  );

  return (
    <Card className="bg-primary text-primary-foreground mb-6">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Payroll Breakdown - Canada</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="bg-primary-foreground/10 rounded-lg p-4">
            <p className="text-primary-foreground/80 text-sm">
              Total Employees
            </p>
            <p className="text-2xl font-bold">{totalEmployees}</p>
          </div>
          <div className="bg-primary-foreground/10 rounded-lg p-4">
            <p className="text-primary-foreground/80 text-sm">
              Total Hours Worked
            </p>
            <p className="text-2xl font-bold">{totalHours}</p>
          </div>
          <div className="bg-primary-foreground/10 rounded-lg p-4">
            <p className="text-primary-foreground/80 text-sm">Gross Pay</p>
            <p className="text-2xl font-bold">${grossPay.toLocaleString()}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PayrollBreakdown;
