import type { JobsDueDataType } from "../../app/lib/dashboard.data";
import JobsDueContainer from "./JobsDueContainer";

type JobsDueSectionProps = {
  jobsDueDataPromise: Promise<JobsDueDataType>;
  month: string;
  year: number;
};

export default async function JobsDueSection({
  jobsDueDataPromise,
  month,
  year,
}: JobsDueSectionProps) {
  const jobsDueData = await jobsDueDataPromise;

  return (
    <JobsDueContainer
      initialJobsDueData={jobsDueData}
      initialMonth={month}
      initialYear={year}
    />
  );
}
