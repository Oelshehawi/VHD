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

  return (
    <>
      <div className="py-2 md:py-4">
        <div className="mx-auto max-w-md px-2 sm:px-4 md:max-w-4xl md:px-6">
          <div className="flex flex-col md:grid md:grid-cols-2 md:divide-x md:divide-gray-200">
            <div className="md:pr-14">
              <div className="flex items-center">
                <h2 className="flex-auto text-sm font-semibold text-gray-900 md:text-base">
                  {format(firstDayCurrentMonth, "MMMM yyyy")}
                </h2>
                <button
                  type="button"
                  onClick={previousMonth}
                  className="-my-1.5 flex flex-none items-center justify-center p-1.5 text-gray-400 hover:text-gray-500"
                >
                  <span className="sr-only">Previous month</span>
                  <ChevronLeftIcon className="h-4 w-4 md:h-5 md:w-5" aria-hidden="true" />
                </button>
                <button
                  onClick={nextMonth}
                  type="button"
                  className="-my-1.5 -mr-1.5 ml-2 flex flex-none items-center justify-center p-1.5 text-gray-400 hover:text-gray-500"
                >
                  <span className="sr-only">Next month</span>
                  <ChevronRightIcon className="h-4 w-4 md:h-5 md:w-5" aria-hidden="true" />
                </button>
              </div>
              <div className="mt-6 md:mt-10 grid grid-cols-7 text-center text-xs leading-6 text-gray-500">
                <div>S</div>
                <div>M</div>
                <div>T</div>
                <div>W</div>
                <div>T</div>
                <div>F</div>
                <div>S</div>
              </div>
              <div className="mt-2 grid grid-cols-7 text-sm">
                {days.map((day, dayIdx) => (
                  <div
                    key={day.toString()}
                    className={classNames(
                      dayIdx === 0 && colStartClasses[getDay(day)],
                      "py-1",
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedDay(day)}
                      className={classNames(
                        isEqual(day, selectedDay) && "text-white",
                        !isEqual(day, selectedDay) &&
                          isToday(day) &&
                          "text-red-500",
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
                          "bg-red-500",
                        isEqual(day, selectedDay) &&
                          !isToday(day) &&
                          "bg-gray-900",
                        !isEqual(day, selectedDay) && "hover:bg-gray-200",
                        (isEqual(day, selectedDay) || isToday(day)) &&
                          "font-semibold",
                        "mx-auto flex h-6 w-6 md:h-8 md:w-8 items-center justify-center rounded-full text-xs md:text-sm",
                      )}
                    >
                      <time dateTime={format(day, "yyyy-MM-dd")}>
                        {format(day, "d")}
                      </time>
                    </button>
                    <div className="mx-auto mt-1 h-1 w-1">
                      {scheduledJobs.some((job) =>
                        isSameDay(new Date(job.startDateTime), day),
                      ) && (
                        <div className="h-1 w-1 rounded-full bg-sky-500"></div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <section className="mt-6 max-h-[50vh] overflow-y-auto md:mt-0 md:max-h-none md:pl-14">
              <h2 className="text-sm font-semibold text-gray-900 md:text-base">
                Schedule for{" "}
                <time dateTime={format(selectedDay, "yyyy-MM-dd")}>
                  {format(selectedDay, "MMM dd, yyy")}
                </time>
              </h2>
              <ol className="mt-4 flex flex-col gap-2 space-y-1 text-xs leading-6 text-gray-500 md:gap-4 md:text-sm">
                {selectedDayJobs.length > 0 ? (
                  selectedDayJobs.map((job) => (
                    <Job
                      job={job}
                      key={job._id as string}
                      canManage={canManage}
                      technicians={technicians}
                    />
                  ))
                ) : (
                  <p>No jobs for today.</p>
                )}
              </ol>
            </section>
          </div>
        </div>
      </div>
    </>
  );
}

export function Job({
  job,
  canManage,
  technicians,
}: {
  job: ScheduleType;
  canManage: boolean;
  technicians: { id: string; name: string }[];
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
    <li className="group flex items-center justify-between gap-2 rounded-xl bg-darkGreen p-2 text-white md:gap-4 md:px-4 md:py-2">
      <div className="flex-auto">
        <Link href={`/invoices/${job.invoiceRef}`}>
          <p className="text-xs font-medium hover:cursor-pointer hover:rounded hover:bg-green-700 md:text-sm">
            {job.jobTitle}
          </p>
        </Link>
        <p className="mt-0.5 text-xs md:text-sm">{format(startDateTime, "h:mm a")}</p>
        <div className="flex flex-wrap gap-1 md:gap-2">
          {techNames.map((tech, index) => (
            <TechnicianPill key={index} name={tech} />
          ))}
        </div>
      </div>
      {canManage && (
        <div className="flex items-center gap-2">
          <DeleteModal
            deleteText={"Are you sure you want to delete this Job?"}
            deleteDesc={""}
            deletionId={job._id as string}
            deletingValue="job"
          />
          <button
            className={`rounded px-2 py-1 text-xs md:px-3 md:text-sm ${
              isConfirmed ? "bg-red-500" : "bg-green-500"
            } text-white hover:bg-opacity-80`}
            onClick={toggleConfirmedStatus}
            disabled={isLoading}
          >
            {isLoading
              ? "..."
              : isConfirmed
                ? "Unconfirm"
                : "Confirm"}
          </button>
        </div>
      )}
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
