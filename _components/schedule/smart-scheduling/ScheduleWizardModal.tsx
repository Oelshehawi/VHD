"use client";

import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { toast } from "sonner";
import {
  CalendarIcon,
  CheckCircleIcon,
  ClockIcon,
  DocumentTextIcon,
  MapPinIcon,
} from "@heroicons/react/24/outline";
import {
  createInvoiceAndScheduleFromJob,
  getScheduleJobDetails,
  type SmartScheduleJobDetails,
} from "../../../app/lib/actions/smartScheduling.actions";
import TechnicianSelect from "../TechnicianSelect";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../ui/dialog";
import { Button } from "../../ui/button";
import { Card, CardContent } from "../../ui/card";
import { DatePickerWithTime } from "../../ui/date-picker-with-time";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { ScrollArea } from "../../ui/scroll-area";
import { Separator } from "../../ui/separator";
import { Skeleton } from "../../ui/skeleton";
import { Textarea } from "../../ui/textarea";
import { formatAmount, formatDateWithWeekdayUTC } from "../../../app/lib/utils";
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

type SmartScheduleFormValues = {
  startDateTime: Date | string | undefined;
  assignedTechnicians: string[];
  technicianNotes?: string;
  accessInstructions?: string;
  onSiteContact?: {
    name?: string;
    phone?: string;
    email?: string;
  };
};

function calculateTotal(items: Array<{ price?: number }> | undefined) {
  const subtotal =
    items?.reduce((sum, item) => sum + (item.price || 0), 0) || 0;
  const gst = subtotal * 0.05;
  return { subtotal, gst, total: subtotal + gst };
}

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [sourceDetails, setSourceDetails] =
    useState<SmartScheduleJobDetails | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<SmartScheduleFormValues>({
    defaultValues: {
      startDateTime: undefined,
      assignedTechnicians: [],
      technicianNotes: "",
      accessInstructions: "",
      onSiteContact: { name: "", phone: "", email: "" },
    },
    mode: "onChange",
  });

  const startDateTime = watch("startDateTime");
  const assignedTechnicians = watch("assignedTechnicians") || [];

  useEffect(() => {
    if (!open || !selectedDate) return;

    const date = parse(selectedDate, "yyyy-MM-dd", new Date());
    if (sourceStartTime) {
      const [h, m] = sourceStartTime.split(":").map(Number);
      date.setHours(h ?? 8, m ?? 0, 0, 0);
    } else {
      date.setHours(8, 0, 0, 0);
    }
    setValue("startDateTime", date, { shouldValidate: true });
  }, [open, selectedDate, sourceStartTime, setValue]);

  useEffect(() => {
    let isCancelled = false;

    const fetchDetails = async () => {
      if (!open || !sourceScheduleJobId) return;
      setIsLoadingDetails(true);

      try {
        const details = await getScheduleJobDetails(sourceScheduleJobId);
        if (!isCancelled) {
          setSourceDetails(details);
        }
      } catch (error) {
        if (!isCancelled) {
          console.error("Error loading source schedule details:", error);
          setSourceDetails(null);
          toast.error("Failed to load source job details");
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingDetails(false);
        }
      }
    };

    fetchDetails();

    return () => {
      isCancelled = true;
    };
  }, [open, sourceScheduleJobId]);

  useEffect(() => {
    if (!open) {
      reset();
      setSourceDetails(null);
      setIsLoadingDetails(false);
    }
  }, [open, reset]);

  const onSubmit = async (data: SmartScheduleFormValues) => {
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

      const normalizedOnSiteContact =
        data.onSiteContact?.name?.trim() || data.onSiteContact?.phone?.trim()
          ? {
              name: data.onSiteContact?.name?.trim() || "",
              phone: data.onSiteContact?.phone?.trim() || "",
              email: data.onSiteContact?.email?.trim() || undefined,
            }
          : undefined;

      const result = await createInvoiceAndScheduleFromJob(
        sourceScheduleJobId,
        selectedDate,
        startDateTimeISO,
        data.assignedTechnicians || [],
        data.technicianNotes,
        data.accessInstructions,
        normalizedOnSiteContact,
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

  const selectedInvoice = sourceDetails?.invoice;
  const selectedClient = sourceDetails?.client;
  const totals = calculateTotal(selectedInvoice?.items);
  const canSubmit =
    Boolean(startDateTime) && assignedTechnicians.length > 0 && !isSubmitting;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] !max-w-7xl flex-col overflow-hidden">
        <DialogHeader className="shrink-0 pb-4">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <DocumentTextIcon className="h-6 w-6" />
            Confirm Scheduling & Create Invoice + Job
          </DialogTitle>
          <DialogDescription className="text-base">
            Review details, then confirm to create both a new invoice and a new
            scheduled job from this source job.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="flex min-h-0 flex-1 gap-6">
            <div className="flex min-h-0 w-1/2 flex-col">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-muted-foreground text-sm font-semibold tracking-wide uppercase">
                  Source Invoice
                </h3>
              </div>

              <ScrollArea className="bg-muted/30 max-h-[60vh] min-h-0 flex-1 rounded-lg border p-2">
                {isLoadingDetails ? (
                  <div className="space-y-3 p-2">
                    <Skeleton className="h-28 w-full rounded-lg" />
                    <Skeleton className="h-24 w-full rounded-lg" />
                    <Skeleton className="h-24 w-full rounded-lg" />
                  </div>
                ) : selectedInvoice ? (
                  <Card>
                    <CardContent className="space-y-4 p-4">
                      <div className="space-y-3">
                        <div>
                          <p className="text-muted-foreground text-xs">
                            Client
                          </p>
                          <p className="font-medium">
                            {selectedClient?.clientName || "Unknown"}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">
                            Job Title
                          </p>
                          <p className="font-medium">
                            {selectedInvoice.jobTitle || jobTitle}
                          </p>
                        </div>
                        <div className="flex items-start gap-2">
                          <MapPinIcon className="text-muted-foreground h-4 w-4 shrink-0" />
                          <div>
                            <p className="text-muted-foreground text-xs">
                              Location
                            </p>
                            <p className="text-sm">
                              {selectedInvoice.location || location}
                            </p>
                          </div>
                        </div>
                      </div>

                      <Separator />

                      <div>
                        <p className="text-muted-foreground mb-2 text-xs font-medium">
                          Line Items
                        </p>
                        <div className="space-y-2">
                          {selectedInvoice.items?.map(
                            (item: any, idx: number) => (
                              <div
                                key={idx}
                                className="bg-muted/50 flex justify-between rounded px-3 py-2 text-sm"
                              >
                                <span className="flex-1">
                                  {item.description}
                                </span>
                                <span className="font-medium">
                                  {formatAmount(item.price || 0)}
                                </span>
                              </div>
                            ),
                          )}
                        </div>
                      </div>

                      <Separator />

                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Subtotal
                          </span>
                          <span>{formatAmount(totals.subtotal)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            GST (5%)
                          </span>
                          <span>{formatAmount(totals.gst)}</span>
                        </div>
                        <div className="flex items-center justify-between border-t pt-2 font-semibold">
                          <span>Total</span>
                          <span className="text-lg">
                            {formatAmount(totals.total)}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="text-muted-foreground flex h-40 items-center justify-center">
                    Source invoice details not found.
                  </div>
                )}
              </ScrollArea>
            </div>

            <div className="flex min-h-0 w-1/2 flex-col">
              <Card className="border-primary/30 from-primary/5 to-primary/10 mb-4 shrink-0 bg-gradient-to-br">
                <CardContent className="p-4">
                  <h4 className="text-primary mb-3 text-xs font-semibold tracking-wide uppercase">
                    New Schedule
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="text-primary h-5 w-5" />
                      <div>
                        <p className="text-muted-foreground text-xs">Date</p>
                        <p className="font-medium">
                          {formatDateWithWeekdayUTC(selectedDate)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <ClockIcon className="text-primary h-5 w-5" />
                      <div>
                        <p className="text-muted-foreground text-xs">Time</p>
                        <p className="font-medium">
                          {startDateTime
                            ? format(new Date(startDateTime), "h:mm a")
                            : "Not set"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4">
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
                </CardContent>
              </Card>

              <Card className="mb-4 shrink-0">
                <CardContent className="p-4">
                  <h4 className="text-muted-foreground mb-3 text-xs font-semibold tracking-wide uppercase">
                    Assign Technicians
                  </h4>
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
                </CardContent>
              </Card>

              <ScrollArea className="min-h-0 flex-1 rounded-lg border p-4">
                <h4 className="text-muted-foreground mb-3 text-xs font-semibold tracking-wide uppercase">
                  Optional Notes
                </h4>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="technicianNotes">Technician Notes</Label>
                    <Textarea
                      id="technicianNotes"
                      {...register("technicianNotes")}
                      placeholder="Add notes for technicians..."
                      className="mt-1"
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="accessInstructions">
                      Access Instructions
                    </Label>
                    <Textarea
                      id="accessInstructions"
                      {...register("accessInstructions")}
                      placeholder="Parking, entry codes, etc..."
                      className="mt-1"
                      rows={3}
                    />
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <Label htmlFor="contactName">On-site Contact Name</Label>
                      <Input
                        id="contactName"
                        {...register("onSiteContact.name")}
                        placeholder="Name"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="contactPhone">
                        On-site Contact Phone
                      </Label>
                      <Input
                        id="contactPhone"
                        {...register("onSiteContact.phone")}
                        placeholder="Phone"
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="contactEmail">On-site Contact Email</Label>
                    <Input
                      id="contactEmail"
                      {...register("onSiteContact.email")}
                      placeholder="Email (optional)"
                      className="mt-1"
                    />
                  </div>
                </div>
              </ScrollArea>
            </div>
          </div>

          <Separator className="my-4" />

          <DialogFooter className="shrink-0 gap-2 sm:gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!canSubmit}
              className="min-w-[180px] bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Creating...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <CheckCircleIcon className="h-4 w-4" />
                  Confirm & Create Invoice + Job
                </span>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
