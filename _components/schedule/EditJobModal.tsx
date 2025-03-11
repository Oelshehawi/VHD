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
      if (typeof data.startDateTime === "string") {
        const localDate = new Date(data.startDateTime);
        data.startDateTime = new Date(
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
        jobTitle: data.jobTitle,
        location: data.location,
        startDateTime: data.startDateTime,
        assignedTechnicians: data.assignedTechnicians,
        technicianNotes: data.technicianNotes,
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
    <div className="relative">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <h2 className="text-xl font-semibold text-white">Edit Job</h2>
        <button
          onClick={onClose}
          className="rounded-full p-1 text-white/80 hover:bg-white/10 hover:text-white"
        >
          <XMarkIcon className="h-6 w-6" />
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Job Title */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-white/90">Job Title</label>
          <input
            type="text"
            {...register("jobTitle", { required: "Job Title is required" })}
            className={`w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-white/50 shadow-sm transition-colors focus:border-white/20 focus:bg-white/10 focus:outline-none focus:ring-1 focus:ring-white/20 ${
              errors.jobTitle ? "border-red-500" : ""
            }`}
          />
          {errors.jobTitle && (
            <p className="text-sm text-red-400">{errors.jobTitle.message}</p>
          )}
        </div>

        {/* Location */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-white/90">Location</label>
          <input
            type="text"
            {...register("location", { required: "Location is required" })}
            className={`w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-white/50 shadow-sm transition-colors focus:border-white/20 focus:bg-white/10 focus:outline-none focus:ring-1 focus:ring-white/20 ${
              errors.location ? "border-red-500" : ""
            }`}
          />
          {errors.location && (
            <p className="text-sm text-red-400">{errors.location.message}</p>
          )}
        </div>

        {/* Start Date & Time */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-white/90">
            Start Date & Time
          </label>
          <input
            type="datetime-local"
            {...register("startDateTime", {
              required: "Start Date & Time is required",
            })}
            className={`w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-white/50 shadow-sm transition-colors focus:border-white/20 focus:bg-white/10 focus:outline-none focus:ring-1 focus:ring-white/20 ${
              errors.startDateTime ? "border-red-500" : ""
            }`}
          />
          {errors.startDateTime && (
            <p className="text-sm text-red-400">
              {errors.startDateTime.message}
            </p>
          )}
        </div>

        {/* Assigned Technicians */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-white/90">
            Assign Technicians
          </label>
          <TechnicianSelect
            control={control}
            name="assignedTechnicians"
            technicians={technicians}
            placeholder="Select technicians..."
            error={errors.assignedTechnicians}
          />
        </div>

        {/* Technician Notes */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-white/90">
            Technician Notes
          </label>
          <textarea
            {...register("technicianNotes")}
            rows={4}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-white/50 shadow-sm transition-colors focus:border-white/20 focus:bg-white/10 focus:outline-none focus:ring-1 focus:ring-white/20"
            placeholder="Enter any notes about this job (equipment, access instructions, etc.)"
          ></textarea>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            className="rounded-lg bg-white/5 px-4 py-2 text-sm font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="submit"
            className={`inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors ${
              isLoading
                ? "cursor-not-allowed bg-white/20"
                : "bg-white/10 hover:bg-white/20 active:bg-white/30"
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
  );
};

export default EditJobModal;
