"use client";
import { useState, useEffect } from "react";
import { useForm, SubmitHandler, Controller } from "react-hook-form";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { ScheduleType, InvoiceType } from "../../app/lib/typeDefinitions";
import { InvoiceSearchSelect } from "../invoices/InvoiceSearchSelect";
import {
  createSchedule,
  getPendingInvoices,
} from "../../app/lib/actions/scheduleJobs.actions";
import {
  calculateJobDurationFromPrice,
  minutesToPayrollHours,
} from "../../app/lib/utils";
import TechnicianSelect from "./TechnicianSelect";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";
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
import { Loader2 } from "lucide-react";

const HOURS_OPTIONS = [2, 4, 6, 8, 12] as const;

const AddJob = ({
  open,
  onOpenChange,
  technicians,
  scheduledJobs,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  technicians: { id: string; name: string }[];
  scheduledJobs: ScheduleType[];
}) => {
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  // Lazy load pending invoices when modal opens
  const { data: invoices = [], isLoading: isLoadingInvoices } = useQuery({
    queryKey: ["pendingInvoices"],
    queryFn: getPendingInvoices,
    enabled: open,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isValid },
    setValue,
    clearErrors,
    watch,
    reset,
  } = useForm<ScheduleType>({
    defaultValues: {
      jobTitle: "",
      location: "",
      startDateTime: undefined,
      assignedTechnicians: [],
      invoiceRef: "",
      confirmed: false,
      technicianNotes: "",
      hours: 4,
    },
    mode: "onChange",
  });

  const startDateTime = watch("startDateTime");
  const hours = watch("hours");

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      reset();
      setResetKey((prev) => prev + 1);
    }
  }, [open, reset]);

  const handleInvoiceSelect = (invoice: InvoiceType) => {
    setValue("invoiceRef", invoice._id, { shouldValidate: true });
    setValue("jobTitle", invoice.jobTitle);
    setValue("location", invoice.location ?? "");
    clearErrors(["invoiceRef", "jobTitle", "location"]);

    // Autofill startDateTime with invoice dateIssued if available
    if (invoice.dateIssued) {
      // Parse date string without timezone conversion to prevent day shift
      const dateStr =
        typeof invoice.dateIssued === "string"
          ? invoice.dateIssued.split("T")[0]
          : new Date(invoice.dateIssued).toISOString().split("T")[0];
      const [year, month, day] = dateStr!.split("-").map(Number);
      const invoiceDate = new Date(year!, month! - 1, day!, 9, 0, 0, 0);
      setValue("startDateTime", invoiceDate);
    }

    // Calculate estimated hours from invoice total price
    if (invoice.items && invoice.items.length > 0) {
      const totalPrice = invoice.items.reduce(
        (sum, item) => sum + (item.price || 0),
        0,
      );
      const durationMinutes = calculateJobDurationFromPrice(totalPrice);
      const estimatedHours = minutesToPayrollHours(durationMinutes);
      setValue("hours", estimatedHours);
    }

    // Check for previous jobs with the same title and grab technician notes if available
    if (scheduledJobs && scheduledJobs.length > 0 && invoice.jobTitle) {
      // Sort jobs by startDateTime descending to get the most recent one first
      const sortedJobs = [...scheduledJobs]
        .filter((job) => job.jobTitle === invoice.jobTitle)
        .sort((a, b) => {
          const dateA = new Date(a.startDateTime).getTime();
          const dateB = new Date(b.startDateTime).getTime();
          return dateB - dateA; // Most recent first
        });

      // If we found a previous job with the same title that has technician notes
      if (sortedJobs.length > 0 && sortedJobs[0]?.technicianNotes) {
        setValue("technicianNotes", sortedJobs[0].technicianNotes);
      }
    }
  };

  const handleSave: SubmitHandler<ScheduleType> = async (data) => {
    setIsLoading(true);
    try {
      // Validate required fields
      if (!data.startDateTime) {
        toast.error("Please select a start date and time.");
        setIsLoading(false);
        return;
      }

      // Trim all string fields to remove leading/trailing spaces
      if (data.jobTitle) {
        data.jobTitle = data.jobTitle.trim();
      }
      if (data.location) {
        data.location = data.location.trim();
      }
      if (data.technicianNotes) {
        data.technicianNotes = data.technicianNotes.trim();
      }

      // Ensure startDateTime is a Date object
      const dateValue =
        data.startDateTime instanceof Date
          ? data.startDateTime
          : new Date(data.startDateTime);
      data.startDateTime = new Date(
        Date.UTC(
          dateValue.getFullYear(),
          dateValue.getMonth(),
          dateValue.getDate(),
          dateValue.getHours(),
          dateValue.getMinutes(),
          dateValue.getSeconds(),
        ),
      );
      const performedBy = user?.fullName || user?.firstName || "user";
      await createSchedule(data, performedBy);
      onOpenChange(false);
      toast.success("Schedule has been successfully added.");
    } catch (error) {
      console.error("Error saving Schedule:", error);
      toast.error("Error saving Schedule. Please check input fields.");
    } finally {
      setIsLoading(false);
    }
  };

  const formFields = [
    {
      name: "jobTitle",
      placeholder: "Job Title",
      type: "text",
      isRequired: true,
      icon: "📋",
    },
    {
      name: "location",
      placeholder: "Location",
      type: "text",
      isRequired: true,
      icon: "📍",
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add New Job</DialogTitle>
          <DialogDescription>
            Create a new scheduled job for your calendar.
          </DialogDescription>
        </DialogHeader>

        {/* Form */}
        <form
          className="flex flex-col gap-4"
          onSubmit={handleSubmit(handleSave)}
        >
          {/* Invoice SearchSelect */}
          <div className="space-y-2">
            <Label htmlFor="invoice">
              Select Invoice<span className="text-destructive">*</span>
            </Label>
            {isLoadingInvoices ? (
              <div className="flex h-10 items-center justify-center rounded-md border">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-muted-foreground ml-2 text-sm">
                  Loading invoices...
                </span>
              </div>
            ) : (
              <InvoiceSearchSelect
                invoices={invoices as InvoiceType[]}
                onSelect={handleInvoiceSelect}
                error={errors.invoiceRef}
                resetKey={resetKey}
              />
            )}
            {errors.invoiceRef && (
              <p className="text-destructive text-sm">Invoice is required</p>
            )}
          </div>

          {/* Other Input Fields */}
          {formFields.map(({ name, placeholder, type, isRequired }) => (
            <div className="space-y-2" key={name}>
              <Label htmlFor={name}>
                {placeholder}
                {isRequired && <span className="text-destructive">*</span>}
              </Label>
              <Input
                id={name}
                {...register(name as "jobTitle" | "location", {
                  required: isRequired,
                })}
                type={type}
                placeholder={placeholder}
                className={
                  errors[name as "jobTitle" | "location"]
                    ? "border-destructive"
                    : ""
                }
              />
              {errors[name as "jobTitle" | "location"]?.type === "required" && (
                <p className="text-destructive text-sm">
                  {placeholder} is required
                </p>
              )}
            </div>
          ))}

          {/* Date & Time Picker */}
          <div className="space-y-2">
            <Label htmlFor="startDateTime">
              Start Date & Time
              <span className="text-destructive">*</span>
            </Label>
            <DatePickerWithTime
              date={
                startDateTime instanceof Date
                  ? startDateTime
                  : startDateTime
                    ? new Date(startDateTime)
                    : undefined
              }
              onSelect={(date) => {
                if (date) {
                  setValue("startDateTime", date, { shouldValidate: true });
                  clearErrors("startDateTime");
                } else {
                  // Clear the value - set to empty string for validation
                  setValue("startDateTime", "" as Date | string, {
                    shouldValidate: true,
                  });
                }
              }}
              datePlaceholder="Select date"
              timePlaceholder="Select time"
              dateId="startDate"
              timeId="startTime"
            />
            {errors.startDateTime && (
              <p className="text-destructive text-sm">
                Start Date & Time is required
              </p>
            )}
          </div>

          {/* Estimated Duration */}
          <div className="space-y-2">
            <Label htmlFor="hours">Estimated Duration</Label>
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
            <p className="text-muted-foreground text-xs">
              Auto-calculated from invoice price. You can override if needed.
            </p>
          </div>

          {/* Technician Select */}
          <div className="space-y-2">
            <Label htmlFor="technicians">Assign Technicians</Label>
            <TechnicianSelect
              control={control}
              name="assignedTechnicians"
              technicians={technicians}
              placeholder="Select technicians..."
              error={errors.assignedTechnicians}
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

          {/* Submit Button */}
          <div className="mt-2 flex justify-end">
            <Button type="submit" disabled={isLoading || !isValid}>
              {isLoading ? "Submitting..." : "Add Job"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddJob;
