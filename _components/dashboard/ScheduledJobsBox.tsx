"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { FaTimes } from "react-icons/fa";
import { toast } from "react-hot-toast";
import { DueInvoiceType } from "../../app/lib/typeDefinitions";
import { updateScheduleStatus } from "../../app/lib/dashboard.data";
import { formatDate } from "../../app/lib/utils";

interface ScheduledJobsBoxProps {
  scheduledCount: number;
  unscheduledCount: number;
  scheduledInvoices: DueInvoiceType[];
}

const ScheduledJobsBox = ({
  scheduledCount,
  unscheduledCount,
  scheduledInvoices,
}: ScheduledJobsBoxProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const router = useRouter();

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const handleResetScheduleStatus = async (invoiceId: string) => {
    setProcessingId(invoiceId);
    try {
      const boundUpdateScheduleStatus = updateScheduleStatus.bind(
        null,
        invoiceId,
      );
      await boundUpdateScheduleStatus(false);
      toast.success("Schedule status reset successfully");
      router.refresh();
    } catch (error) {
      console.error("Error resetting schedule status:", error);
      toast.error("Failed to reset schedule status");
    } finally {
      setProcessingId(null);
      closeModal();
    }
  };

  return (
    <div className="mb-4 grid grid-cols-2 gap-2 text-sm">
      <div
        className="cursor-pointer rounded-lg bg-gray-100 p-2 transition-colors hover:bg-gray-200"
        onClick={openModal}
      >
        <p className="text-gray-600">Scheduled</p>
        <p className="text-lg font-bold text-darkGreen">{scheduledCount}</p>
      </div>
      <div className="rounded-lg bg-gray-100 p-2">
        <p className="text-gray-600">Unscheduled</p>
        <p className="text-lg font-bold text-red-600">{unscheduledCount}</p>
      </div>

      {/* Modal for scheduled jobs */}
      {isModalOpen && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeModal}
            className="bg-black/50 fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm md:p-0"
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="relative max-h-[80vh] w-full overflow-y-auto rounded-lg bg-white shadow-xl md:w-[600px]"
            >
              {/* Header */}
              <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white p-4">
                <h2 className="text-xl font-bold text-gray-800">
                  Scheduled Jobs
                </h2>
                <button
                  className="rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                  onClick={closeModal}
                >
                  <FaTimes size={20} />
                </button>
              </div>

              {/* Content */}
              <div className="p-4">
                {scheduledInvoices.length === 0 ? (
                  <p className="py-4 text-center text-gray-500">
                    No scheduled jobs found
                  </p>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {scheduledInvoices.map((job) => (
                      <div
                        key={job.invoiceId}
                        className="flex items-center justify-between py-3"
                      >
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-800">
                            {job.jobTitle}
                          </span>
                          <span className="text-sm text-gray-500">
                            Due:{" "}
                            {formatDate(job.dateDue.toString().split("T")[0])}
                          </span>
                        </div>
                        <button
                          onClick={() =>
                            handleResetScheduleStatus(job.invoiceId)
                          }
                          disabled={processingId === job.invoiceId}
                          className={`rounded-md px-3 py-1.5 text-sm font-medium text-white transition-colors 
                            ${
                              processingId === job.invoiceId
                                ? "cursor-not-allowed bg-gray-400"
                                : "bg-red-500 hover:bg-red-600"
                            }`}
                        >
                          {processingId === job.invoiceId
                            ? "Resetting..."
                            : "Reset Status"}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="sticky bottom-0 flex justify-end border-t bg-white p-4">
                <button
                  onClick={closeModal}
                  className="rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-300"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
};

export default ScheduledJobsBox;
