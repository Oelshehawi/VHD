"use client";
import { format, isSameDay } from "date-fns";
import { ScheduleType } from "../../app/lib/typeDefinitions";
import DeleteModal from "../DeleteModal";
import { useState } from "react";
import toast from "react-hot-toast";
import Link from "next/link";
import { updateSchedule } from "../../app/lib/actions";

const parseDate = (dateString: string): Date => {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year as any, (month as any) - 1, day);
};

const CalendarColumn = ({
  day,
  jobs,
  isToday,
  canManage,
  holidays,
}: {
  day: Date;
  jobs: ScheduleType[];
  isToday: boolean;
  canManage: boolean;
  holidays: any;
}) => {
  const holiday = holidays.find((holiday: any) =>
    isSameDay(parseDate(holiday.date), day),
  );

  return (
    <div
      className={`flex flex-col gap-2 overflow-y-auto rounded border-2 p-2 ${
        isToday ? "bg-blue-100" : ""
      }`}
    >
      <button className="font-bold">{format(day, "E d")}</button>
      {holiday && (
        <div className="mt-2 border-b-2 border-gray-300 bg-yellow-200 p-2">
          <p className="font-semibold text-red-600">{holiday.name}</p>
        </div>
      )}
      <ul className="flex flex-col gap-2">
        {jobs.map((job) => (
          <JobItem key={job._id as string} job={job} canManage={canManage} />
        ))}
      </ul>
    </div>
  );
};

export default CalendarColumn;

const JobItem = ({
  job,
  canManage,
}: {
  job: ScheduleType;
  canManage: boolean;
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isConfirmed, setConfirmed] = useState(() => job.confirmed);
  const [isModalOpen, setModalOpen] = useState(false);

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
      setModalOpen(false);
    } catch (error) {
      console.error("Failed to update the job:", error);
      toast.error("Failed to update the job status");
      setIsLoading(false);
    }
  };

  return (
    <>
      <li
        onClick={() => setModalOpen(true)}
        className={`group flex items-center justify-between rounded-xl border-l-4 bg-white px-4 py-2 shadow-custom ${
          isConfirmed ? "border-green-500" : "border-red-500"
        } cursor-pointer hover:bg-gray-100`}
      >
        <div className="flex flex-col">
          <span className="w-full rounded bg-blue-500 p-1 text-center text-white">
            {job.assignedTechnician || "No Technician"}
          </span>
          <span className="font-semibold">{job.jobTitle}</span>

          <span className="text-gray-500">
            {format(job.startDateTime, "h:mm a")}
          </span>
        </div>
      </li>
      {isModalOpen && (
        <div
          onClick={() => setModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="min-w-[20%] max-w-[20%] rounded-lg bg-white p-6 shadow-lg"
          >
            <Link href={`/invoices/${job.invoiceRef}`}>
              <h2 className="py-2 text-xl font-semibold hover:cursor-pointer hover:rounded hover:bg-green-700 hover:text-white">
                {job.jobTitle}
              </h2>
            </Link>
            <p className="mb-4 text-gray-500">
              Scheduled at {format(job.startDateTime, "h:mm a")}
            </p>
            {canManage && (
              <div className="flex items-center space-x-4">
                <button
                  className={`w-full rounded px-4 py-2 ${
                    isConfirmed ? "bg-green-500" : "bg-red-500"
                  } text-white`}
                  onClick={toggleConfirmedStatus}
                  disabled={isLoading}
                >
                  {isLoading
                    ? "Loading..."
                    : isConfirmed
                      ? "Unconfirm Job"
                      : "Confirm Job"}
                </button>
                <DeleteModal
                  deleteText={"Are you sure you want to delete this Job?"}
                  deleteDesc={""}
                  deletionId={job._id as string}
                  deletingValue="job"
                />
              </div>
            )}
            <button
              className="mt-4 w-full rounded bg-gray-200 px-4 py-2 hover:bg-gray-300"
              onClick={() => setModalOpen(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};
