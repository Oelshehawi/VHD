import { MouseEventHandler, useEffect, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { createSchedule } from "../../app/lib/actions";
import toast from "react-hot-toast";
import { ScheduleType, InvoiceType } from "../../app/lib/typeDefinitions";

const AddEvent = ({
  invoices,
  open,
  setOpen,
}: {
  invoices: InvoiceType[];
  open: boolean;
  setOpen: () => void;
}) => {
  const [IsLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<ScheduleType>();

  const handleInvoiceChange = (e: { target: { value: any } }) => {
    const selectedInvoiceId = e.target.value;
    const selectedInvoice = invoices.find(
      (invoice) => invoice._id === selectedInvoiceId,
    );

    setValue("jobTitle", selectedInvoice?.jobTitle);
    setValue("location", selectedInvoice?.location ?? "");
    setValue('assignedTechnician', 'Migo')
  };

  const handleSave: SubmitHandler<ScheduleType> = async (data) => {
    setIsLoading(true);
    try {
      if (typeof data.startDateTime === 'string') {
        data.startDateTime = new Date(data.startDateTime) as string & Date;
      }      
      await createSchedule(data);
      setOpen();
      toast.success("Schedule has been successfully added.");
    } catch (error) {
      console.error("Error saving Schedule:", error);
      toast.error("Error saving Schedule. Please check input fields");
    } finally {
      setIsLoading(false);
    }
  };

  let inputFields = [
    {
      name: "invoiceRef",
      placeholder: "Please Select Invoice",
      isRequired: true,
      type: "select",
    },
    {
      name: "jobTitle",
      placeholder: "Job Title",
      isRequired: true,
      type: "text",
    },
    {
      name: "location",
      placeholder: "Location",
      isRequired: true,
      type: "text",
    },
    {
      name: "assignedTechnician",
      placeholder: "Technician Name",
      isRequired: true,
      type: "text",
    },
    {
      name: "startDateTime",
      placeholder: "Start Date",
      isRequired: true,
      type: "datetime-local",
    },
    
  ];

  if (!open) return null;


  return (
    <div
      onClick={setOpen}
      className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ duration: 0.3 }}
        className="flex md:h-[60%] md:w-[50%] w-[90%] flex-col rounded-xl bg-darkGreen px-10 py-2"
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
          {inputFields.map(({ name, placeholder, type, isRequired }) => (
            <div className="flex flex-col" key={name}>
              {type === "select" ? (
                <div className="field w-full">
                  <select
                    {...register("invoiceRef", { required: true })}
                    onChange={handleInvoiceChange}
                    className="w-full rounded border-2 border-gray-400 p-2 text-gray-700 outline-none focus:border-darkGreen focus:ring-2 focus:ring-darkGreen"
                  >
                    <option value="">Select Invoice</option>
                    {invoices.map((invoice) => (
                      <option
                        key={invoice._id as string}
                        value={invoice._id as string}
                      >
                        {invoice.jobTitle} - {invoice.dateIssued.toString().split('T')[0]}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <input
                  {...register(name as "jobTitle" | "startDateTime", {
                    required: isRequired,
                  })}
                  type={type}
                  placeholder={placeholder}
                  className="w-full rounded border-2 border-gray-400 p-2 text-black outline-none focus:border-darkGreen focus:ring-2 focus:ring-darkGreen"
                />
              )}
              {errors[name as "jobTitle" | "startDateTime"] &&
                errors[name as "jobTitle" | "startDateTime"]?.type ===
                  "required" && (
                  <p className="mt-1 text-xs text-red-500">
                    {name} is required
                  </p>
                )}
            </div>
          ))}
          <button
            type="submit"
            className="mt-4 rounded-lg bg-green-700 p-2 text-white transition duration-200 ease-in-out hover:bg-green-800"
          >
            {IsLoading ? 'Submitting...' : 'Submit'}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default AddEvent;
