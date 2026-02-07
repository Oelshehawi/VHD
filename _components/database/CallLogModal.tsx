"use client";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { FaPhone, FaStickyNote, FaClock } from "react-icons/fa";
import {
  CALL_OUTCOME_LABELS,
  QUICK_OUTCOMES,
  CallOutcome,
} from "../../app/lib/callLogConstants";
import { CallLogEntry } from "../../app/lib/typeDefinitions";
import { useUser } from "@clerk/nextjs";
import { logJobCall } from "../../app/lib/actions/actions";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { DatePicker } from "../ui/date-picker";

interface CallLogModalProps {
  open: boolean;
  onClose: () => void;
  onLogged?: () => void | Promise<void>;
  context: {
    type: "job" | "invoice";
    id: string;
    title: string;
    clientName?: string;
  };
}

const CallLogModal = ({
  open,
  onClose,
  onLogged,
  context,
}: CallLogModalProps) => {
  const { user } = useUser();
  const [selectedOutcome, setSelectedOutcome] = useState<CallOutcome | null>(
    null,
  );

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<{
    outcome: CallOutcome;
    notes: string;
    followUpDate?: Date;
    duration?: number;
  }>();

  const watchedFollowUpDate = watch("followUpDate");

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFormSubmit = async (values: any) => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const callLogEntry: CallLogEntry = {
        callerId: user?.id || "",
        callerName: user?.fullName || user?.firstName || "Unknown User",
        timestamp: new Date(),
        outcome: values.outcome,
        notes: values.notes,
        followUpDate: values.followUpDate || undefined,
        duration: values.duration ? Number(values.duration) : undefined,
      };

      // Call the appropriate server action based on context type
      let result;
      if (context.type === "invoice") {
        const { logInvoicePaymentCall } =
          await import("../../app/lib/actions/actions");
        result = await logInvoicePaymentCall(context.id, callLogEntry);
      } else {
        result = await logJobCall(context.id, callLogEntry);
      }

      if (result && result.success) {
        await onLogged?.();
        toast.success("Call logged successfully");
        handleClose();
      } else {
        throw new Error("Server action returned failure");
      }
    } catch (error) {
      console.error("Error logging call:", error);
      toast.error("Failed to log call");
    } finally {
      setIsSubmitting(false);
    }
  };

  const watchedOutcome = watch("outcome");

  useEffect(() => {
    if (watchedOutcome) {
      setSelectedOutcome(watchedOutcome);
    }
  }, [watchedOutcome]);

  const handleClose = () => {
    if (isSubmitting) return; // Prevent closing while submitting
    setSelectedOutcome(null);
    setIsSubmitting(false);
    reset();
    onClose();
  };

  const handleQuickOutcome = (
    outcome: CallOutcome,
    followUpDays: number | null,
  ) => {
    setValue("outcome", outcome);
    setSelectedOutcome(outcome);

    if (followUpDays !== null) {
      const followUpDate = new Date();
      followUpDate.setDate(followUpDate.getDate() + followUpDays);
      setValue("followUpDate", followUpDate);
    } else {
      setValue("followUpDate", undefined);
    }

    // Auto-focus notes field
    setTimeout(() => {
      const notesField = document.querySelector(
        'textarea[name="notes"]',
      ) as HTMLTextAreaElement;
      if (notesField) {
        notesField.focus();
      }
    }, 100);
  };

  const contextType = context.type === "job" ? "scheduling" : "payment";
  const quickOutcomes =
    contextType === "scheduling"
      ? QUICK_OUTCOMES.SCHEDULING
      : QUICK_OUTCOMES.PAYMENT;

  return (
    <Dialog open={open} onOpenChange={(val) => !val && handleClose()}>
      <DialogContent className="max-h-[85vh] overflow-hidden overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-lg">
              <FaPhone className="text-primary h-4 w-4" />
            </div>
            <div className="text-left">
              <DialogTitle>Log Call</DialogTitle>
              <div className="text-muted-foreground mt-1 flex flex-col text-xs">
                <span>
                  {context.type === "job" ? "Scheduling call" : "Payment call"}{" "}
                  • {context.title}
                </span>
                {context.clientName && <span>{context.clientName}</span>}
              </div>
            </div>
          </div>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(handleFormSubmit)}
          className="space-y-4 py-2"
        >
          {/* Quick Outcome Buttons */}
          <div>
            <label className="text-foreground mb-2 block text-xs font-semibold">
              Quick Outcomes
            </label>
            <div className="grid grid-cols-2 gap-2">
              {quickOutcomes.map(({ outcome, label, followUpDays }) => (
                <button
                  key={outcome}
                  type="button"
                  onClick={() => handleQuickOutcome(outcome, followUpDays)}
                  className={`rounded-lg border p-2 text-xs font-medium transition-all duration-200 ${
                    selectedOutcome === outcome
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-background text-foreground hover:bg-muted"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Common Outcomes */}
          <div>
            <label className="text-foreground mb-2 block text-xs font-semibold">
              Other Outcomes
            </label>
            <div className="grid grid-cols-2 gap-2">
              {QUICK_OUTCOMES.COMMON.map(({ outcome, label, followUpDays }) => (
                <button
                  key={outcome}
                  type="button"
                  onClick={() => handleQuickOutcome(outcome, followUpDays)}
                  className={`rounded-lg border p-2 text-xs font-medium transition-all duration-200 ${
                    selectedOutcome === outcome
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-background text-foreground hover:bg-muted"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Outcome Dropdown */}
          <div className="group space-y-2">
            <label className="text-foreground flex items-center gap-1 text-xs font-semibold">
              Outcome <span className="text-destructive">*</span>
            </label>
            <Select
              value={watchedOutcome}
              onValueChange={(val) => {
                setValue("outcome", val as CallOutcome);
                setSelectedOutcome(val as CallOutcome);
              }}
            >
              <SelectTrigger
                className={
                  errors.outcome
                    ? "border-destructive bg-destructive/10 ring-destructive/20 focus:ring-1"
                    : ""
                }
              >
                <SelectValue placeholder="Select outcome..." />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(CALL_OUTCOME_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.outcome && (
              <div className="text-destructive flex items-center gap-1 text-xs">
                <div className="bg-destructive h-1 w-1 rounded-full"></div>
                Please select a call outcome
              </div>
            )}
            {/* Hidden Input for hook form registration if needed, but managing via setValue is cleaner */}
          </div>

          {/* Notes */}
          <div className="group space-y-2">
            <label className="text-foreground flex items-center gap-1 text-xs font-semibold">
              Notes <span className="text-destructive">*</span>
            </label>
            <p className="text-muted-foreground text-xs">
              What was discussed during the call?
            </p>
            <div className="relative">
              <div className="text-muted-foreground absolute top-3 left-3">
                <FaStickyNote className="h-3 w-3" />
              </div>
              <textarea
                {...register("notes", { required: true })}
                placeholder="Enter call details, customer response, next steps, etc..."
                className={`border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[80px] w-full resize-none rounded-md border px-3 py-2 pl-10 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 ${
                  errors.notes
                    ? "border-destructive bg-destructive/10 focus-visible:ring-destructive/20"
                    : ""
                }`}
              />
            </div>
            {errors.notes && (
              <div className="text-destructive flex items-center gap-1 text-xs">
                <div className="bg-destructive h-1 w-1 rounded-full"></div>
                Call notes are required
              </div>
            )}
          </div>

          {/* Follow-up & Duration Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Follow-up Date */}
            <div className="group space-y-2">
              <label className="text-foreground block text-xs font-semibold">
                Follow-up Date
              </label>
              <DatePicker
                date={watchedFollowUpDate}
                onSelect={(date) => {
                  setValue("followUpDate", date);
                }}
                placeholder="Select date"
                minDate={new Date()}
                className="h-10"
              />
            </div>

            {/* Duration */}
            <div className="group space-y-2">
              <label className="text-foreground block text-xs font-semibold">
                Duration (min)
              </label>
              <div className="relative">
                <div className="text-muted-foreground absolute top-2.5 left-3">
                  <FaClock className="h-3 w-3" />
                </div>
                <input
                  {...register("duration", { min: 1, max: 999 })}
                  type="number"
                  placeholder="5"
                  min="1"
                  max="999"
                  className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 pl-10 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white"></div>
                  Logging Call...
                </>
              ) : (
                <>
                  <FaPhone className="mr-2 h-3 w-3" />
                  Log Call
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CallLogModal;
