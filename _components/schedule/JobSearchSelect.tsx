"use client";
import { FaSearch } from "react-icons/fa";
import { useDebouncedCallback } from "use-debounce";
import clsx from "clsx";
import { usePathname, useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { ScheduleType } from "../../app/lib/typeDefinitions";
import { CalendarIcon } from "@heroicons/react/24/solid";
import { useState } from "react";
import JobModal from "./JobModal";

const JobSearchSelect = ({
  placeholder,
  data,
  className,
}: {
  placeholder: string;
  data: any[];
  className?: string;
}) => {
  const searchParams = useSearchParams() ?? new URLSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();
  const [open, setOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<ScheduleType | null>(null);
  const [openDropdown, setOpenDropdown] = useState(false);
  const handleSearch = useDebouncedCallback((term) => {
    setOpenDropdown(true);
    const params = new URLSearchParams(searchParams);
    if (term) {
      params.set("query", term);
    } else {
      params.delete("query");
    }
    replace(`${pathname}?${params.toString()}`);
  }, 300);

  const handleClick = (job: ScheduleType) => {
    setOpenDropdown(false);
    setSelectedJob(job);
    setOpen(true);
  };

  return (
    <div
      className={clsx(
        "relative flex w-full flex-col gap-3 py-2 md:w-[50%] md:flex-row",
        className,
      )}
    >
      <div className="group flex w-full rounded-lg shadow-custom ">
        <FaSearch className="size-10 p-2 text-gray-400 group-focus-within:text-gray-600" />
        <input
          type="text"
          placeholder={placeholder}
          onChange={(e) => handleSearch(e.target.value)}
          className="h-10 w-full rounded-e-lg pl-5 focus:outline-none"
        />
      </div>
      {openDropdown && data?.length > 0 && (
        <div className="absolute left-0 top-full z-10 mt-1 w-full rounded-md bg-white shadow-lg">
          <ul className="max-h-60 overflow-y-auto">
            {data.map((job: ScheduleType) => {
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
                  className="flex cursor-pointer items-center justify-between gap-2 px-4 py-2 hover:border-s-2 hover:border-darkGreen hover:bg-gray-200"
                  onClick={() => handleClick(job)}
                >
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="size-10 text-darkGreen" />
                    <span>{job.jobTitle}</span>
                  </div>
                  <div className="text-right">
                    <span>{formattedDate}</span>
                    <br />
                    <span>{formattedTime}</span>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
      {selectedJob && (
        <JobModal
          open={open}
          toggleModal={() => setOpen(!open)}
          jobInfo={selectedJob}
        />
      )}
    </div>
  );
};

export default JobSearchSelect;
