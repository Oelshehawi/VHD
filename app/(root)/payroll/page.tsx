import {
  PayrollPeriodType,
  ScheduleType,
  TechnicianType,
} from "../../lib/typeDefinitions";
import {
  fetchAllPayrollPeriods,
  fetchAllScheduledJobsWithShifts,
  fetchScheduledJobsByPayrollPeriod,
} from "../../lib/scheduleAndShifts";
import { getTechnicians } from "../../lib/actions/scheduleJobs.actions";
import PayrollPeriodSelector from "../../../_components/payroll/PayrollPeriodSelector";

interface PayrollPageProps {
  searchParams: { payrollPeriodId?: string };
}

const PayrollPage = async ({ searchParams }: PayrollPageProps) => {
  const payrollPeriods: PayrollPeriodType[] = await fetchAllPayrollPeriods();
  const technicians: TechnicianType[] = await getTechnicians();
  let schedules: ScheduleType[] = [];
  let selectedPayrollPeriod: PayrollPeriodType | null = null;
  

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
    // If no payrollPeriodId is in the URL, default to the first payroll period
    if (payrollPeriods.length > 0) {
      const today = new Date('2024-10-15');
      selectedPayrollPeriod = payrollPeriods.find((pp) => {
        const start = new Date(pp.startDate);
        const end = new Date(pp.endDate);
        return start <= today && today <= end;
      }) ?? null;
      schedules = await fetchScheduledJobsByPayrollPeriod(
        selectedPayrollPeriod?._id as string,
      );
    }
  }
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
