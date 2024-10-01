"use client";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { updateInvoice } from "../../app/lib/actions";
import { formatDateToString } from "../../app/lib/utils";
import { toast } from "react-hot-toast";
import { calculateDueDate } from "../../app/lib/utils";
import { FaArrowAltCircleRight, FaArrowCircleRight } from "react-icons/fa";

const InlineEditInvoice = ({ invoice, isEditing, toggleEdit, canManage }) => {
  const updateInvoiceWithId = updateInvoice.bind(null, invoice._id);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm();

  const dateIssued = watch("dateIssued");
  const frequency = watch("frequency");

  useEffect(() => {
    const updatedDateDue = calculateDueDate(dateIssued, frequency);
    setValue("dateDue", updatedDateDue);
  }, [dateIssued, frequency, setValue]);

  const onSubmit = async (formData) => {
    try {
      await updateInvoiceWithId(formData);
      toast.success("Invoice updated successfully");
      if (!formData.status) {
        toggleEdit();
      }
    } catch (error) {
      console.error("Error updating Invoice", error);
      toast.error("Failed to update invoice");
    }
  };

  const inputFields = [
    {
      name: "invoiceId",
      type: "text",
      placeholder: "Invoice ID",
      isRequired: true,
      readOnly: true,
    },
    {
      name: "jobTitle",
      type: "text",
      placeholder: "Job Title",
      isRequired: false,
    },
    {
      name: "dateIssued",
      type: "date",
      placeholder: "Date Issued",
      isRequired: true,
    },
    {
      name: "dateDue",
      type: "text",
      placeholder: "Date Due",
      isRequired: true,
      readOnly: true,
    },
    {
      name: "frequency",
      type: "number",
      placeholder: "Frequency",
      isRequired: true,
      minLength: 1,
      maxLength: 1,
    },
    {
      name: "location",
      type: "text",
      placeholder: "Location",
      isRequired: false,
    },
    {
      name: "notes",
      type: "textarea",
      placeholder: "Additional Notes",
      isRequired: false,
    },
  ];

  return (
    <div className="mb-4 w-full pl-2 lg:w-[60%]">
      <div className="rounded border shadow">
        <div className="flex flex-row items-center justify-between border-b px-4 py-2 text-xl">
          <div>Invoice Information</div>
          {canManage ? (
            <InvoiceStatusUpdate
              onSubmit={onSubmit}
              invoiceStatus={invoice.status}
            />
          ) : null}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-4">
          <ul className="flex w-full flex-col space-y-2">
            {inputFields.map(
              ({ name, type, isRequired, readOnly, minLength, maxLength }) => (
                <li key={name} className="flex w-full flex-col lg:flex-row">
                  <strong className={isEditing ? "w-[15%]" : "w-[11%]"}>
                    {name.charAt(0).toUpperCase() + name.slice(1)}:
                  </strong>
                  {isEditing ? (
                    <>
                      {type === "textarea" ? (
                        <textarea
                          {...register(name, { required: isRequired })}
                          className="w-full rounded border-2 border-gray-400 p-2 text-black outline-none focus:border-darkGreen focus:ring-2 focus:ring-darkGreen"
                          defaultValue={invoice[name]}
                        />
                      ) : (
                        <input
                          type={type}
                          {...register(name, {
                            required: isRequired,
                            minLength: minLength,
                            maxLength: maxLength,
                          })}
                          className="w-full rounded border-2 border-gray-400 p-2 text-black outline-none focus:border-darkGreen focus:ring-2 focus:ring-darkGreen"
                          readOnly={readOnly}
                          defaultValue={invoice[name]}
                        />
                      )}
                      {errors[name] && (
                        <p className="mt-1 text-xs text-red-500">
                          {errors[name].message || `${name} is required`}
                        </p>
                      )}
                    </>
                  ) : (
                    <div
                      className="flex w-full items-center overflow-auto lg:w-auto"
                      style={{ maxWidth: "500px", wordWrap: "break-word" }}
                    >
                      {name === "dateDue" || name === "dateIssued" ? (
                        formatDateToString(invoice[name])
                      ) : name === "location" ? (
                        <>
                          <span>{invoice[name]}</span>
                          {!isEditing && (
                            <a
                              href={`https://www.google.com/maps/place/${encodeURI(invoice[name])}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ml-2 text-blue-500 hover:text-blue-700"
                            >
                              <FaArrowCircleRight className="size-6" />
                            </a>
                          )}
                        </>
                      ) : (
                        invoice[name]
                      )}
                    </div>
                  )}
                </li>
              ),
            )}
          </ul>
          {isEditing && (
            <div className="mt-4 flex justify-end space-x-2">
              <button
                type="button"
                onClick={toggleEdit}
                className="rounded bg-gray-200 px-4 py-2 text-gray-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded bg-darkGreen px-4 py-2 text-white"
              >
                Save Changes
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

const InvoiceStatusUpdate = ({ onSubmit, invoiceStatus }) => {
  const { register, handleSubmit, setValue } = useForm();
  const [status, setStatus] = useState(invoiceStatus);

  const handleChange = (e) => {
    const selectedStatus = e.target.value;
    setStatus(selectedStatus);
    setValue("status", selectedStatus);
    handleSubmit(onSubmit)({ status: selectedStatus });
  };

  return (
    <form className="flex h-full w-1/2 items-center justify-end">
      <div className="">
        <select
          id="status"
          {...register("status")}
          onChange={handleChange}
          className={`focus:shadow-outline w-full appearance-none rounded border border-gray-400 px-4 py-2 text-center leading-tight shadow hover:cursor-pointer hover:border-gray-500 focus:outline-none ${
            status === "paid"
              ? "bg-green-500"
              : status === "overdue"
                ? "bg-red-500"
                : "bg-yellow-500"
          }`}
          defaultValue={invoiceStatus}
        >
          <option className="bg-green-500 text-center" value="paid">
            Paid
          </option>
          <option className="bg-red-500" value="overdue">
            Overdue
          </option>
          <option className="bg-yellow-500" value="pending">
            Pending
          </option>
        </select>
      </div>
    </form>
  );
};

export default InlineEditInvoice;
