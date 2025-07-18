
import OptimizationDashboard from "../../../_components/optimization/OptimizationDashboard";
import {
  fetchUnscheduledJobsForOptimization,
  getSchedulingPreferences,
} from "../../lib/schedulingOptimizations.data";

const OptimizationPage = async () => {


  try {
    // Fetch initial data on server side
    const preferences = await getSchedulingPreferences();

    // Get date range from preferences or default to next 30 days
    const dateRange =
      preferences.schedulingControls?.startDate &&
      preferences.schedulingControls?.endDate
        ? {
            start: new Date(preferences.schedulingControls.startDate),
            end: new Date(preferences.schedulingControls.endDate),
          }
        : {
            start: new Date(),
            end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          };

    const unscheduledJobs =
      await fetchUnscheduledJobsForOptimization(dateRange);

    // Serialize data for client components - convert all dates to ISO strings
    const serializedUnscheduledJobs = unscheduledJobs.map(job => ({
      ...job,
      dateDue: job.dateDue.toISOString(),
      constraints: {
        ...job.constraints,
        earliestStart: job.constraints.earliestStart.toISOString(),
        latestStart: job.constraints.latestStart.toISOString(),
      },
    }));

    const serializedPreferences = {
      ...preferences,
      createdAt: preferences.createdAt?.toISOString(),
      updatedAt: preferences.updatedAt?.toISOString(),
    };

    const serializedDateRange = {
      start: dateRange.start.toISOString(),
      end: dateRange.end.toISOString(),
    };

    return (
      <div className="flex min-h-screen w-full flex-col bg-gray-50">
        <div className="flex-1 p-6">
          <div className="mx-auto max-w-7xl">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900">
                Scheduling Optimization
              </h1>
              <p className="mt-2 text-gray-600">
                Test and compare different scheduling optimization algorithms
              </p>
            </div>

            <OptimizationDashboard
              initialPreferences={serializedPreferences}
              initialUnscheduledJobs={serializedUnscheduledJobs}
              initialDateRange={serializedDateRange}
            />
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error loading optimization page:", error);
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">
            Error Loading Optimization
          </h1>
          <p className="mt-2 text-gray-600">Please try again later.</p>
        </div>
      </div>
    );
  }
};

export default OptimizationPage;
