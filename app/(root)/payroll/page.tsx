import {
  PayrollPeriodType,
  ScheduleType,
  TechnicianType,
} from "../../lib/typeDefinitions";
import {
  fetchAllPayrollPeriods,
  fetchScheduledJobsByPayrollPeriod,
} from "../../lib/scheduleAndShifts";
import { getTechnicians } from "../../lib/actions/scheduleJobs.actions";
import PayrollPeriodSelector from "../../../_components/payroll/PayrollPeriodSelector";
import { auth } from "@clerk/nextjs/server";

interface PayrollPageProps {
  searchParams: { payrollPeriodId?: string };
}

const PayrollPage = async ({ searchParams }: PayrollPageProps) => {
  const payrollPeriods: PayrollPeriodType[] = await fetchAllPayrollPeriods();
  const technicians: TechnicianType[] = await getTechnicians();
  let schedules: ScheduleType[] = [];
  let selectedPayrollPeriod: PayrollPeriodType | null = null;  
  const { orgPermissions }: any = await auth();
  const canManage = orgPermissions?.includes("org:database:allow") ? true : false;

  if (searchParams.payrollPeriodId) {
    selectedPayrollPeriod =
      payrollPeriods.find((pp) => pp._id === searchParams.payrollPeriodId) ||
      null;

    if (selectedPayrollPeriod) {
      schedules = await fetchScheduledJobsByPayrollPeriod(
        searchParams.payrollPeriodId,
      );
    } else {
      // If the payrollPeriodId is invalid, you might want to handle it
      throw new Error("Invalid payroll period ID");
    }
  } else {
    // If no payrollPeriodId is in the URL, find the payroll period that includes today's date
    if (payrollPeriods.length > 0) {
      const today = new Date();
      selectedPayrollPeriod =
        payrollPeriods.find((pp) => {
          const start = new Date(pp.startDate);
          const end = new Date(pp.endDate);
          return start <= today && today <= end;
        }) ?? null;

      // If no payroll period includes today's date, default to the most recent one
      if (!selectedPayrollPeriod) {
        const sortedPayrollPeriods = [...payrollPeriods].sort(
          (a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime(),
        );
        selectedPayrollPeriod = sortedPayrollPeriods[0] ?? null;
      }

      if (selectedPayrollPeriod) {
        schedules = await fetchScheduledJobsByPayrollPeriod(
          selectedPayrollPeriod._id as string,
        );
      } else {
        schedules = [];
      }
    }
  }

  if (!canManage)
    return (
      <div className="flex min-h-[100vh] items-center justify-center text-3xl font-bold">
        You don't have correct permissions to access this page!
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {/* Payroll Period Selection */}
      <PayrollPeriodSelector
        payrollPeriods={payrollPeriods}
        technicians={technicians}
        schedules={schedules}
        selectedPayrollPeriod={selectedPayrollPeriod}
      />
    </div>
  );
};

export default PayrollPage;
