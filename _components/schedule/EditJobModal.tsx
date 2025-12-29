"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { updateJob } from "../../app/lib/actions/scheduleJobs.actions";
import { ScheduleType } from "../../app/lib/typeDefinitions";
import toast from "react-hot-toast";
import TechnicianSelect from "./TechnicianSelect";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { DatePickerWithTime } from "../ui/date-picker-with-time";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

const HOURS_OPTIONS = [2, 4, 6, 8, 12] as const;

interface EditJobModalProps {
  job: ScheduleType;
  onClose: () => void;
  technicians: { id: string; name: string }[];
}

const EditJobModal = ({ job, onClose, technicians }: EditJobModalProps) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // Parse the initial date
  const getInitialDate = (): Date | undefined => {
    if (!job.startDateTime) return undefined;
    const date = new Date(job.startDateTime);
    return isNaN(date.getTime()) ? undefined : date;
  };

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    clearErrors,
    formState: { errors },
  } = useForm({
    defaultValues: {
      jobTitle: job.jobTitle,
      location: job.location,
      startDateTime: getInitialDate(),
      assignedTechnicians: job.assignedTechnicians,
      technicianNotes: job.technicianNotes || "",
      hours: job.hours || 4,
      onSiteContact: job.onSiteContact || { name: "", phone: "", email: "" },
      accessInstructions: job.accessInstructions || "",
    },
  });

  const startDateTime = watch("startDateTime");

  const onSubmit = async (data: any) => {
    setIsLoading(true);

    try {
      // Validate required fields
      if (!data.startDateTime) {
        toast.error("Please select a start date and time.");
        setIsLoading(false);
        return;
      }

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

      // Ensure startDateTime is a Date object and convert to UTC
      const dateValue =
        trimmedData.startDateTime instanceof Date
          ? trimmedData.startDateTime
          : new Date(trimmedData.startDateTime);
      trimmedData.startDateTime = new Date(
        Date.UTC(
          dateValue.getFullYear(),
          dateValue.getMonth(),
          dateValue.getDate(),
          dateValue.getHours(),
          dateValue.getMinutes(),
          dateValue.getSeconds(),
        ),
      );

      await updateJob({
        scheduleId: job._id as string,
        jobTitle: trimmedData.jobTitle,
        location: trimmedData.location,
        startDateTime: trimmedData.startDateTime,
        assignedTechnicians: trimmedData.assignedTechnicians,
        technicianNotes: trimmedData.technicianNotes,
        hours: trimmedData.hours,
        onSiteContact: trimmedData.onSiteContact,
        accessInstructions: trimmedData.accessInstructions,
      });

      // Refresh the server component to get fresh data
      router.refresh();

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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Job Details Section */}
      <div className="space-y-4">
        <h3 className="text-muted-foreground text-sm font-semibold tracking-wide uppercase">
          Job Details
        </h3>

        {/* Job Title & Location - 2 columns */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="editJobTitle">
              Job Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="editJobTitle"
              type="text"
              {...register("jobTitle", {
                required: "Job Title is required",
              })}
              className={errors.jobTitle ? "border-destructive" : ""}
            />
            {errors.jobTitle && (
              <p className="text-destructive text-sm">
                {errors.jobTitle.message as string}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="editLocation">
              Location <span className="text-destructive">*</span>
            </Label>
            <Input
              id="editLocation"
              type="text"
              {...register("location", {
                required: "Location is required",
              })}
              className={errors.location ? "border-destructive" : ""}
            />
            {errors.location && (
              <p className="text-destructive text-sm">
                {errors.location.message as string}
              </p>
            )}
          </div>
        </div>

        {/* Start Date & Time - Full Width */}
        <div className="space-y-2">
          <Label htmlFor="editStartDateTime">
            Start Date & Time <span className="text-destructive">*</span>
          </Label>
          <DatePickerWithTime
            date={
              startDateTime instanceof Date
                ? startDateTime
                : startDateTime
                  ? new Date(startDateTime as string)
                  : undefined
            }
            onSelect={(date) => {
              if (date) {
                setValue("startDateTime", date, { shouldValidate: true });
                clearErrors("startDateTime");
              }
            }}
            datePlaceholder="Select date"
            timePlaceholder="Select time"
            dateId="editStartDate"
            timeId="editStartTime"
          />
          {errors.startDateTime && (
            <p className="text-destructive text-sm">
              Start Date & Time is required
            </p>
          )}
        </div>

        {/* Estimated Duration - Full Width */}
        <div className="space-y-2">
          <Label htmlFor="editHours">
            Estimated Duration
            <span className="text-muted-foreground ml-2 text-xs font-normal">
              (from invoice)
            </span>
          </Label>
          <Controller
            control={control}
            name="hours"
            render={({ field }) => (
              <Select
                value={String(field.value || 4)}
                onValueChange={(value) => field.onChange(Number(value))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  {HOURS_OPTIONS.map((h) => (
                    <SelectItem key={h} value={String(h)}>
                      {h} hours
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>

        {/* Technicians - Full Width */}
        <div className="space-y-2">
          <Label htmlFor="editTechnicians">Assign Technicians</Label>
          <TechnicianSelect
            control={control}
            name="assignedTechnicians"
            technicians={technicians}
            placeholder="Select technicians..."
            error={errors.assignedTechnicians}
            theme="light"
          />
        </div>
      </div>

      {/* Site Access Info Section */}
      <div className="space-y-4 border-t pt-4">
        <h3 className="text-muted-foreground text-sm font-semibold tracking-wide uppercase">
          Site Access Info
        </h3>

        {/* Contact Name & Phone - 2 columns */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="editContactName">
              Contact Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="editContactName"
              {...register("onSiteContact.name", {
                required: "Contact Name is required",
              })}
              placeholder="John Smith"
              className={errors.onSiteContact?.name ? "border-destructive" : ""}
            />
            {errors.onSiteContact?.name && (
              <p className="text-destructive text-sm">
                {errors.onSiteContact.name.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="editContactPhone">
              Phone <span className="text-destructive">*</span>
            </Label>
            <Input
              id="editContactPhone"
              {...register("onSiteContact.phone", {
                required: "Phone number is required",
              })}
              placeholder="604-555-1234"
              type="tel"
              className={
                errors.onSiteContact?.phone ? "border-destructive" : ""
              }
            />
            {errors.onSiteContact?.phone && (
              <p className="text-destructive text-sm">
                {errors.onSiteContact.phone.message}
              </p>
            )}
          </div>
        </div>

        {/* Email - Full Width */}
        <div className="space-y-2">
          <Label htmlFor="editContactEmail">Email (optional)</Label>
          <Input
            id="editContactEmail"
            {...register("onSiteContact.email")}
            placeholder="contact@example.com"
            type="email"
          />
        </div>

        {/* Access Instructions - Full Width */}
        <div className="space-y-2">
          <Label htmlFor="editAccessInstructions">
            Access Instructions <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="editAccessInstructions"
            {...register("accessInstructions", {
              required: "Access Instructions are required",
            })}
            rows={2}
            placeholder="e.g., Use back entrance, gate code is 1234, ask for manager on duty"
            className={errors.accessInstructions ? "border-destructive" : ""}
          />
          {errors.accessInstructions && (
            <p className="text-destructive text-sm">
              {errors.accessInstructions.message as string}
            </p>
          )}
        </div>
      </div>

      {/* Notes Section */}
      <div className="space-y-4 border-t pt-4">
        <h3 className="text-muted-foreground text-sm font-semibold tracking-wide uppercase">
          Notes
        </h3>

        <div className="space-y-2">
          <Label htmlFor="editTechnicianNotes">Technician Notes</Label>
          <Textarea
            id="editTechnicianNotes"
            {...register("technicianNotes")}
            rows={3}
            placeholder="Enter any notes about this job (equipment, etc.)"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="border-border flex justify-end gap-3 border-t pt-4">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </form>
  );
};

export default EditJobModal;
