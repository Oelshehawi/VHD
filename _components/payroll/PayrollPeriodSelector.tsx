"use client";
import { useState } from "react";
import {
  PayrollPeriodType,
  PayrollDriveMetricsType,
  ScheduleType,
  TechnicianType,
} from "../../app/lib/typeDefinitions";
import EmployeesTable from "./EmployeesTable";
import EmployeeModal from "./EmployeeModal";
import PayrollDriveTimeSummary from "./PayrollDriveTimeSummary";
import { formatDateFns } from "../../app/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Button } from "../ui/button";
import { Label } from "../ui/label";

interface PayrollPeriodSelectorProps {
  payrollPeriods: PayrollPeriodType[];
  technicians: TechnicianType[];
  schedules: ScheduleType[];
  selectedPayrollPeriod: PayrollPeriodType | null;
  payrollDriveMetrics: PayrollDriveMetricsType | null;
}

const PayrollPeriodSelector = ({
  payrollPeriods,
  technicians,
  schedules,
  selectedPayrollPeriod,
  payrollDriveMetrics,
}: PayrollPeriodSelectorProps) => {
  // State for managing selected payroll period
  const [selectedTechnician, setSelectedTechnician] =
    useState<TechnicianType | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleViewShifts = (technician: TechnicianType) => {
    setSelectedTechnician(technician);
    setIsModalOpen(true);
  };

  const MAX_LINKS_DISPLAY = 5;

  const router = useRouter();
  const handleSelectChange = (value: string) => {
    router.push(`/payroll?payrollPeriodId=${value}`);
  };

  const selectedTechnicianDriveMetrics =
    selectedTechnician && payrollDriveMetrics
      ? payrollDriveMetrics.technicians.find(
          (tech) => tech.technicianId === selectedTechnician.id,
        ) || null
      : null;

  return (
    <>
      {/* Payroll Period Selection */}
      {payrollPeriods.length > MAX_LINKS_DISPLAY ? (
        <div className="mb-6">
          <Label htmlFor="payrollPeriodSelect" className="mb-2 block">
            Select Payroll Period:
          </Label>
          <Select
            value={(selectedPayrollPeriod?._id as string) || ""}
            onValueChange={handleSelectChange}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="-- Select a Payroll Period --" />
            </SelectTrigger>
            <SelectContent>
              {payrollPeriods.map((pp) => (
                <SelectItem key={pp._id as string} value={pp._id as string}>
                  {`${formatDateFns(pp.startDate as string)} → ${formatDateFns(pp.endDate as string)}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : (
        <div className="mb-6 flex flex-wrap gap-2">
          {payrollPeriods.map((pp) => (
            <Button
              key={pp._id as string}
              variant={
                selectedPayrollPeriod?._id === pp._id ? "default" : "outline"
              }
              asChild
            >
              <Link href={`/payroll?payrollPeriodId=${pp._id}`}>
                {`${formatDateFns(pp.startDate as string)} → ${formatDateFns(pp.endDate as string)}`}
              </Link>
            </Button>
          ))}
        </div>
      )}

      {selectedPayrollPeriod && (
        <>
          {/* Drive Time + Actual Duration Summary */}
          <PayrollDriveTimeSummary payrollDriveMetrics={payrollDriveMetrics} />

          {/* Employees Table */}
          <EmployeesTable
            schedules={schedules}
            technicians={technicians}
            onViewShifts={handleViewShifts}
          />

          {/* Employee Modal */}
          {selectedTechnician && (
            <EmployeeModal
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              technician={selectedTechnician}
              schedules={schedules.filter((s) =>
                s.assignedTechnicians.includes(selectedTechnician.id),
              )}
              payrollPeriod={selectedPayrollPeriod}
              driveMetrics={selectedTechnicianDriveMetrics}
            />
          )}
        </>
      )}
    </>
  );
};

export default PayrollPeriodSelector;
