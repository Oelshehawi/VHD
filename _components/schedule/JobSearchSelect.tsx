"use client";
import { Search, Calendar } from "lucide-react";
import clsx from "clsx";
import { ScheduleType, TechnicianType } from "../../app/lib/typeDefinitions";
import { useState } from "react";
import JobDetailsModal from "./JobDetailsModal";
import { Input } from "../ui/input";
import { Card } from "../ui/card";

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
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder={placeholder}
          onChange={handleSearch}
          className="pl-9"
        />
      </div>
      {openDropdown && filteredJobs?.length > 0 && (
        <Card className="absolute left-0 top-full z-50 mt-1 w-full shadow-xl">
          <ul className="max-h-60 overflow-y-auto">
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
                  className="flex cursor-pointer items-center justify-between gap-3 px-4 py-3 hover:bg-muted transition-colors first:rounded-t-xl last:rounded-b-xl border-b border-border last:border-b-0"
                  onClick={() => handleClick(job)}
                >
                  <div className="flex items-center gap-3">
                    <Calendar className="h-8 w-8 text-primary shrink-0" />
                    <div>
                      <div className="font-medium text-foreground">{job.jobTitle}</div>
                      <div className="text-sm text-muted-foreground">{job.location}</div>
                    </div>
                  </div>
                  <div className="text-right text-sm">
                    <div className="font-medium text-foreground">{formattedDate}</div>
                    <div className="text-muted-foreground">{formattedTime}</div>
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
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
