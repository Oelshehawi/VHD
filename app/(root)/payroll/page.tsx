import {
  PayrollPeriodType,
  ScheduleType,
  TechnicianType,
  AvailabilityType,
  TimeOffRequestType,
} from "../../lib/typeDefinitions";
import {
  fetchAllPayrollPeriods,
  fetchScheduledJobsByPayrollPeriod,
} from "../../lib/scheduleAndShifts";
import { getTechnicians } from "../../lib/actions/scheduleJobs.actions";
import {
  fetchTechnicianAvailability,
  fetchTimeOffRequests,
  getPendingTimeOffCount,
} from "../../lib/data";
import PayrollPageTabs from "../../../_components/payroll/PayrollPageTabs";
// @ts-ignore
import { auth } from "@clerk/nextjs/server";

interface PayrollPageProps {
  searchParams: Promise<{ payrollPeriodId?: string }>;
}

const PayrollPage = async ({ searchParams }: PayrollPageProps) => {
  const payrollPeriods: PayrollPeriodType[] = await fetchAllPayrollPeriods();
  const technicians: TechnicianType[] = await getTechnicians();
  let schedules: ScheduleType[] = [];
  let selectedPayrollPeriod: PayrollPeriodType | null = null;
  const { sessionClaims }: any = await auth();
  const canManage =
    (sessionClaims as any)?.isManager?.isManager === true ? true : false;

  // Fetch availability and time-off data
  const availability: AvailabilityType[] = await fetchTechnicianAvailability();
  const timeOffRequests: TimeOffRequestType[] = await fetchTimeOffRequests();
  const pendingTimeOffCount: number = await getPendingTimeOffCount();

  // Create technician name mapping from Clerk data
  const technicianMap: Record<string, string> = {};
  technicians.forEach((tech) => {
    technicianMap[tech.id] = tech.name;
  });

  const resolvedSearchParams = await searchParams;
  if (resolvedSearchParams.payrollPeriodId) {
    selectedPayrollPeriod =
      payrollPeriods.find(
        (pp) => pp._id === resolvedSearchParams.payrollPeriodId,
      ) || null;

    if (selectedPayrollPeriod) {
      schedules = await fetchScheduledJobsByPayrollPeriod(
        resolvedSearchParams.payrollPeriodId,
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
          (a, b) =>
            new Date(b.endDate).getTime() - new Date(a.endDate).getTime(),
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
      <div className="flex min-h-screen items-center justify-center text-3xl font-bold">
        You don't have correct permissions to access this page!
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="p-6">
        <PayrollPageTabs
          payrollPeriods={payrollPeriods}
          technicians={technicians}
          schedules={schedules}
          selectedPayrollPeriod={selectedPayrollPeriod}
          availability={availability}
          timeOffRequests={timeOffRequests}
          pendingTimeOffCount={pendingTimeOffCount}
          technicianMap={technicianMap}
        />
      </div>
    </div>
  );
};

export default PayrollPage;
