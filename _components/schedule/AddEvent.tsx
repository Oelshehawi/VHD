"use client";
import { useState, useEffect } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { ScheduleType, InvoiceType } from "../../app/lib/typeDefinitions";
import InvoiceSearchSelect from "../invoices/InvoiceSearchSelect";
import { createSchedule } from "../../app/lib/actions/scheduleJobs.actions";
import TechnicianSelect from "./TechnicianSelect";
import { XMarkIcon } from "@heroicons/react/24/outline";

const AddEvent = ({
  invoices,
  open,
  setOpen,
  technicians,
  scheduledJobs,
}: {
  invoices: InvoiceType[];
  open: boolean;
  setOpen: () => void;
  technicians: { id: string; name: string }[];
  scheduledJobs: ScheduleType[];
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isValid },
    setValue,
    clearErrors,
    watch,
  } = useForm<ScheduleType>({
    defaultValues: {
      jobTitle: "",
      location: "",
      startDateTime: "",
      assignedTechnicians: [],
      invoiceRef: "",
      confirmed: false,
      technicianNotes: "",
    },
    mode: "onChange",
  });

  const handleInvoiceSelect = (invoice: ScheduleType) => {
    setValue("invoiceRef", invoice._id, { shouldValidate: true });
    setValue("jobTitle", invoice.jobTitle);
    setValue("location", invoice.location ?? "");
    setValue("assignedTechnicians", invoice.assignedTechnicians);
    clearErrors(["invoiceRef", "jobTitle", "location", "assignedTechnicians"]);

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
      await createSchedule(data);
      setOpen();
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
    {
      name: "startDateTime",
      placeholder: "Start Date & Time",
      type: "datetime-local",
      isRequired: true,
      icon: "📅",
    },
  ];

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={setOpen}
        className="bg-black/60 fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4 backdrop-blur-sm"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-gradient-to-br from-darkGreen to-darkBlue shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
            <h2 className="text-xl font-semibold text-white">Add New Job</h2>
            <button
              onClick={setOpen}
              className="rounded-full p-1 text-white/80 hover:bg-white/10 hover:text-white"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Form */}
          <form
            className="flex flex-col gap-4 p-6"
            onSubmit={handleSubmit(handleSave)}
          >
            {/* Invoice SearchSelect */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-white/90">
                Select Invoice
              </label>
              <div className="relative">
                <InvoiceSearchSelect
                  placeholder="Search and select invoice..."
                  data={invoices}
                  onSelect={handleInvoiceSelect}
                  register={register}
                  error={errors.invoiceRef}
                />
              </div>
            </div>

            {/* Other Input Fields */}
            {formFields.map(({ name, placeholder, type, isRequired, icon }) => (
              <div className="space-y-1" key={name}>
                <label className="text-sm font-medium text-white/90">
                  {placeholder}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2">
                    {icon}
                  </span>
                  <input
                    {...register(name as "jobTitle" | "startDateTime", {
                      required: isRequired,
                    })}
                    type={type}
                    placeholder={placeholder}
                    className={`w-full rounded-lg border border-white/10 bg-white/5 py-2 pl-10 pr-3 text-white placeholder-white/50 shadow-sm transition-colors focus:border-white/20 focus:bg-white/10 focus:outline-none focus:ring-1 focus:ring-white/20 ${
                      errors[name as "jobTitle" | "startDateTime"]
                        ? "border-red-500"
                        : ""
                    }`}
                  />
                </div>
                {errors[name as "jobTitle" | "startDateTime"]?.type ===
                  "required" && (
                  <p className="text-sm text-red-400">
                    {placeholder} is required
                  </p>
                )}
              </div>
            ))}

            {/* Technician Select */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-white/90">
                Assign Technicians
              </label>
              <div className="relative">
                <TechnicianSelect
                  control={control}
                  name="assignedTechnicians"
                  technicians={technicians}
                  placeholder="Select technicians..."
                  error={errors.assignedTechnicians}
                />
              </div>
            </div>

            {/* Technician Notes */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-white/90">
                Technician Notes
              </label>
              <div className="relative">
                <span className="absolute left-3 top-3">📝</span>
                <textarea
                  {...register("technicianNotes")}
                  rows={4}
                  placeholder="Enter any notes about this job (equipment, access instructions, etc.)"
                  className="w-full rounded-lg border border-white/10 bg-white/5 py-2 pl-10 pr-3 text-white placeholder-white/50 shadow-sm transition-colors focus:border-white/20 focus:bg-white/10 focus:outline-none focus:ring-1 focus:ring-white/20"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="mt-2 flex justify-end">
              <button
                type="submit"
                disabled={isLoading || !isValid}
                className={`inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors
                  ${
                    isLoading || !isValid
                      ? "cursor-not-allowed bg-white/20"
                      : "bg-white/10 hover:bg-white/20 active:bg-white/30"
                  }`}
              >
                {isLoading ? (
                  <>
                    <svg
                      className="mr-2 h-4 w-4 animate-spin"
                      viewBox="0 0 24 24"
                    >
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
                    Submitting...
                  </>
                ) : (
                  "Add Job"
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AddEvent;
