"use client";
import { format, isSameDay } from "date-fns";
import { ScheduleType } from "../../app/lib/typeDefinitions";
import DeleteModal from "../DeleteModal";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { updateSchedule } from "../../app/lib/actions";
import axios from "axios";

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

  const holiday = holidays.find((holiday:any) =>
    isSameDay(new Date(holiday.date), day),
  );

  console.log(holidays);
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
        <div className="flex-auto">
          <p className="font-semibold">{job.jobTitle}</p>
          <p className="text-gray-500">{format(job.startDateTime, "h:mm a")}</p>
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
            <h2 className="mb-4 text-xl font-semibold">{job.jobTitle}</h2>
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
