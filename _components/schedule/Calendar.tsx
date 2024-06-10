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
import { deleteJob } from "../../app/lib/actions";
import DeleteModal from "../DeleteModal";
import toast from "react-hot-toast";

function classNames(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export default function Calendar({
  invoices,
  scheduledJobs,
}: {
  invoices: InvoiceType[];
  scheduledJobs: ScheduleType[];
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

  let selectedDayJobs = scheduledJobs.filter((job) =>
    isSameDay(job.startDateTime.toString(), selectedDay),
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
            className="h-8 w-8 rounded-xl bg-darkGreen text-white  hover:cursor-pointer hover:bg-green-700 hover:transition-all md:block hidden"
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
              <ol className="mt-4 space-y-1 text-sm leading-6 text-gray-500">
                {selectedDayJobs.length > 0 ? (
                  selectedDayJobs.map((job) => (
                    <Job job={job} key={job._id as string} />
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

function Job({ job }: { job: ScheduleType }) {
  let startDateTime = job.startDateTime.toString();
  let [deleteModal, setDeleteModal] = useState(false);

  return (
    <li className="group flex items-center space-x-4 rounded-xl bg-darkGreen px-4  py-2 text-white hover:cursor-pointer hover:bg-green-700 hover:text-white ">
      <div className="flex-auto">
        <p className="">{job.jobTitle}</p>
        <p className="mt-0.5">{format(startDateTime, "h:mm a")}</p>
      </div>
      <Menu
        as="div"
        className="relative opacity-0 focus-within:opacity-100 group-hover:opacity-100"
      >
        <div>
          <MenuButton className="-m-2 flex items-center rounded-full p-1.5 text-white hover:text-white">
            <span className="sr-only">Open options</span>
            <EllipsisVerticalIcon className="h-6 w-6" aria-hidden="true" />
          </MenuButton>
        </div>

        <Transition
          as={Fragment}
          enter="transition ease-out duration-100"
          enterFrom="transform opacity-0 scale-95"
          enterTo="transform opacity-100 scale-100"
          leave="transition ease-in duration-75"
          leaveFrom="transform opacity-100 scale-100"
          leaveTo="transform opacity-0 scale-95"
        >
          <MenuItems className="absolute right-0 z-10 mt-2 w-36 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
            <div className="py-1">
              {/* <MenuItem>
                {({ focus }) => (
                  <a
                    href="#"
                    className={classNames(
                      focus ? "bg-gray-100 text-gray-900" : "text-gray-700",
                      "block px-4 py-2 text-sm",
                    )}
                  >
                    Edit
                  </a>
                )}
              </MenuItem> */}
              <MenuItem>
                {({ focus }) => (
                  <div
                    className={classNames(
                      focus ? "bg-gray-100 text-gray-900" : "text-gray-700",
                      "block px-4 py-2 text-sm",
                    )}
                    onClick={() => setDeleteModal(!deleteModal)}
                  >
                    Delete
                  </div>
                )}
              </MenuItem>
            </div>
          </MenuItems>
        </Transition>
      </Menu>
      <DeleteModal
        showModal={deleteModal}
        onConfirm={async () => {
          const deleteJobWithId = deleteJob.bind(null, job._id as string);
          await deleteJobWithId();
          toast.success("Job deleted successfully");
          setDeleteModal(false);
        }}
        onCancel={() => setDeleteModal(false)}
        deleteText={"Are you sure you want to delete this Job?"}
        deleteDesc={""}
        hideModal={undefined}
        confirmModal={undefined}
        setShowModal={undefined}
      />
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
