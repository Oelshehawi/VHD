"use client";

import { useState } from "react";
import { updateJob } from "../../app/lib/actions/scheduleJobs.actions";
import { ScheduleType } from "../../app/lib/typeDefinitions";
import toast from "react-hot-toast";
import { useForm } from "react-hook-form";
import { formatLocalDateTime } from "../../app/lib/utils";
import TechnicianSelect from "./TechnicianSelect";
import { XMarkIcon } from "@heroicons/react/24/outline";

interface EditJobModalProps {
  job: ScheduleType;
  onClose: () => void;
  technicians: { id: string; name: string }[];
}

const EditJobModal = ({ job, onClose, technicians }: EditJobModalProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm({
    defaultValues: {
      jobTitle: job.jobTitle,
      location: job.location,
      startDateTime: formatLocalDateTime(job.startDateTime as string),
      assignedTechnicians: job.assignedTechnicians,
      technicianNotes: job.technicianNotes || "",
    },
  });

  const onSubmit = async (data: any) => {
    setIsLoading(true);

    try {
      // Trim all string fields to remove leading/trailing spaces
      const trimmedData = { ...data };
      if (trimmedData.jobTitle) {
        trimmedData.jobTitle = trimmedData.jobTitle.trim();
      }
      if (trimmedData.location) {
        trimmedData.location = trimmedData.location.trim();
      }
      if (trimmedData.technicianNotes) {
        trimmedData.technicianNotes = trimmedData.technicianNotes.trim();
      }

      if (typeof trimmedData.startDateTime === "string") {
        const localDate = new Date(trimmedData.startDateTime);
        trimmedData.startDateTime = new Date(
          Date.UTC(
            localDate.getFullYear(),
            localDate.getMonth(),
            localDate.getDate(),
            localDate.getHours(),
            localDate.getMinutes(),
            localDate.getSeconds(),
          ),
        );
      }

      await updateJob({
        scheduleId: job._id as string,
        jobTitle: trimmedData.jobTitle,
        location: trimmedData.location,
        startDateTime: trimmedData.startDateTime,
        assignedTechnicians: trimmedData.assignedTechnicians,
        technicianNotes: trimmedData.technicianNotes,
      });

      toast.success("Job updated successfully");
      onClose();
    } catch (error) {
      console.error("Failed to update the job:", error);
      toast.error("Failed to update the job");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative bg-white rounded-lg shadow-xl border border-gray-200">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">Edit Job</h2>
        <button
          onClick={onClose}
          className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
        >
          <XMarkIcon className="h-6 w-6" />
        </button>
      </div>

      <div className="px-6 pb-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Job Title */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Job Title</label>
            <input
              type="text"
              {...register("jobTitle", { required: "Job Title is required" })}
              className={`w-full rounded-lg border px-3 py-2 text-gray-900 placeholder-gray-500 shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                errors.jobTitle ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.jobTitle && (
              <p className="text-sm text-red-600">{errors.jobTitle.message}</p>
            )}
          </div>

          {/* Location */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Location</label>
            <input
              type="text"
              {...register("location", { required: "Location is required" })}
              className={`w-full rounded-lg border px-3 py-2 text-gray-900 placeholder-gray-500 shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                errors.location ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.location && (
              <p className="text-sm text-red-600">{errors.location.message}</p>
            )}
          </div>

          {/* Start Date & Time */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">
              Start Date & Time
            </label>
            <input
              type="datetime-local"
              {...register("startDateTime", {
                required: "Start Date & Time is required",
              })}
              className={`w-full rounded-lg border px-3 py-2 text-gray-900 placeholder-gray-500 shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                errors.startDateTime ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.startDateTime && (
              <p className="text-sm text-red-600">
                {errors.startDateTime.message}
              </p>
            )}
          </div>

          {/* Assigned Technicians */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">
              Assign Technicians
            </label>
            <TechnicianSelect
              control={control}
              name="assignedTechnicians"
              technicians={technicians}
              placeholder="Select technicians..."
              error={errors.assignedTechnicians}
              theme="light"
            />
          </div>

          {/* Technician Notes */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">
              Technician Notes
            </label>
            <textarea
              {...register("technicianNotes")}
              rows={4}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Enter any notes about this job (equipment, access instructions, etc.)"
            ></textarea>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors ${
                isLoading
                  ? "cursor-not-allowed bg-gray-400"
                  : "bg-blue-600 hover:bg-blue-700 active:bg-blue-800"
              }`}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditJobModal;
