// components/MiniCalendar.tsx
"use client";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/16/solid";
import {
  add,
  eachDayOfInterval,
  endOfMonth,
  format,
  getDay,
  isEqual,
  isSameDay,
  isSameMonth,
  isToday,
  parse,
  startOfToday,
} from "date-fns";
import { useState } from "react";
import { ScheduleType, InvoiceType } from "../../app/lib/typeDefinitions";
import { updateSchedule } from "../../app/lib/actions/scheduleJobs.actions";
import DeleteModal from "../DeleteModal";
import toast from "react-hot-toast";
import Link from "next/link";
import TechnicianPill from "./TechnicianPill";
import JobDetailsModal from "./JobDetailsModal"; 

function classNames(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export default function MiniCalendar({
  scheduledJobs,
  canManage,
  technicians,
}: {
  invoices: InvoiceType[];
  scheduledJobs: ScheduleType[];
  canManage: boolean;
  technicians: { id: string; name: string }[];
}) {
  let today = startOfToday();
  let [selectedDay, setSelectedDay] = useState(today);
  let [currentMonth, setCurrentMonth] = useState(format(today, "MMM-yyyy"));
  let firstDayCurrentMonth = parse(currentMonth, "MMM-yyyy", new Date());

  // Modal state
  const [selectedJob, setSelectedJob] = useState<ScheduleType | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  let days = eachDayOfInterval({
    start: firstDayCurrentMonth,
    end: endOfMonth(firstDayCurrentMonth),
  });

  function previousMonth() {
    let firstDayNextMonth = add(firstDayCurrentMonth, { months: -1 });
    setCurrentMonth(format(firstDayNextMonth, "MMM-yyyy"));
  }

  function nextMonth() {
    let firstDayNextMonth = add(firstDayCurrentMonth, { months: 1 });
    setCurrentMonth(format(firstDayNextMonth, "MMM-yyyy"));
  }

  let selectedDayJobs = scheduledJobs
    .filter((job) => isSameDay(new Date(job.startDateTime), selectedDay))
    .sort(
      (a, b) =>
        new Date(a.startDateTime).getTime() -
        new Date(b.startDateTime).getTime(),
    );

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
    <>
      <div className="py-3 px-2 sm:py-4 sm:px-4 md:py-6">
        <div className="mx-auto max-w-md sm:max-w-2xl md:max-w-4xl lg:max-w-6xl">
          <div className="flex flex-col lg:grid lg:grid-cols-2 lg:divide-x lg:divide-gray-200 gap-6 lg:gap-0">
            <div className="lg:pr-8 xl:pr-14">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-base font-bold text-gray-900 sm:text-lg md:text-xl">
                  {format(firstDayCurrentMonth, "MMMM yyyy")}
                </h2>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={previousMonth}
                    className="flex items-center justify-center p-2 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors touch-manipulation"
                    aria-label="Previous month"
                  >
                    <ChevronLeftIcon className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden="true" />
                  </button>
                  <button
                    onClick={nextMonth}
                    type="button"
                    className="flex items-center justify-center p-2 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors touch-manipulation"
                    aria-label="Next month"
                  >
                    <ChevronRightIcon className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden="true" />
                  </button>
                </div>
              </div>
              <div className="mt-6 md:mt-10 grid grid-cols-7 text-center text-xs leading-6 text-gray-500 font-semibold">
                <div className="py-2">S</div>
                <div className="py-2">M</div>
                <div className="py-2">T</div>
                <div className="py-2">W</div>
                <div className="py-2">T</div>
                <div className="py-2">F</div>
                <div className="py-2">S</div>
              </div>
              <div className="mt-3 grid grid-cols-7 gap-px text-sm bg-gray-200 rounded-lg overflow-hidden shadow-sm">
                {days.map((day, dayIdx) => {
                  const jobCount = scheduledJobs.filter((job) =>
                    isSameDay(new Date(job.startDateTime), day)
                  ).length;

                  return (
                    <div
                      key={day.toString()}
                      className={classNames(
                        dayIdx === 0 && colStartClasses[getDay(day)],
                        "relative bg-white",
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedDay(day)}
                        className={classNames(
                          "group relative w-full py-2 sm:py-3 md:py-4 transition-all duration-200 touch-manipulation",
                          isEqual(day, selectedDay) && "text-white z-10",
                          !isEqual(day, selectedDay) &&
                            isToday(day) &&
                            "text-blue-600 font-bold",
                          !isEqual(day, selectedDay) &&
                            !isToday(day) &&
                            isSameMonth(day, firstDayCurrentMonth) &&
                            "text-gray-900",
                          !isEqual(day, selectedDay) &&
                            !isToday(day) &&
                            !isSameMonth(day, firstDayCurrentMonth) &&
                            "text-gray-400",
                          isEqual(day, selectedDay) &&
                            isToday(day) &&
                            "bg-blue-600 shadow-lg",
                          isEqual(day, selectedDay) &&
                            !isToday(day) &&
                            "bg-gray-900 shadow-lg",
                          !isEqual(day, selectedDay) && "hover:bg-gray-50",
                          (isEqual(day, selectedDay) || isToday(day)) &&
                            "font-semibold",
                        )}
                      >
                        {/* Date number */}
                        <time
                          dateTime={format(day, "yyyy-MM-dd")}
                          className="flex h-6 w-6 sm:h-7 sm:w-7 md:h-9 md:w-9 items-center justify-center mx-auto rounded-full text-xs sm:text-sm md:text-base"
                        >
                          {format(day, "d")}
                        </time>

                        {/* Job count badge */}
                        {jobCount > 0 && (
                          <div className="absolute bottom-0.5 sm:bottom-1 left-1/2 transform -translate-x-1/2">
                            <span
                              className={classNames(
                                "inline-flex items-center justify-center rounded-full text-[9px] sm:text-[10px] font-medium min-w-[16px] sm:min-w-[18px] h-[16px] sm:h-[18px] px-1",
                                isEqual(day, selectedDay)
                                  ? "bg-white/30 text-white"
                                  : isToday(day)
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-green-100 text-green-700"
                              )}
                            >
                              {jobCount}
                            </span>
                          </div>
                        )}

                        {/* Today indicator ring */}
                        {isToday(day) && !isEqual(day, selectedDay) && (
                          <div className="absolute inset-0 rounded-lg border-2 border-blue-600 pointer-events-none"></div>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
            <section className="mt-6 max-h-[60vh] overflow-y-auto lg:mt-0 lg:max-h-none lg:pl-8 xl:pl-14 pb-4">
              <div className="sticky top-0 bg-white pb-3 mb-3 border-b border-gray-200 z-10">
                <h2 className="text-sm font-semibold text-gray-900 sm:text-base md:text-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <span className="flex-1">
                    Schedule for{" "}
                    <time dateTime={format(selectedDay, "yyyy-MM-dd")} className="text-blue-600 block sm:inline mt-1 sm:mt-0">
                      {format(selectedDay, "MMM dd, yyyy")}
                    </time>
                  </span>
                  {selectedDayJobs.length > 0 && (
                    <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs sm:text-sm font-medium text-blue-800 self-start sm:self-auto">
                      {selectedDayJobs.length} {selectedDayJobs.length === 1 ? 'job' : 'jobs'}
                    </span>
                  )}
                </h2>
              </div>
              <ol className="flex flex-col gap-3 sm:gap-4 text-xs leading-6 text-gray-500 md:text-sm">
                {selectedDayJobs.length > 0 ? (
                  selectedDayJobs.map((job) => (
                    <Job
                      job={job}
                      key={job._id as string}
                      canManage={canManage}
                      technicians={technicians}
                      onJobClick={handleJobClick}
                    />
                  ))
                ) : (
                  <div className="text-center py-8">
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
                      />
                    </svg>
                    <p className="mt-2 text-sm text-gray-500">No jobs scheduled for this day</p>
                  </div>
                )}
              </ol>
            </section>
          </div>
        </div>
      </div>

      {/* Job Details Modal */}
      <JobDetailsModal
        job={selectedJob}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        canManage={canManage}
        technicians={technicians}
      />
    </>
  );
}

export function Job({
  job,
  canManage,
  technicians,
  onJobClick,
}: {
  job: ScheduleType;
  canManage: boolean;
  technicians: { id: string; name: string }[];
  onJobClick?: (job: ScheduleType) => void;
}) {
  let startDateTime = new Date(job.startDateTime);
  const [isLoading, setIsLoading] = useState(false);
  const [isConfirmed, setConfirmed] = useState(() => job.confirmed);

  const toggleConfirmedStatus = async () => {
    setIsLoading(true);
    if (!canManage) {
      toast.error("You do not have permission to perform this action");
      setIsLoading(false);
      return;
    }
    const newStatus = !isConfirmed;
    try {
      await updateSchedule({
        scheduleId: job._id.toString(),
        confirmed: newStatus,
      });

      toast.success(
        `Job ${newStatus ? "confirmed" : "unconfirmed"} successfully`,
      );
      setConfirmed(newStatus);
      setIsLoading(false);
    } catch (error) {
      console.error("Failed to update the job:", error);
      toast.error("Failed to update the job status");
      setIsLoading(false);
    }
  };

  const techNames = job.assignedTechnicians.map(
    (techId) =>
      technicians.find((tech) => tech.id === techId)?.name || "Unknown",
  );

  return (
    <li className="group relative rounded-xl bg-darkGreen p-3 text-white shadow-md hover:shadow-lg transition-all duration-200 border border-green-900/20 md:p-4">
      {/* Confirmed indicator */}
      {isConfirmed && (
        <div className="absolute -top-1 -right-1 z-10">
          <span className="flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </span>
        </div>
      )}

      <div className="flex items-start justify-between gap-3">
        <div
          className="flex-auto cursor-pointer"
          onClick={() => onJobClick?.(job)}
        >
          <div className="flex items-start justify-between gap-2 mb-2">
            <p className="text-sm font-semibold hover:underline md:text-base leading-tight">
              {job.jobTitle}
            </p>
          </div>

          <div className="flex items-center gap-2 text-green-100 mb-2">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-xs md:text-sm font-medium">{format(startDateTime, "h:mm a")}</p>
          </div>

          {techNames.length > 0 && (
            <div className="flex flex-wrap gap-1.5 md:gap-2">
              {techNames.map((tech, index) => (
                <TechnicianPill key={index} name={tech} />
              ))}
            </div>
          )}
        </div>

        {canManage && (
          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            <button
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
                isConfirmed
                  ? "bg-red-500 hover:bg-red-600"
                  : "bg-green-500 hover:bg-green-600"
              } text-white shadow-sm hover:shadow min-w-[80px]`}
              onClick={toggleConfirmedStatus}
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="inline-flex items-center">
                  <svg className="animate-spin h-3 w-3 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  ...
                </span>
              ) : isConfirmed ? (
                "Unconfirm"
              ) : (
                "Confirm"
              )}
            </button>
            <DeleteModal
              deleteText={"Are you sure you want to delete this Job?"}
              deleteDesc={""}
              deletionId={job._id as string}
              deletingValue="job"
            />
          </div>
        )}
      </div>
    </li>
  );
}

let colStartClasses = [
  "",
  "col-start-2",
  "col-start-3",
  "col-start-4",
  "col-start-5",
  "col-start-6",
  "col-start-7",
];
