"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { FaPlus, FaTimes, FaUser, FaEnvelope, FaPhone, FaStickyNote, FaTag } from "react-icons/fa";
import { createClient } from "../../app/lib/actions/actions";
import { isTextKey, isNumberKey } from "../../app/lib/utils";
import { useDebounceSubmit } from "../../app/hooks/useDebounceSubmit";

const AddClient = () => {
  const [open, setOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  const { isProcessing, debouncedSubmit } = useDebounceSubmit({
    onSubmit: async (values: any) => {
      // Transform the form data to include emails object
      const clientData = {
        ...values,
        emails: {
          primary: values.primaryEmail,
          scheduling: values.schedulingEmail || values.primaryEmail,
          accounting: values.accountingEmail || values.primaryEmail,
        },
        // Keep the old email field for backward compatibility
        email: values.primaryEmail,
      };
      
      // Remove the individual email fields from the data
      delete clientData.primaryEmail;
      delete clientData.schedulingEmail;
      delete clientData.accountingEmail;
      
      await createClient(clientData);
      setOpen(false);
      reset();
    },
    successMessage: "New client has been successfully added",
  });

  const inputFields = [
    {
      name: "clientName",
      type: "text",
      placeholder: "Enter client's full name",
      isRequired: true,
      minLength: false,
      icon: FaUser,
      label: "Client Name",
      description: "Full name or company name",
    },
    {
      name: "prefix",
      type: "text",
      placeholder: "ABC",
      isRequired: true,
      minLength: 3,
      maxLength: 3,
      onKeyDown: isTextKey,
      icon: FaTag,
      label: "Invoice Prefix",
      description: "3-letter code for invoice numbering (e.g., ABC-001)",
    },
    {
      name: "primaryEmail",
      type: "email",
      placeholder: "client@example.com",
      isRequired: true,
      label: "Primary Email",
      description: "Main email address for client portal access and communications",
      icon: FaEnvelope,
    },
    {
      name: "accountingEmail",
      type: "email",
      placeholder: "accounting@example.com",
      isRequired: false,
      label: "Accounting Email",
      description: "Dedicated email for payment reminders and invoices (optional)",
      icon: FaEnvelope,
    },
    {
      name: "schedulingEmail",
      type: "email",
      placeholder: "scheduling@example.com",
      isRequired: false,
      label: "Scheduling Email",
      description: "Dedicated email for job scheduling notifications (optional)",
      icon: FaEnvelope,
    },
    {
      name: "phoneNumber",
      type: "tel",
      placeholder: "(555) 123-4567",
      isRequired: true,
      onKeyDown: isNumberKey,
      icon: FaPhone,
      label: "Phone Number",
      description: "Primary contact number",
    },
    {
      name: "notes",
      type: "textarea",
      placeholder: "Additional notes, preferences, or special instructions...",
      isRequired: false,
      icon: FaStickyNote,
      label: "Notes",
      description: "Optional notes about the client or account",
    },
  ];

  const handleSave = (values: any) => {
    debouncedSubmit(values);
  };

  return (
    <>
      {/* Header Section */}
      <div className="mb-4 flex flex-row items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-r from-darkGreen to-green-600 shadow-lg">
            <FaUser className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
            <p className="text-xs text-gray-600">Manage your client database</p>
          </div>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="group flex items-center gap-2 rounded-xl bg-linear-to-r from-darkBlue to-blue-600 px-4 py-2 font-semibold text-white shadow-lg border border-blue-500/20 transition-all duration-300 hover:shadow-xl hover:scale-105 active:scale-95"
        >
          <FaPlus className="h-3 w-3 transition-transform group-hover:rotate-90" />
          Add Client
        </button>
      </div>
      
      {/* Background Overlay */}
      <div
        className={`fixed inset-0 z-40 bg-black/70 backdrop-blur-md transition-all duration-300 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setOpen(false)}
      ></div>

      {/* Slide-out Panel */}
      <div
        className={`fixed right-0 top-0 z-50 flex h-screen w-full max-w-lg transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex w-full flex-col bg-white shadow-2xl">
          {/* Header */}
          <div className="flex w-full flex-row items-center justify-between bg-linear-to-r from-darkGreen to-green-600 p-4 shadow-lg">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
                <FaUser className="h-4 w-4 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Add New Client</h2>
                <p className="text-xs text-green-100">Create a new client profile</p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="group rounded-lg p-2 text-white hover:bg-white/20 transition-all duration-200 border border-white/20"
            >
              <FaTimes className="h-3 w-3 transition-transform group-hover:rotate-90" />
            </button>
          </div>

          {/* Form */}
          <form
            onSubmit={handleSubmit(handleSave)}
            className="flex-1 space-y-3 p-4 overflow-y-auto bg-gray-50"
          >
            {inputFields.map(
              ({
                name,
                type,
                placeholder,
                isRequired,
                maxLength,
                minLength,
                onKeyDown,
                label,
                description,
                icon: Icon,
              }) => (
                <div key={name} className="group">
                  <label className="mb-1 block text-xs font-semibold text-gray-800">
                    {label}
                    {isRequired && <span className="ml-1 text-red-500">*</span>}
                  </label>
                  {description && (
                    <p className="mb-2 text-xs text-gray-500 leading-relaxed">{description}</p>
                  )}
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-darkGreen transition-colors">
                      <Icon className="h-3 w-3" />
                    </div>
                    {type === "textarea" ? (
                      <textarea
                        {...register(name, { required: isRequired })}
                        placeholder={placeholder}
                        className={`w-full pl-10 pr-3 py-2 rounded-lg border text-gray-800 placeholder-gray-400 outline-none transition-all duration-200 resize-none h-20 text-sm ${
                          errors[name]
                            ? "border-red-300 bg-red-50 focus:border-red-500 focus:ring-1 focus:ring-red-200"
                            : "border-gray-200 bg-white focus:border-darkGreen focus:ring-1 focus:ring-green-100 hover:border-gray-300"
                        }`}
                      />
                    ) : (
                      <input
                        {...register(name, {
                          required: isRequired,
                          minLength: minLength as number,
                          maxLength: maxLength as number,
                        })}
                        type={type}
                        placeholder={placeholder}
                        onKeyDown={onKeyDown}
                        className={`w-full pl-10 pr-3 py-2 rounded-lg border text-gray-800 placeholder-gray-400 outline-none transition-all duration-200 text-sm ${
                          name === "prefix" ? "uppercase tracking-wider font-mono" : ""
                        } ${
                          errors[name]
                            ? "border-red-300 bg-red-50 focus:border-red-500 focus:ring-1 focus:ring-red-200"
                            : "border-gray-200 bg-white focus:border-darkGreen focus:ring-1 focus:ring-green-100 hover:border-gray-300"
                        }`}
                      />
                    )}
                  </div>
                  {errors[name] && (
                    <div className="mt-1 flex items-center gap-1 text-xs text-red-600">
                      <div className="h-1 w-1 rounded-full bg-red-500"></div>
                      {errors[name]?.type === "required" && `${label} is required`}
                      {errors[name]?.type === "minLength" && `${label} must be at least ${minLength} characters`}
                      {errors[name]?.type === "maxLength" && `${label} cannot exceed ${maxLength} characters`}
                    </div>
                  )}
                </div>
              ),
            )}
            
            {/* Submit Button */}
            <div className="sticky bottom-0 bg-gray-50 pt-4 -mx-4 px-4 border-t border-gray-200">
              <button
                type="submit"
                disabled={isProcessing}
                className={`w-full rounded-lg bg-linear-to-r from-darkBlue to-blue-600 py-3 text-white font-bold border border-blue-500/20 transition-all duration-300 shadow-lg text-sm
                  ${
                    isProcessing
                      ? "opacity-70 cursor-not-allowed"
                      : "hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                  }`}
              >
                <div className="flex items-center justify-center gap-2">
                  {isProcessing ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white"></div>
                      Adding Client...
                    </>
                  ) : (
                    <>
                      <FaPlus className="h-3 w-3" />
                      Add Client
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

export default AddClient;
