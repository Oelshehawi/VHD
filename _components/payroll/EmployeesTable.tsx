// components/Payroll/EmployeesTable.tsx

"use client";

import {
  PayrollPeriodType,
  ScheduleType,
  TechnicianType,
} from "../../app/lib/typeDefinitions";
import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Button } from "../ui/button";

interface EmployeesTableProps {
  schedules: ScheduleType[];
  technicians: TechnicianType[];
  payrollPeriod: PayrollPeriodType;
  onViewShifts: (technician: TechnicianType) => void;
}

interface EmployeePayrollData {
  technician: TechnicianType;
  totalHours: number;
  hourlyRate: number;
  grossPay: number;
}

const EmployeesTable = ({
  schedules,
  technicians,
  onViewShifts,
}: EmployeesTableProps) => {
  // Calculate payroll data for each technician
  const employeeData: EmployeePayrollData[] = useMemo(() => {
    return technicians
      .filter(
        (tech) =>
          tech.name !== "Ziad" && tech.name !== "Omar" && tech.name !== "Migo",
      )
      .map((tech) => {
        const techSchedules = schedules.filter((schedule) =>
          schedule.assignedTechnicians.includes(tech.id),
        );
        const totalHours = techSchedules.reduce(
          (acc, schedule) => acc + (schedule.hours || 0),
          0,
        );
        const grossPay = totalHours * (tech.hourlyRate || 0);

        return {
          technician: tech,
          totalHours,
          hourlyRate: tech.hourlyRate || 0,
          grossPay,
        };
      });
  }, [technicians, schedules]);

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg">Employees Payroll Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Hours Worked</TableHead>
                <TableHead>Hourly Rate ($)</TableHead>
                <TableHead>Gross Pay (CAD)</TableHead>
                <TableHead>Actions</TableHead>
                <TableHead>Shifts</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employeeData.map(
                ({ technician, totalHours, hourlyRate, grossPay }) => (
                  <TableRow key={technician.id}>
                    <TableCell className="font-medium">
                      {technician.name}
                    </TableCell>
                    <TableCell>{totalHours}</TableCell>
                    <TableCell>${hourlyRate.toFixed(2)}</TableCell>
                    <TableCell>
                      $
                      {grossPay.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </TableCell>
                    <TableCell>
                      <span className="text-muted-foreground">-</span>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="link"
                        className="h-auto p-0"
                        onClick={() => onViewShifts(technician)}
                      >
                        View Shifts
                      </Button>
                    </TableCell>
                  </TableRow>
                ),
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default EmployeesTable;
