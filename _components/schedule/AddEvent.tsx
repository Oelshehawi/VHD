"use client";
import { useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { ScheduleType, InvoiceType } from "../../app/lib/typeDefinitions";
import InvoiceSearchSelect from "../invoices/InvoiceSearchSelect";
import { createSchedule } from "../../app/lib/actions/scheduleJobs.actions";

const AddEvent = ({
  invoices,
  open,
  setOpen,
}: {
  invoices: InvoiceType[];
  open: boolean;
  setOpen: () => void;
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    clearErrors,
  } = useForm<ScheduleType>();

  const handleInvoiceSelect = (invoice: ScheduleType) => {
    setValue("invoiceRef", invoice._id, { shouldValidate: true });
    setValue("jobTitle", invoice.jobTitle);
    setValue("location", invoice.location ?? "");
    setValue("assignedTechnician", invoice.assignedTechnician);
    clearErrors(["invoiceRef", "jobTitle", "location", "assignedTechnician"]);
  };

  const handleSave: SubmitHandler<ScheduleType> = async (data) => {
    setIsLoading(true);
    try {
      if (typeof data.startDateTime === "string") {
        data.startDateTime = new Date(data.startDateTime) as string & Date;
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

  if (!open) return null;

  return (
    <div
      onClick={setOpen}
      className="bg-black-2 fixed inset-0 flex items-center justify-center bg-opacity-40"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ duration: 0.3 }}
        className="flex w-[90%] flex-col rounded-xl bg-darkGreen px-10 py-2 md:h-[60%] md:w-[50%]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between py-4 text-white">
          <div className="text-2xl">Add Job</div>
          <div className="hover:cursor-pointer" onClick={setOpen}>
            X
          </div>
        </div>
        <form
          className="flex flex-col gap-4 overflow-hidden"
          onSubmit={handleSubmit(handleSave)}
        >
          {/* Invoice SearchSelect */}
          <div className="flex flex-col">
            <InvoiceSearchSelect
              placeholder="Please Select Invoice"
              data={invoices}
              onSelect={handleInvoiceSelect}
              register={register}
              error={errors.invoiceRef}
            />
          </div>

          {/* Other Input Fields */}
          {[
            {
              name: "jobTitle",
              placeholder: "Job Title",
              type: "text",
              isRequired: true,
            },
            {
              name: "location",
              placeholder: "Location",
              type: "text",
              isRequired: true,
            },
            {
              name: "assignedTechnician",
              placeholder: "Technician Name",
              type: "text",
              isRequired: true,
            },
            {
              name: "startDateTime",
              placeholder: "Start Date",
              type: "datetime-local",
              isRequired: true,
            },
          ].map(({ name, placeholder, type, isRequired }) => (
            <div className="flex flex-col" key={name}>
              <input
                {...register(name as "jobTitle" | "startDateTime", {
                  required: isRequired,
                })}
                type={type}
                placeholder={placeholder}
                className="w-full rounded border-2 border-gray-400 p-2 text-black outline-none focus:border-darkGreen focus:ring-2 focus:ring-darkGreen"
              />
              {errors[name as "jobTitle" | "startDateTime"]?.type ===
                "required" && (
                <p className="mt-1 text-xs text-red-500">
                  {placeholder} is required
                </p>
              )}
            </div>
          ))}
          <button
            type="submit"
            className="mt-4 rounded-lg bg-green-700 p-2 text-white transition duration-200 ease-in-out hover:bg-green-800"
          >
            {isLoading ? "Submitting..." : "Submit"}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default AddEvent;
