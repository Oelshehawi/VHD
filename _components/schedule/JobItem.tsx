"use client";
import { useState } from "react";
import { ScheduleType } from "../../app/lib/typeDefinitions";
import Link from "next/link";
import DeleteModal from "../DeleteModal";
import EditJobModal from "./EditJobModal";
import toast from "react-hot-toast";
import {
  updateDeadRun,
  updateSchedule,
} from "../../app/lib/actions/scheduleJobs.actions";
import TechnicianPill from "./TechnicianPill";
import { motion, AnimatePresence } from "framer-motion";
import { FaBan } from "react-icons/fa";
import { format } from "date-fns-tz";

const JobItem = ({
  job,
  canManage,
  technicians,
}: {
  job: ScheduleType;
  canManage: boolean;
  technicians: { id: string; name: string }[];
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isConfirmed, setConfirmed] = useState(() => job.confirmed);
  const [isDeadRun, setIsDeadRun] = useState(() => job.deadRun || false);
  const [isModalOpen, setModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

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

  const toggleDeadRun = async () => {
    setIsLoading(true);
    if (!canManage) {
      toast.error("You do not have permission to perform this action");
      setIsLoading(false);
      return;
    }
    const newDeadRun = !isDeadRun;
    try {
      await updateDeadRun({
        scheduleId: job._id.toString(),
        deadRun: newDeadRun,
      });

      toast.success(
        `deadRun ${newDeadRun ? "enabled" : "disabled"} successfully`,
      );
      setIsDeadRun(newDeadRun);
      setIsLoading(false);
    } catch (error) {
      console.error("Failed to update deadRun:", error);
      toast.error("Failed to update deadRun status");
      setIsLoading(false);
    }
  };

  const techNames = job.assignedTechnicians.map(
    (techId) =>
      technicians.find((tech) => tech.id === techId)?.name.split(" ")[0] ||
      "Unknown",
  );

  return (
    <>
      <li
        className={`group relative flex items-center justify-between rounded-xl border-l-4 bg-white px-4 py-2 shadow-custom ${
          isConfirmed ? "border-green-500" : "border-red-500"
        } cursor-pointer hover:bg-gray-100`}
      >
        {/* DeadRun Toggle Button */}
        {isDeadRun && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 3 }}
            exit={{ scale: 0 }}
            transition={{ duration: 0.3 }}
            className="pointer-events-none absolute inset-0 flex items-center justify-center"
          >
            <FaBan className="text-2xl text-red-600" />
          </motion.div>
        )}

        {/* List Item Content */}
        <div
          className="flex flex-col overflow-hidden"
          onClick={() => setModalOpen(true)}
        >
          <span className="flex w-full justify-center gap-1 rounded bg-blue-500 p-1 text-center text-white">
            {techNames.map((tech, index) => (
              <TechnicianPill key={index} name={tech} />
            ))}
          </span>
          <span className="font-semibold">{job.jobTitle}</span>
          <span className="text-gray-500">
            {format(job.startDateTime, "h:mm a", { timeZone: "PST" })}
          </span>
        </div>

        {/* DeadRun Toggle Button on List Item */}
        {canManage && (
          <button
            onClick={(e) => {
              e.stopPropagation(); // Prevent opening the modal
              toggleDeadRun();
            }}
            className={`absolute bottom-1 right-2  rounded-full p-2 ${
              isDeadRun ? "bg-red-600" : "bg-gray-300"
            } transition-colors duration-200 hover:bg-red-700`}
            disabled={isLoading}
            aria-label="Toggle Dead Run"
          >
            <FaBan
              className={`text-white ${
                isDeadRun ? "text-xl" : "text-lg"
              } transition-transform duration-200 ${
                isDeadRun ? "rotate-0" : "rotate-45"
              }`}
            />
          </button>
        )}
      </li>

      <AnimatePresence>
        {isModalOpen && !isEditMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setModalOpen(false)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black-2 bg-opacity-50"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
              className="relative z-50 w-full max-w-md rounded-lg bg-white p-6 shadow-lg"
            >
              <Link href={`/invoices/${job.invoiceRef}`}>
                <h2 className="py-2 text-xl font-semibold hover:cursor-pointer hover:rounded hover:bg-green-700 hover:text-white">
                  {job.jobTitle}
                </h2>
              </Link>
              <p className="mb-4 text-gray-500">
                Scheduled at  {format(job.startDateTime, "h:mm a", { timeZone: "UTC" })}
              </p>
              {canManage && (
                <>
                  <div className="flex items-center space-x-4">
                    <button
                      className={`w-full rounded px-4 py-2 ${
                        isConfirmed ? "bg-green-500" : "bg-red-500"
                      } text-white transition-colors duration-200 hover:opacity-90`}
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
                  <button
                    className="mt-4 w-full rounded bg-darkGreen px-4 py-2 text-white transition-colors duration-200 hover:bg-darkBlue"
                    onClick={() => setIsEditMode(true)}
                  >
                    Edit
                  </button>
                </>
              )}
              <button
                className="mt-4 w-full rounded bg-gray-200 px-4 py-2 transition-colors duration-200 hover:bg-gray-300"
                onClick={() => setModalOpen(false)}
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isModalOpen && isEditMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black-2 bg-opacity-50"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-lg"
            >
              <EditJobModal
                job={job}
                onClose={() => {
                  setIsEditMode(false);
                  setModalOpen(false);
                }}
                technicians={technicians}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default JobItem;
