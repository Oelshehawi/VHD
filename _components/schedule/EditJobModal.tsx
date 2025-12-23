"use client";

import { useState } from "react";
import { updateJob } from "../../app/lib/actions/scheduleJobs.actions";
import { ScheduleType } from "../../app/lib/typeDefinitions";
import toast from "react-hot-toast";
import { useForm } from "react-hook-form";
import { formatLocalDateTime } from "../../app/lib/utils";
import TechnicianSelect from "./TechnicianSelect";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

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
    <Card>
      <CardHeader>
        <CardTitle>Edit Job</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Job Title */}
          <div className="space-y-2">
            <Label htmlFor="jobTitle">
              Job Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="jobTitle"
              type="text"
              {...register("jobTitle", { required: "Job Title is required" })}
              className={errors.jobTitle ? "border-destructive" : ""}
            />
            {errors.jobTitle && (
              <p className="text-sm text-destructive">{errors.jobTitle.message}</p>
            )}
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location">
              Location <span className="text-destructive">*</span>
            </Label>
            <Input
              id="location"
              type="text"
              {...register("location", { required: "Location is required" })}
              className={errors.location ? "border-destructive" : ""}
            />
            {errors.location && (
              <p className="text-sm text-destructive">{errors.location.message}</p>
            )}
          </div>

          {/* Start Date & Time */}
          <div className="space-y-2">
            <Label htmlFor="startDateTime">
              Start Date & Time <span className="text-destructive">*</span>
            </Label>
            <Input
              id="startDateTime"
              type="datetime-local"
              {...register("startDateTime", {
                required: "Start Date & Time is required",
              })}
              className={errors.startDateTime ? "border-destructive" : ""}
            />
            {errors.startDateTime && (
              <p className="text-sm text-destructive">
                {errors.startDateTime.message}
              </p>
            )}
          </div>

          {/* Assigned Technicians */}
          <div className="space-y-2">
            <Label htmlFor="technicians">Assign Technicians</Label>
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
          <div className="space-y-2">
            <Label htmlFor="technicianNotes">Technician Notes</Label>
            <Textarea
              id="technicianNotes"
              {...register("technicianNotes")}
              rows={4}
              placeholder="Enter any notes about this job (equipment, access instructions, etc.)"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default EditJobModal;
