"use client";
import { Search, Calendar, Loader2 } from "lucide-react";
import clsx from "clsx";
import { ScheduleType, TechnicianType } from "../../app/lib/typeDefinitions";
import { useEffect, useState } from "react";
import JobDetailsModal from "./JobDetailsModal";
import { Input } from "../ui/input";
import { Card } from "../ui/card";
import { searchScheduledJobs } from "../../app/lib/actions/scheduleJobs.actions";
import { formatDateShortMonthUTC, formatTimeUTC } from "@/app/lib/utils";

const JobSearchSelect = ({
  placeholder,
  className,
  technicians,
  canManage = true,
}: {
  placeholder: string;
  className?: string;
  technicians: TechnicianType[];
  canManage?: boolean;
}) => {
  const [open, setOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<ScheduleType | null>(null);
  const [openDropdown, setOpenDropdown] = useState(false);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ScheduleType[]>([]);
  const [isLoading, setIsLoading] = useState(false);

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

  useEffect(() => {
    let isActive = true;
    const trimmed = query.trim();

    if (!trimmed) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setOpenDropdown(true);

    const timer = setTimeout(async () => {
      try {
        const jobs = await searchScheduledJobs(trimmed, 25);
        if (isActive) {
          setResults(jobs as ScheduleType[]);
        }
      } catch (error) {
        console.error("Failed to search jobs:", error);
        if (isActive) {
          setResults([]);
        }
      } finally {
        if (isActive) setIsLoading(false);
      }
    }, 250);

    return () => {
      isActive = false;
      clearTimeout(timer);
    };
  }, [query]);

  return (
    <div className={clsx("relative flex w-full flex-col", className)}>
      <div className="relative">
        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
        <Input
          type="text"
          placeholder={placeholder}
          onChange={handleSearch}
          className="pl-9"
        />
      </div>
      {openDropdown && (isLoading || results.length > 0) && (
        <Card className="absolute top-full left-0 z-50 mt-1 w-full gap-0 py-0 shadow-xl">
          <ul className="max-h-60 overflow-y-auto">
            {results.map((job: ScheduleType) => {
              const jobDate = job.startDateTime;
              if (!jobDate) return null;
              const dateString =
                typeof jobDate === "string"
                  ? jobDate.split("T")[0]
                  : jobDate.toISOString().split("T")[0];
              const jobYear = Number(dateString?.split("-")[0] || "");
              const currentYear = new Date().getUTCFullYear();
              const isCurrentYear =
                Number.isFinite(jobYear) && jobYear === currentYear;

              const formattedDate = formatDateShortMonthUTC(jobDate, {
                includeWeekday: true,
                includeYear: !isCurrentYear,
              });

              const formattedTime = formatTimeUTC(jobDate);

              return (
                <li
                  key={job._id.toString()}
                  className="hover:bg-muted border-border flex cursor-pointer items-center justify-between gap-3 border-b px-4 py-3 transition-colors first:rounded-t-xl last:rounded-b-xl last:border-b-0"
                  onClick={() => handleClick(job)}
                >
                  <div className="flex items-center gap-3">
                    <Calendar className="text-primary h-8 w-8 shrink-0" />
                    <div>
                      <div className="text-foreground font-medium">
                        {job.jobTitle}
                      </div>
                      <div className="text-muted-foreground text-sm">
                        {job.location}
                      </div>
                    </div>
                  </div>
                  <div className="text-right text-sm">
                    <div className="text-foreground font-medium">
                      {formattedDate}
                    </div>
                    <div className="text-muted-foreground">{formattedTime}</div>
                  </div>
                </li>
              );
            })}
            {isLoading && (
              <li className="text-muted-foreground flex items-center gap-2 px-4 py-3 text-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                Searching…
              </li>
            )}
          </ul>
        </Card>
      )}
      {openDropdown && !isLoading && results.length === 0 && query.trim() && (
        <Card className="absolute top-full left-0 z-50 mt-1 w-full gap-0 py-3 shadow-xl">
          <div className="text-muted-foreground px-4 text-sm">
            No jobs found
          </div>
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
