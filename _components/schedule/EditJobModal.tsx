"use client";

import { useState } from "react";
import { updateJob } from "../../app/lib/actions/scheduleJobs.actions";
import { ScheduleType } from "../../app/lib/typeDefinitions";
import toast from "react-hot-toast";
import { useForm } from "react-hook-form";
import { formatLocalDateTime } from "../../app/lib/utils";

interface EditJobModalProps {
  job: ScheduleType;
  onClose: () => void;
}

const EditJobModal = ({ job, onClose }: EditJobModalProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      jobTitle: job.jobTitle,
      location: job.location,
      startDateTime: formatLocalDateTime(job.startDateTime as Date),
      assignedTechnician: job.assignedTechnician,
    },
  });

  const onSubmit = async (data: any) => {
    setIsLoading(true);

    try {
      await updateJob({
        scheduleId: job._id as string,
        jobTitle: data.jobTitle,
        location: data.location,
        startDateTime: data.startDateTime,
        assignedTechnician: data.assignedTechnician,
      });

      toast.success("Job updated successfully");
      setIsLoading(false);
      onClose();
    } catch (error) {
      console.error("Failed to update the job:", error);
      toast.error("Failed to update the job");
      setIsLoading(false);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black-2 bg-opacity-50"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg"
      >
        <h2 className="mb-4 text-xl font-semibold">Edit Job</h2>
        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Job Title */}
          <div className="mb-4">
            <label className="block text-gray-700">Job Title</label>
            <input
              type="text"
              {...register("jobTitle", { required: "Job Title is required" })}
              className="w-full rounded border px-3 py-2"
            />
            {errors.jobTitle && (
              <p className="mt-1 text-sm text-red-500">
                {errors.jobTitle.message}
              </p>
            )}
          </div>
          {/* Location */}
          <div className="mb-4">
            <label className="block text-gray-700">Location</label>
            <input
              type="text"
              {...register("location", { required: "Location is required" })}
              className="w-full rounded border px-3 py-2"
            />
            {errors.location && (
              <p className="mt-1 text-sm text-red-500">
                {errors.location.message}
              </p>
            )}
          </div>
          {/* Start Date & Time */}
          <div className="mb-4">
            <label className="block text-gray-700">Start Date & Time</label>
            <input
              type="datetime-local"
              {...register("startDateTime", {
                required: "Start Date & Time is required",
              })}
              className="w-full rounded border px-3 py-2"
            />
            {errors.startDateTime && (
              <p className="mt-1 text-sm text-red-500">
                {errors.startDateTime.message}
              </p>
            )}
          </div>
          {/* Assigned Technician */}
          <div className="mb-4">
            <label className="block text-gray-700">Assigned Technician</label>
            <input
              type="text"
              {...register("assignedTechnician", {
                required: "Assigned Technician is required",
              })}
              className="w-full rounded border px-3 py-2"
            />
            {errors.assignedTechnician && (
              <p className="mt-1 text-sm text-red-500">
                {errors.assignedTechnician.message}
              </p>
            )}
          </div>
          {/* Action Buttons */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              className="rounded bg-gray-200 px-4 py-2 hover:bg-gray-300"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded bg-darkGreen px-4 py-2 text-white hover:bg-darkBlue"
              disabled={isLoading}
            >
              {isLoading ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditJobModal;
