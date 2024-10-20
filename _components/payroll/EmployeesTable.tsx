// components/Payroll/EmployeesTable.tsx

"use client";

import {
  PayrollPeriodType,
  ScheduleType,
  TechnicianType,
} from "../../app/lib/typeDefinitions";
import { motion } from "framer-motion";
import { useMemo } from "react";
import GeneratePaystub from "./GeneratePaystub";

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
  payrollPeriod,
}: EmployeesTableProps) => {

  // Calculate payroll data for each technician
  const employeeData: EmployeePayrollData[] = useMemo(() => {
    return technicians
      .filter((tech) => tech.name !== "Ziad" && tech.name !== "Omar" && tech.name !== "Migo")
      .map((tech) => {
        const techSchedules = schedules.filter((schedule) =>
          schedule.assignedTechnicians.includes(tech.id),
        );
        const totalHours = techSchedules.reduce(
          (acc, schedule) => acc + (schedule.hours || 0),
          0,
        );
        const hourlyRate = hourlyRates[tech.name] || 18.0; // Default rate if not specified
        const grossPay = totalHours * hourlyRate;

        return {
          technician: tech,
          totalHours,
          hourlyRate,
          grossPay,
        };
      });
  }, [technicians, schedules, hourlyRates]);

  return (
    <motion.div
      className="mb-6 rounded bg-white p-4 shadow-md"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h3 className="mb-4 text-lg font-semibold">
        Employees Payroll Breakdown
      </h3>
      <div className="overflow-x-scroll">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Employee
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Hours Worked
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Hourly Rate ($)
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Gross Pay (CAD)
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Actions
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Shifts
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {employeeData.map(
              ({ technician, totalHours, hourlyRate, grossPay }) => (
                <tr key={technician.id}>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex items-center">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {technician.name}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {totalHours}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    ${hourlyRate.toFixed(2)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    $
                    {grossPay.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                  <td className="flex justify-start whitespace-nowrap px-6 py-4 text-sm font-medium">
                    <GeneratePaystub
                    technicianName={technician.name}
                      technicianId={technician.id}
                      payrollPeriodId={payrollPeriod._id as string}
                    />
                  </td>
                  <td
                    onClick={() => onViewShifts(technician)}
                    className="text-md whitespace-nowrap px-6 py-4 font-medium text-blue-500 hover:cursor-pointer hover:text-blue-700 "
                  >
                    View Shifts
                  </td>
                </tr>
              ),
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
};

export default EmployeesTable;
