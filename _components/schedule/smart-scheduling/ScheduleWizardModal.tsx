"use client";

import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Loader2, Check } from "lucide-react";
import { createInvoiceAndScheduleFromJob } from "../../../app/lib/actions/smartScheduling.actions";
import TechnicianSelect from "../TechnicianSelect";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../../ui/dialog";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Textarea } from "../../ui/textarea";
import { DatePickerWithTime } from "../../ui/date-picker-with-time";
import { Badge } from "../../ui/badge";
import { formatDateStringUTC } from "../../../app/lib/utils";
import type { ScheduleType } from "../../../app/lib/typeDefinitions";
import { parse, format } from "date-fns";

interface ScheduleWizardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourceScheduleJobId: string;
  jobTitle: string;
  location: string;
  selectedDate: string; // YYYY-MM-DD format
  sourceStartTime?: string; // HH:mm from source job
  technicians: { id: string; name: string }[];
  onComplete: () => void;
}

type WizardStep = 1 | 2 | 3;

export default function ScheduleWizardModal({
  open,
  onOpenChange,
  sourceScheduleJobId,
  jobTitle,
  location,
  selectedDate,
  sourceStartTime,
  technicians,
  onComplete,
}: ScheduleWizardModalProps) {
  const { user } = useUser();
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<ScheduleType>({
    defaultValues: {
      jobTitle,
      location,
      startDateTime: undefined,
      assignedTechnicians: [],
      invoiceRef: "",
      confirmed: false,
      technicianNotes: "",
      hours: 4,
      onSiteContact: { name: "", phone: "", email: "" },
      accessInstructions: "",
    },
  });

  const startDateTime = watch("startDateTime");
  const assignedTechnicians = watch("assignedTechnicians");

  // Initialize startDateTime from selectedDate and source job time if provided
  useEffect(() => {
    if (open && selectedDate) {
      const date = parse(selectedDate, "yyyy-MM-dd", new Date());
      if (sourceStartTime) {
        const [h, m] = sourceStartTime.split(":").map(Number);
        date.setHours(h ?? 8, m ?? 0, 0, 0);
      } else {
        date.setHours(8, 0, 0, 0);
      }
      setValue("startDateTime", date);
    }
  }, [open, selectedDate, sourceStartTime, setValue]);

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      reset();
      setCurrentStep(1);
    }
  }, [open, reset]);

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep((prev) => (prev + 1) as WizardStep);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as WizardStep);
    }
  };

  const onSubmit = async (data: ScheduleType) => {
    setIsSubmitting(true);
    try {
      if (!data.startDateTime) {
        toast.error("Start date and time is required");
        return;
      }

      const dateValue =
        data.startDateTime instanceof Date
          ? data.startDateTime
          : new Date(data.startDateTime);
      if (Number.isNaN(dateValue.getTime())) {
        toast.error("Invalid start date and time");
        return;
      }

      // Match Add/Edit Schedule convention: preserve picked wall-clock time as UTC components.
      const normalizedStartDateTime = new Date(
        Date.UTC(
          dateValue.getFullYear(),
          dateValue.getMonth(),
          dateValue.getDate(),
          dateValue.getHours(),
          dateValue.getMinutes(),
          dateValue.getSeconds(),
        ),
      );
      const startDateTimeISO = normalizedStartDateTime.toISOString();

      const result = await createInvoiceAndScheduleFromJob(
        sourceScheduleJobId,
        selectedDate,
        startDateTimeISO,
        data.assignedTechnicians,
        data.technicianNotes,
        data.accessInstructions,
        data.onSiteContact,
      );

      if (result.success) {
        toast.success("Invoice and job scheduled successfully!");
        onComplete();
      } else {
        toast.error(result.error || "Failed to create invoice and schedule");
      }
    } catch (error) {
      console.error("Error creating invoice and schedule:", error);
      toast.error("Failed to create invoice and schedule. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceedToStep2 = jobTitle && location;
  const canProceedToStep3 = startDateTime && assignedTechnicians.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Scheduling Wizard</DialogTitle>
          <DialogDescription>
            Step {currentStep} of 3: {currentStep === 1 && "Review Invoice"}
            {currentStep === 2 && "Schedule Details"}
            {currentStep === 3 && "Confirm & Create"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Step 1: Review Invoice */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg border p-4">
                <h3 className="mb-3 font-medium">Invoice Details</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <Label className="text-muted-foreground">Job Title</Label>
                    <Input
                      {...register("jobTitle", { required: true })}
                      className="mt-1"
                    />
                    {errors.jobTitle && (
                      <p className="text-destructive mt-1 text-xs">
                        Job title is required
                      </p>
                    )}
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Location</Label>
                    <Input
                      {...register("location", { required: true })}
                      className="mt-1"
                    />
                    {errors.location && (
                      <p className="text-destructive mt-1 text-xs">
                        Location is required
                      </p>
                    )}
                  </div>
                  <div>
                    <Label className="text-muted-foreground">
                      Selected Date
                    </Label>
                    <p className="font-medium">
                      {formatDateStringUTC(selectedDate)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Schedule Details */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="startDateTime">Start Date & Time</Label>
                <Controller
                  name="startDateTime"
                  control={control}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <DatePickerWithTime
                      date={
                        field.value instanceof Date
                          ? field.value
                          : field.value
                            ? new Date(field.value)
                            : undefined
                      }
                      onSelect={(date) => field.onChange(date)}
                      className="mt-1"
                    />
                  )}
                />
                {errors.startDateTime && (
                  <p className="text-destructive mt-1 text-xs">
                    Start date and time is required
                  </p>
                )}
              </div>

              <div>
                <Label>Assign Technicians</Label>
                <TechnicianSelect
                  control={control}
                  name="assignedTechnicians"
                  technicians={technicians}
                  placeholder="Select technicians..."
                  required={true}
                  error={errors.assignedTechnicians}
                />
                {errors.assignedTechnicians && (
                  <p className="text-destructive mt-1 text-xs">
                    At least one technician must be assigned
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="technicianNotes">Notes (Optional)</Label>
                <Textarea
                  {...register("technicianNotes")}
                  placeholder="Add any notes for technicians..."
                  className="mt-1"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="accessInstructions">
                  Access Instructions (Optional)
                </Label>
                <Textarea
                  {...register("accessInstructions")}
                  placeholder="Parking, entry codes, etc..."
                  className="mt-1"
                  rows={2}
                />
              </div>
            </div>
          )}

          {/* Step 3: Confirm */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg border p-4">
                <h3 className="mb-3 font-medium">Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Job Title:</span>
                    <span className="font-medium">{watch("jobTitle")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Location:</span>
                    <span className="font-medium">{watch("location")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Date & Time:</span>
                    <span className="font-medium">
                      {startDateTime
                        ? format(
                            new Date(startDateTime),
                            "MMM d, yyyy 'at' h:mm a",
                          )
                        : "Not set"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Technicians:</span>
                    <div className="flex gap-1">
                      {assignedTechnicians.map((techId) => {
                        const tech = technicians.find((t) => t.id === techId);
                        return (
                          <Badge key={techId} variant="secondary">
                            {tech?.name || "Unknown"}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-green-500/50 bg-green-500/10 p-4">
                <div className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <p className="text-sm font-medium">
                    Ready to create schedule. Click &ldquo;Create
                    Schedule&rdquo; to confirm.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between border-t pt-4">
            <div>
              {currentStep > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  disabled={isSubmitting}
                >
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  Back
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              {currentStep < 3 ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  disabled={
                    (currentStep === 1 && !canProceedToStep2) ||
                    (currentStep === 2 && !canProceedToStep3) ||
                    isSubmitting
                  }
                >
                  Next
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              ) : (
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Schedule"
                  )}
                </Button>
              )}
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
