"use client";

import { useMemo } from "react";
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
  const totals = useMemo(() => {
    return technicians.reduce(
      (acc, tech) => {
        const totalHours = schedules
          .filter((schedule) => schedule.assignedTechnicians.includes(tech.id))
          .reduce((hoursAcc, schedule) => hoursAcc + (schedule.hours || 0), 0);
        const grossPay = totalHours * (tech.hourlyRate || 0);
        acc.totalHours += totalHours;
        acc.grossPay += grossPay;
        return acc;
      },
      { totalHours: 0, grossPay: 0 },
    );
  }, [technicians, schedules]);

  const totalEmployees = technicians.length;
  const totalHours = totals.totalHours;
  const grossPay = totals.grossPay;

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
