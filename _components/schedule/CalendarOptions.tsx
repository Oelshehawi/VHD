"use client";
import MiniCalendar from "./MiniCalendar";
import FullCalendar from "./FullCalendar";
import SearchSelect from "./JobSearchSelect";
import Link from "next/link";
import { useState } from "react";
import { InvoiceType, ScheduleType } from "../../app/lib/typeDefinitions";
import { set } from "mongoose";

const CalendarOptions = ({
  invoices,
  scheduledJobs,
  canManage,
}: {
  invoices: InvoiceType[];
  scheduledJobs: ScheduleType[];
  canManage: boolean;
}) => {
  const [calendarOption, setCalendarOption] = useState(false);
  return (
    <>
      <Header
        setCalendarOption={() => setCalendarOption(!calendarOption)}
        calendarOption={calendarOption}
        scheduledJobs={scheduledJobs}
      />
      {calendarOption ? (
        <div className="flex min-h-[90vh] items-center justify-center p-4">
          <div className="w-full rounded-xl border-2 border-black p-2 pt-0 shadow-2xl md:w-[50%]">
            <MiniCalendar
              invoices={invoices}
              scheduledJobs={scheduledJobs}
              canManage={canManage}
            />
          </div>
        </div>
      ) : (
        <FullCalendar
          invoices={invoices}
          scheduledJobs={scheduledJobs}
          canManage={canManage}
        />
      )}
    </>
  );
};

export default CalendarOptions;

const Header = ({
  calendarOption,
  setCalendarOption,
  scheduledJobs,
}: {
  setCalendarOption: () => void;
  calendarOption: boolean;
  scheduledJobs: ScheduleType[];
}) => {
  const buttonLabel = calendarOption
    ? "Show Full Calendar"
    : "Show Mini Calendar";


  return (
    <div className="flex flex-col gap-2 px-4 py-2 shadow-custom md:flex-row md:items-center md:justify-between md:gap-0 md:py-0">
      <SearchSelect scheduledJobs={scheduledJobs} placeholder="Search for a job"  />
      <button
        onClick={setCalendarOption}
        className={`flex h-10 items-center justify-center rounded-lg border  border-gray-300 px-4 transition-colors duration-300 ${
          calendarOption
            ? "bg-darkGreen text-white"
            : "border-darkGreen bg-white text-darkGreen"
        }`}
      >
        <span>{buttonLabel}</span>
      </button>
    </div>
  );
};
