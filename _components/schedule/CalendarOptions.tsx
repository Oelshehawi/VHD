"use client";
import MiniCalendar from "./MiniCalendar";
import FullCalendar from "./FullCalendar";
import SearchSelect from "./JobSearchSelect";
import { useState, useEffect } from "react";
import { InvoiceType, ScheduleType } from "../../app/lib/typeDefinitions";
import { add, startOfWeek, eachDayOfInterval } from "date-fns";
import { ArrowLeftIcon, ArrowRightIcon } from "@heroicons/react/24/solid";
import { AnimatePresence } from "framer-motion";
import AddEvent from "./AddEvent";

const isMobileDevice = (): boolean => {
  if (typeof window !== "undefined") {
    return /Mobi|Android/i.test(navigator.userAgent);
  }
  return false;
};

const CalendarOptions = ({
  invoices,
  scheduledJobs,
  canManage,
  holidays,
}: {
  invoices: InvoiceType[];
  scheduledJobs: ScheduleType[];
  canManage: boolean;
  holidays: any;
}) => {
  const [calendarOption, setCalendarOption] = useState(false);
  const [currentWeek, setCurrentWeek] = useState(
    eachDayOfInterval({
      start: startOfWeek(new Date(), { weekStartsOn: 0 }),
      end: add(startOfWeek(new Date(), { weekStartsOn: 0 }), { days: 6 }),
    })
  );
  
  useEffect(() => {
    if (isMobileDevice()) {
      setCalendarOption(true); 
    } else {
      setCalendarOption(false);
    }
  }, []);

  const previousWeek = () => {
    const startOfPreviousWeek = add(currentWeek[0] as Date, { days: -7 });
    setCurrentWeek(
      eachDayOfInterval({
        start: startOfWeek(startOfPreviousWeek, { weekStartsOn: 0 }),
        end: add(startOfWeek(startOfPreviousWeek, { weekStartsOn: 0 }), {
          days: 6,
        }),
      })
    );
  };

  const nextWeek = () => {
    const startOfNextWeek = add(currentWeek[0] as Date, { days: 7 });
    setCurrentWeek(
      eachDayOfInterval({
        start: startOfWeek(startOfNextWeek, { weekStartsOn: 0 }),
        end: add(startOfWeek(startOfNextWeek, { weekStartsOn: 0 }), {
          days: 6,
        }),
      })
    );
  };

  return (
    <div className="flex flex-col h-[100vh]">
      <Header
        setCalendarOption={() => setCalendarOption(!calendarOption)}
        calendarOption={calendarOption}
        scheduledJobs={scheduledJobs}
        previousWeek={previousWeek}
        nextWeek={nextWeek}
        invoices={invoices}
        canManage={canManage}
        isMobile={isMobileDevice()}
      />
      {calendarOption ? (
        <div className="flex flex-grow md:items-center items-start justify-center p-4">
          <div className="w-full rounded-xl border-2 border-black shadow-custom md:w-[50%]">
            <MiniCalendar
              invoices={invoices}
              scheduledJobs={scheduledJobs}
              canManage={canManage}
            />
          </div>
        </div>
      ) : (
        <FullCalendar
          scheduledJobs={scheduledJobs}
          canManage={canManage}
          currentWeek={currentWeek}
          holidays={holidays}
        />
      )}
    </div>
  );
};

export default CalendarOptions;

const Header = ({
  calendarOption,
  setCalendarOption,
  scheduledJobs,
  previousWeek,
  nextWeek,
  invoices,
  canManage,
  isMobile,
}: {
  setCalendarOption: () => void;
  calendarOption: boolean;
  scheduledJobs: ScheduleType[];
  previousWeek: () => void;
  nextWeek: () => void;
  invoices: InvoiceType[];
  canManage: boolean;
  isMobile: boolean;
}) => {
  const [open, setOpen] = useState(false);
  const buttonLabel = calendarOption
    ? "Show Full Calendar"
    : "Show Mini Calendar";

  return (
    <div className="flex flex-col gap-2 px-4 py-2 shadow-custom md:flex-row md:items-center md:justify-between md:gap-0 md:py-0">
      <div className="flex w-full flex-col items-center gap-0 md:flex-row md:gap-4">
        <SearchSelect
          scheduledJobs={scheduledJobs}
          placeholder="Search for a job"
        />
        <button
          onClick={() => setOpen(!open)}
          className={`flex max-h-[50%] w-full md:w-[20%] text-nowrap justify-center items-center gap-2 rounded-lg bg-darkGreen p-2 text-white shadow-custom hover:bg-darkBlue ${
            canManage ? "block" : "hidden"
          }`}
        >
          Add Job
        </button>
      </div>

      <div className="flex gap-4">
        <div className={`${calendarOption ? "hidden" : "flex items-center gap-4"}`}>
          <button onClick={previousWeek}>
            <ArrowLeftIcon className="size-10 rounded-full p-2 shadow-custom hover:bg-gray-300" />
          </button>
          <button onClick={nextWeek}>
            <ArrowRightIcon className="size-10 rounded-full p-2 shadow-custom hover:bg-gray-300" />
          </button>
        </div>
        {!isMobile && (
          <button
            onClick={setCalendarOption}
            className={`hidden md:flex h-10 text-nowrap items-center justify-center rounded-lg flex-grow border border-gray-300 px-4 transition-colors duration-300 ${
              calendarOption
                ? "bg-darkGreen text-white"
                : "border-darkGreen bg-white text-darkGreen"
            }`}
          >
            <span>{buttonLabel}</span>
          </button>
        )}
      </div>
      <AnimatePresence>
        {open && (
          <AddEvent
            invoices={invoices}
            open={open}
            setOpen={() => setOpen(!open)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
