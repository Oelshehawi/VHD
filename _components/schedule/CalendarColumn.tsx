"use client";
import { useState, useMemo } from "react";
import { format, isSameDay } from "date-fns";
import { Holiday, ScheduleType, InvoiceType, AvailabilityType } from "../../app/lib/typeDefinitions";
import JobItem from "./JobItem";
import JobDetailsModal from "./JobDetailsModal";
import { calculateJobDurationFromPrice, convertMinutesToHours, cn } from "../../app/lib/utils";
import { isTechnicianUnavailable } from "../../app/lib/utils/availabilityUtils";

const parseDate = (dateString: string): Date => {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year as number, (month as number) - 1, day as number);
};

const HOURS = Array.from({ length: 24 }, (_, i) => i);

const CalendarColumn = ({
  invoices,
  day,
  jobs,
  isToday,
  canManage,
  holidays,
  technicians,
  availability,
  showAvailability,
}: {
  invoices: InvoiceType[];
  day: Date;
  jobs: ScheduleType[];
  isToday: boolean;
  canManage: boolean;
  holidays: Holiday[];
  technicians: { id: string; name: string }[];
  availability: AvailabilityType[];
  showAvailability: boolean;
  showOptimization?: boolean;
}) => {
  const [selectedJob, setSelectedJob] = useState<ScheduleType | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Memoize holiday lookup
  const holiday = useMemo(
    () => holidays.find((h) => isSameDay(parseDate(h.date), day)),
    [holidays, day]
  );

  // Memoize sorted jobs
  const sortedJobs = useMemo(
    () =>
      [...jobs].sort(
        (a, b) =>
          new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime()
      ),
    [jobs]
  );

  // Get hour and minutes from job's start time
  const getJobTime = (job: ScheduleType) => {
    const date = new Date(job.startDateTime);
    return {
      hour: date.getHours(),
      minutes: date.getMinutes(),
    };
  };

  // Handle job click to open modal
  const handleJobClick = (job: ScheduleType) => {
    setSelectedJob(job);
    setIsModalOpen(true);
  };

  // Handle closing modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedJob(null);
  };

  return (
    <div className="relative h-full">
      {/* Holiday banner */}
      {holiday && (
        <div
          className={cn(
            "absolute inset-x-0 top-0 z-20 px-2 py-1 text-center",
            holiday.type === "statutory"
              ? "bg-red-500/20 text-red-700 dark:text-red-300"
              : "bg-purple-500/20 text-purple-700 dark:text-purple-300"
          )}
        >
          <span className="text-xs font-medium">
            {holiday.nameEn}
            {holiday.type === "observance" && (
              <span className="ml-1 opacity-70">(Observance)</span>
            )}
          </span>
        </div>
      )}

      {/* Time slots */}
      <div className="relative h-full">
        {HOURS.map((hour) => {
          // Only check unavailability when toggle is on
          const isUnavailableHour =
            showAvailability &&
            technicians.some((tech) =>
              isTechnicianUnavailable(
                availability,
                tech.id,
                day,
                `${String(hour).padStart(2, "0")}:00`,
                `${String(hour + 1).padStart(2, "0")}:00`
              )
            );

          return (
            <div
              key={hour}
              className={cn(
                "relative h-[50px] border-b border-border/30 sm:h-[60px]",
                isUnavailableHour && "bg-destructive/10"
              )}
            >
              {/* Jobs that start at this hour */}
              {sortedJobs
                .filter((job) => getJobTime(job).hour === hour)
                .map((job) => {
                  const { minutes } = getJobTime(job);
                  const topOffset = (minutes / 60) * 100;

                  // Calculate job height based on duration
                  let jobDuration = job.hours || 2.5;
                  const invoice = invoices.find(
                    (inv) => inv._id.toString() === job.invoiceRef.toString()
                  );

                  if (invoice?.items) {
                    const totalPrice = invoice.items.reduce(
                      (sum, item) => sum + (item.price || 0),
                      0
                    );
                    const durationInMinutes = calculateJobDurationFromPrice(totalPrice);
                    jobDuration = convertMinutesToHours(durationInMinutes);
                  }

                  // 50px per hour on mobile, 60px on desktop
                  const heightInPixels = Math.max(60, jobDuration * 50);

                  return (
                    <div
                      key={job._id as string}
                      className="absolute inset-x-1 z-10 sm:inset-x-1.5"
                      style={{
                        top: `${topOffset}%`,
                        height: `${heightInPixels}px`,
                      }}
                    >
                      <JobItem
                        invoices={invoices}
                        job={job}
                        canManage={canManage}
                        technicians={technicians}
                        onJobClick={handleJobClick}
                      />
                    </div>
                  );
                })}
            </div>
          );
        })}
      </div>

      {/* Job Details Modal */}
      <JobDetailsModal
        job={selectedJob}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        canManage={canManage}
        technicians={technicians}
      />
    </div>
  );
};

export default CalendarColumn;
