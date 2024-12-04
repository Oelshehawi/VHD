import { auth } from "@clerk/nextjs/server";
import {
  fetchPayrollPeriodsForTechnician,
  fetchSchedulesForTechnician,
  fetchTechnicianById,
} from "../../lib/scheduleAndShifts";
import WelcomeBanner from "../../../_components/employeeDashboard/WelcomeBanner";
import UpcomingJobs from "../../../_components/employeeDashboard/UpcomingJobs";
import PayrollOverview from "../../../_components/employeeDashboard/PayrollOverview";
import RecentJobs from "../../../_components/employeeDashboard/RecentJobs";

const EmployeeDashboard = async () => {
  const { userId }: any = await auth();

  const technician = await fetchTechnicianById(userId);
  const schedules = await fetchSchedulesForTechnician(technician?.id);
  const payrollPeriods = await fetchPayrollPeriodsForTechnician(technician?.id);

  return (
    <div className=" bg-gray-100 p-4">
      <WelcomeBanner technicianName={technician?.name} />
      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <UpcomingJobs schedules={schedules} />
        <PayrollOverview payrollPeriods={payrollPeriods} />
        <RecentJobs schedules={schedules} />
      </div>
    </div>
  );
};

export default EmployeeDashboard;
