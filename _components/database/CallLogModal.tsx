"use client";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  FaPhone,
  FaTimes,
  FaCalendar,
  FaStickyNote,
  FaClock,
  FaUser,
} from "react-icons/fa";
import {
  CALL_OUTCOME_LABELS,
  QUICK_OUTCOMES,
  CallOutcome,
} from "../../app/lib/callLogConstants";
import { CallLogEntry } from "../../app/lib/typeDefinitions";
import { useUser } from "@clerk/nextjs";
import { logJobCall } from "../../app/lib/actions/actions";
import { toast } from "react-hot-toast";

interface CallLogModalProps {
  open: boolean;
  onClose: () => void;
  context: {
    type: "job" | "invoice";
    id: string;
    title: string;
    clientName?: string;
  };
}

const CallLogModal = ({ open, onClose, context }: CallLogModalProps) => {
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
    followUpDate?: string;
    duration?: number;
  }>();

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
        followUpDate: values.followUpDate
          ? new Date(values.followUpDate)
          : undefined,
        duration: values.duration ? Number(values.duration) : undefined,
      };

      // Call the appropriate server action based on context type
      let result;
      if (context.type === 'invoice') {
        const { logInvoicePaymentCall } = await import("../../app/lib/actions/actions");
        result = await logInvoicePaymentCall(context.id, callLogEntry);
      } else {
        result = await logJobCall(context.id, callLogEntry);
      }

      if (result && result.success) {
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
      setValue("followUpDate", followUpDate.toISOString().split("T")[0]);
    } else {
      setValue("followUpDate", "");
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
    <>
      {/* Background Overlay */}
      <div
        className={`bg-black/70 fixed inset-0 z-40 backdrop-blur-md transition-all duration-300 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={handleClose}
      />

      {/* Slide-out Panel */}
      <div
        className={`fixed right-0 top-0 z-50 flex h-screen w-full max-w-lg transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex w-full flex-col bg-white shadow-2xl">
          {/* Header */}
          <div className="flex w-full flex-row items-center justify-between bg-gradient-to-r from-blue-600 to-blue-700 p-4 shadow-lg">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
                <FaPhone className="h-4 w-4 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Log Call</h2>
                <p className="text-xs text-blue-100">
                  {context.type === "job" ? "Scheduling call" : "Payment call"}{" "}
                  • {context.title}
                </p>
                {context.clientName && (
                  <p className="text-xs text-blue-200">{context.clientName}</p>
                )}
              </div>
            </div>
            <button
              onClick={handleClose}
              className="group rounded-lg border border-white/20 p-2 text-white transition-all duration-200 hover:bg-white/20"
            >
              <FaTimes className="h-3 w-3 transition-transform group-hover:rotate-90" />
            </button>
          </div>

          {/* Form */}
          <form
            onSubmit={handleSubmit(handleFormSubmit)}
            className="flex-1 space-y-4 overflow-y-auto bg-gray-50 p-4"
          >
            {/* Quick Outcome Buttons */}
            <div>
              <label className="mb-2 block text-xs font-semibold text-gray-800">
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
                        ? "border-blue-500 bg-blue-100 text-blue-700"
                        : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Common Outcomes */}
            <div>
              <label className="mb-2 block text-xs font-semibold text-gray-800">
                Other Outcomes
              </label>
              <div className="grid grid-cols-2 gap-2">
                {QUICK_OUTCOMES.COMMON.map(
                  ({ outcome, label, followUpDays }) => (
                    <button
                      key={outcome}
                      type="button"
                      onClick={() => handleQuickOutcome(outcome, followUpDays)}
                      className={`rounded-lg border p-2 text-xs font-medium transition-all duration-200 ${
                        selectedOutcome === outcome
                          ? "border-blue-500 bg-blue-100 text-blue-700"
                          : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      {label}
                    </button>
                  ),
                )}
              </div>
            </div>

            {/* Custom Outcome Dropdown */}
            <div className="group">
              <label className="mb-1 block text-xs font-semibold text-gray-800">
                Outcome <span className="ml-1 text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  {...register("outcome", { required: true })}
                  className={`w-full rounded-lg border py-2 pl-3 pr-10 text-sm text-gray-800 outline-none transition-all duration-200 ${
                    errors.outcome
                      ? "border-red-300 bg-red-50 focus:border-red-500 focus:ring-1 focus:ring-red-200"
                      : "border-gray-200 bg-white hover:border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
                  }`}
                >
                  <option value="">Select outcome...</option>
                  {Object.entries(CALL_OUTCOME_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              {errors.outcome && (
                <div className="mt-1 flex items-center gap-1 text-xs text-red-600">
                  <div className="h-1 w-1 rounded-full bg-red-500"></div>
                  Please select a call outcome
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="group">
              <label className="mb-1 block text-xs font-semibold text-gray-800">
                Notes <span className="ml-1 text-red-500">*</span>
              </label>
              <p className="mb-2 text-xs leading-relaxed text-gray-500">
                What was discussed during the call?
              </p>
              <div className="relative">
                <div className="absolute left-3 top-3 text-gray-400 transition-colors group-focus-within:text-blue-500">
                  <FaStickyNote className="h-3 w-3" />
                </div>
                <textarea
                  {...register("notes", { required: true })}
                  placeholder="Enter call details, customer response, next steps, etc..."
                  className={`h-24 w-full resize-none rounded-lg border py-2 pl-10 pr-3 text-sm text-gray-800 placeholder-gray-400 outline-none transition-all duration-200 ${
                    errors.notes
                      ? "border-red-300 bg-red-50 focus:border-red-500 focus:ring-1 focus:ring-red-200"
                      : "border-gray-200 bg-white hover:border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
                  }`}
                />
              </div>
              {errors.notes && (
                <div className="mt-1 flex items-center gap-1 text-xs text-red-600">
                  <div className="h-1 w-1 rounded-full bg-red-500"></div>
                  Call notes are required
                </div>
              )}
            </div>

            {/* Follow-up Date */}
            <div className="group">
              <label className="mb-1 block text-xs font-semibold text-gray-800">
                Follow-up Date (Optional)
              </label>
              <p className="mb-2 text-xs leading-relaxed text-gray-500">
                When should we follow up on this call?
              </p>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors group-focus-within:text-blue-500">
                  <FaCalendar className="h-3 w-3" />
                </div>
                <input
                  {...register("followUpDate")}
                  type="date"
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-10 pr-3 text-sm text-gray-800 outline-none transition-all duration-200 hover:border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
                />
              </div>
            </div>

            {/* Duration */}
            <div className="group">
              <label className="mb-1 block text-xs font-semibold text-gray-800">
                Call Duration (Optional)
              </label>
              <p className="mb-2 text-xs leading-relaxed text-gray-500">
                How long was the call in minutes?
              </p>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors group-focus-within:text-blue-500">
                  <FaClock className="h-3 w-3" />
                </div>
                <input
                  {...register("duration", { min: 1, max: 999 })}
                  type="number"
                  placeholder="5"
                  min="1"
                  max="999"
                  className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-10 pr-3 text-sm text-gray-800 placeholder-gray-400 outline-none transition-all duration-200 hover:border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="sticky bottom-0 -mx-4 border-t border-gray-200 bg-gray-50 px-4 pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full rounded-lg border border-blue-500/20 bg-gradient-to-r from-blue-600 to-blue-700 py-3 text-sm font-bold text-white shadow-lg transition-all duration-300
                  ${
                    isSubmitting
                      ? "cursor-not-allowed opacity-70"
                      : "hover:scale-[1.02] hover:shadow-xl active:scale-[0.98]"
                  }`}
              >
                <div className="flex items-center justify-center gap-2">
                  {isSubmitting ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white"></div>
                      Logging Call...
                    </>
                  ) : (
                    <>
                      <FaPhone className="h-3 w-3" />
                      Log Call
                    </>
                  )}
                </div>
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default CallLogModal;
