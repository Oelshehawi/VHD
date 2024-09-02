"use client";
import {
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
  Transition,
} from "@headlessui/react";
import { EllipsisVerticalIcon } from "@heroicons/react/16/solid";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
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
  parseISO,
  startOfToday,
} from "date-fns";
import { Fragment, useState } from "react";
import AddEvent from "./AddEvent";
import { AnimatePresence } from "framer-motion";
import { ScheduleType, InvoiceType } from "../../app/lib/typeDefinitions";
import { deleteJob, updateSchedule } from "../../app/lib/actions";
import DeleteModal from "../DeleteModal";
import toast from "react-hot-toast";
import Link from "next/link";

function classNames(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export default function MiniCalendar({
  invoices,
  scheduledJobs,
  canManage,
}: {
  invoices: InvoiceType[];
  scheduledJobs: ScheduleType[];
  canManage: boolean;
}) {
  let today = startOfToday();
  let [selectedDay, setSelectedDay] = useState(today);
  let [currentMonth, setCurrentMonth] = useState(format(today, "MMM-yyyy"));
  let [open, setOpen] = useState(false);
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
    .filter((job) => isSameDay(job.startDateTime.toString(), selectedDay))
    .sort(
      (a, b) =>
        new Date(a.startDateTime).getTime() -
        new Date(b.startDateTime).getTime(),
    );

  return (
    <>
      <AnimatePresence>
        {open && (
          <AddEvent
            invoices={invoices}
            open={open}
            setOpen={() => setOpen(!open)}
          />
        )}
      </AnimatePresence>
      <div className="">
        <div className="flex w-full justify-center py-4 md:justify-end">
          <PlusIcon
            onClick={() => setOpen(true)}
            className={` h-8 w-8 rounded-xl bg-darkGreen text-white hover:cursor-pointer hover:bg-green-700 hover:transition-all ${canManage ? "block" : "hidden"}`}
          />
        </div>
        <div className="mx-auto max-w-md px-4 sm:px-7 md:max-w-4xl md:px-6">
          <div className="md:grid md:grid-cols-2 md:divide-x md:divide-gray-200">
            <div className="md:pr-14">
              <div className="flex items-center">
                <h2 className="flex-auto font-semibold text-gray-900">
                  {format(firstDayCurrentMonth, "MMMM yyyy")}
                </h2>
                <button
                  type="button"
                  onClick={previousMonth}
                  className="-my-1.5 flex flex-none items-center justify-center p-1.5 text-gray-400 hover:text-gray-500"
                >
                  <span className="sr-only">Previous month</span>
                  <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
                </button>
                <button
                  onClick={nextMonth}
                  type="button"
                  className="-my-1.5 -mr-1.5 ml-2 flex flex-none items-center justify-center p-1.5 text-gray-400 hover:text-gray-500"
                >
                  <span className="sr-only">Next month</span>
                  <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
              <div className="mt-10 grid grid-cols-7 text-center text-xs leading-6 text-gray-500">
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
                      "py-1.5",
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
                        "mx-auto flex h-8 w-8 items-center justify-center rounded-full",
                      )}
                    >
                      <time dateTime={format(day, "yyyy-MM-dd")}>
                        {format(day, "d")}
                      </time>
                    </button>
                    <div className="mx-auto mt-1 h-1 w-1">
                      {scheduledJobs.some((job) =>
                        isSameDay(job.startDateTime.toString(), day),
                      ) && (
                        <div className="h-1 w-1 rounded-full bg-sky-500"></div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <section className="mt-12 md:mt-0 md:pl-14">
              <h2 className="font-semibold text-gray-900">
                Schedule for{" "}
                <time dateTime={format(selectedDay, "yyyy-MM-dd")}>
                  {format(selectedDay, "MMM dd, yyy")}
                </time>
              </h2>
              <ol className="mt-4 flex flex-col gap-4 space-y-1 text-sm leading-6 text-gray-500">
                {selectedDayJobs.length > 0 ? (
                  selectedDayJobs.map((job) => (
                    <Job
                      job={job}
                      key={job._id as string}
                      canManage={canManage}
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

function Job({ job, canManage }: { job: ScheduleType; canManage: boolean }) {
  let startDateTime = job.startDateTime.toString();
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
      const updateScheduleById = updateSchedule.bind(null, {
        scheduleId: job._id.toString(),
        confirmed: newStatus,
      });
      await updateScheduleById();

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

  return (
    <li className="group flex items-center justify-between space-x-4 rounded-xl bg-darkGreen px-4  py-2 text-white ">
      <div className="flex-auto gap-4">
        {canManage ? (
          <Link href={`/invoices/${job.invoiceRef}`}>
            <p className="hover:cursor-pointer hover:rounded hover:bg-green-700">
              {job.jobTitle}
            </p>
          </Link>
        ) : (
          <p>{job.jobTitle}</p>
        )}
        <p className="mt-0.5">{format(startDateTime, "h:mm a")}</p>
        <div className="flex gap-2">
          <span
            className={classNames(
              isConfirmed ? "bg-green-500" : "bg-red-500",
              " flex w-full items-center justify-center rounded p-1 hover:cursor-pointer",
            )}
            onClick={() => toggleConfirmedStatus(job)}
          >
            {isLoading ? (
              <svg
                className=" h-5 w-5 animate-spin items-center justify-center text-white"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 2.42.878 4.628 2.322 6.291l1.678-1.659z"
                ></path>
              </svg>
            ) : isConfirmed ? (
              "Confirmed"
            ) : (
              "Unconfirmed"
            )}
          </span>
          <span className=" rounded bg-blue-500 p-1 text-white">
            {job.assignedTechnician || "No Technician"}
          </span>
        </div>
      </div>
      {canManage && (
        <DeleteModal
          deleteText={"Are you sure you want to delete this Job?"}
          deleteDesc={""}
          deletionId={job._id as string}
          deletingValue="job"
        />
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
