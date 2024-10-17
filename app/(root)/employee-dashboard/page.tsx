import { clerkClient } from "@clerk/nextjs/server";
import { getTechnicians } from "../../lib/actions/scheduleJobs.actions";

const EmployeeDashboard = async () => {
const technicians = await getTechnicians();

  return <div>EmployeeDashboard</div>;
};

export default EmployeeDashboard;
