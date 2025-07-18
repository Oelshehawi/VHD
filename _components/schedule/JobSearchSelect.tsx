"use client";
import { FaSearch } from "react-icons/fa";
import clsx from "clsx";
import { ScheduleType, TechnicianType } from "../../app/lib/typeDefinitions";
import { CalendarIcon } from "@heroicons/react/24/solid";
import { useState } from "react";
import JobDetailsModal from "./JobDetailsModal";

const JobSearchSelect = ({
  placeholder,
  className,
  scheduledJobs,
  technicians,
  canManage = true,
}: {
  placeholder: string;
  className?: string;
  scheduledJobs: ScheduleType[];
  technicians: TechnicianType[];
  canManage?: boolean;
}) => {
  const [open, setOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<ScheduleType | null>(null);
  const [openDropdown, setOpenDropdown] = useState(false);

  const [query, setQuery] = useState("");

  const handleClick = (job: ScheduleType) => {
    setOpenDropdown(false);
    setSelectedJob(job);
    setOpen(true);
  };

  const handleSearch = (e: any) => {
    setOpenDropdown(true);
    setQuery(e.target.value);
    if (e.target.value === "") {
      setOpenDropdown(false);
    }
  };
  const filteredJobs = scheduledJobs.filter((job) => {
    return job?.jobTitle?.toLowerCase().includes(query.toLowerCase());
  }).sort((a, b) => {
    // Sort by startDateTime descending (latest first)
    return new Date(b.startDateTime).getTime() - new Date(a.startDateTime).getTime();
  });

  return (
    <div
      className={clsx(
        "relative flex w-full flex-col",
        className,
      )}
    >
      <div className="group flex w-full rounded-lg border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow">
        <FaSearch className="h-10 w-10 p-2 text-gray-400 group-focus-within:text-gray-600" />
        <input
          type="text"
          placeholder={placeholder}
          onChange={handleSearch}
          className="h-10 w-full rounded-r-lg pl-2 pr-4 focus:outline-none text-sm"
        />
      </div>
      {openDropdown && filteredJobs?.length > 0 && (
        <div className="absolute left-0 top-full z-50 mt-1 w-full rounded-xl bg-white shadow-xl border border-gray-200">
          <ul className="max-h-60 overflow-y-auto rounded-xl">
            {filteredJobs.map((job: ScheduleType) => {
              const jobDate = new Date(job.startDateTime);
              const isCurrentYear =
                jobDate.getFullYear() === new Date().getFullYear();

              const formattedDate = jobDate.toLocaleDateString("en-CA", {
                weekday: "short",
                month: "short",
                day: "numeric",
                year: isCurrentYear ? undefined : "numeric",
              });

              const formattedTime = jobDate.toLocaleTimeString("en-CA", {
                hour: "numeric",
                minute: "numeric",
              });

              return (
                <li
                  key={job._id.toString()}
                  className="flex cursor-pointer items-center justify-between gap-3 px-4 py-3 hover:bg-blue-50 transition-colors first:rounded-t-xl last:rounded-b-xl border-b border-gray-100 last:border-b-0"
                  onClick={() => handleClick(job)}
                >
                  <div className="flex items-center gap-3">
                    <CalendarIcon className="h-8 w-8 text-blue-600 flex-shrink-0" />
                    <div>
                      <div className="font-medium text-gray-900">{job.jobTitle}</div>
                      <div className="text-sm text-gray-500">{job.location}</div>
                    </div>
                  </div>
                  <div className="text-right text-sm">
                    <div className="font-medium text-gray-900">{formattedDate}</div>
                    <div className="text-gray-500">{formattedTime}</div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
      {selectedJob && (
        <JobDetailsModal
          job={selectedJob}
          isOpen={open}
          onClose={() => setOpen(false)}
          canManage={canManage}
          technicians={technicians}
        />
      )}
    </div>
  );
};

export default JobSearchSelect;
