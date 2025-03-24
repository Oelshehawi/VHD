"use client";
import { useState } from "react";
import {
  PayrollPeriodType,
  ScheduleType,
  TechnicianType,
} from "../../app/lib/typeDefinitions";
import PayrollBreakdown from "./PayrollBreakdown";
import EmployeesTable from "./EmployeesTable";
import EmployeeModal from "./EmployeeModal";
import { formatDateFns } from "../../app/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface PayrollPeriodSelectorProps {
  payrollPeriods: PayrollPeriodType[];
  technicians: TechnicianType[];
  schedules: ScheduleType[];
  selectedPayrollPeriod: PayrollPeriodType | null;
}

const PayrollPeriodSelector = ({
  payrollPeriods,
  technicians,
  schedules,
  selectedPayrollPeriod,
}: PayrollPeriodSelectorProps) => {
  const filteredTechnicians = technicians?.filter(
    (tech) =>
      tech.name.includes("Mohnad Elkeliny") ||
      tech.name.includes("Ahmed Habib")
  );

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
  const handleSelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = event.target.value;
    router.push(`/payroll?payrollPeriodId=${selectedId}`);
  };

  return (
    <>
      {/* Payroll Period Selection */}
      {payrollPeriods.length > MAX_LINKS_DISPLAY ? (
        <div className="mb-6">
          <label
            htmlFor="payrollPeriodSelect"
            className="mb-2 block text-gray-700"
          >
            Select Payroll Period:
          </label>
          <select
            id="payrollPeriodSelect"
            onChange={handleSelectChange}
            className="block w-full rounded border border-gray-300 p-2"
            defaultValue={selectedPayrollPeriod?._id as string || ""}
          >
            <option value="" disabled>
              -- Select a Payroll Period --
            </option>
            {payrollPeriods.map((pp) => (
              <option key={pp._id as string} value={pp._id as string}>
                {`${formatDateFns(pp.startDate as string)} → ${formatDateFns(pp.endDate as string)}`}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <div className="mb-6 flex flex-wrap gap-2">
          {payrollPeriods.map((pp) => (
            <Link
              key={pp._id as string}
              href={`/payroll?payrollPeriodId=${pp._id}`}
              className={`rounded px-4 py-2 ${
                selectedPayrollPeriod?._id === pp._id
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              {`${formatDateFns(pp.startDate as string)} → ${formatDateFns(pp.endDate as string)}`}
            </Link>
          ))}
        </div>
      )}

      {selectedPayrollPeriod && (
        <>
          {/* Payroll Breakdown */}
          <PayrollBreakdown
            technicians={filteredTechnicians}
            schedules={schedules}
          />

          {/* Employees Table */}
          <EmployeesTable
            schedules={schedules}
            technicians={filteredTechnicians}
            onViewShifts={handleViewShifts}
            payrollPeriod={selectedPayrollPeriod}
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
            />
          )}
        </>
      )}
    </>
  );
};

export default PayrollPeriodSelector;
