"use client";
import { useState, useEffect } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { FaTrash, FaPlus, FaTimes, FaFileInvoice, FaBriefcase, FaCalendarCheck, FaMapMarkerAlt, FaStickyNote, FaList, FaDollarSign } from "react-icons/fa";
import { useUser } from "@clerk/nextjs";
import { calculateDueDate } from "../../app/lib/utils";
import {
  createInvoice,
  getMostRecentInvoice,
  getClientInvoicesForAutofill,
} from "../../app/lib/actions/actions";
import { ClientType } from "../../app/lib/typeDefinitions";
import ClientSearchSelect from "./ClientSearchSelect";
import { useDebounceSubmit } from "../../app/hooks/useDebounceSubmit";
import { toast } from "react-hot-toast";
import InvoiceSelectionModal from "./InvoiceSelectionModal";

interface AddInvoiceProps {
  clients: ClientType[];
}

interface InvoiceFormValues {
  clientId: string;
  jobTitle: string;
  frequency: number;
  location: string;
  dateIssued: string;
  dateDue: string;
  notes?: string;
  items: { description: string; details?: string; price: number }[];
}

const AddInvoice = ({ clients }: AddInvoiceProps) => {
  const { user } = useUser();
  const [items, setItems] = useState([{ description: "", details: "", price: 0 }]);
  const [open, setOpen] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [isAutoFilling, setIsAutoFilling] = useState(false);
  const [autoFilledFields, setAutoFilledFields] = useState<string[]>([]);
  const [clientInvoices, setClientInvoices] = useState<any[]>([]);
  const [selectedClient, setSelectedClient] = useState<ClientType | null>(null);
  const [showInvoiceSelector, setShowInvoiceSelector] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    clearErrors,
    watch,
    formState: { errors },
  } = useForm<InvoiceFormValues>();

  const dateIssued = watch("dateIssued");
  const frequency = watch("frequency");

  useEffect(() => {
    const updatedDateDue = calculateDueDate(dateIssued, frequency);
    setValue("dateDue", updatedDateDue as string);
  }, [dateIssued, frequency, setValue]);

  const addItem = () => {
    setItems([...items, { description: "", details: "", price: 0 }]);
  };

  const handleItemChange = (
    index: number,
    field: keyof InvoiceFormValues["items"][0],
    value: string | number,
  ) => {
    const updatedItems: any = [...items];
    updatedItems[index][field] = value;
    setItems(updatedItems);
    setValue("items", updatedItems);
  };

  const deleteItem = (index: number) => {
    if (items.length > 1) {
      const updatedItems = items.filter((_, i) => i !== index);
      setItems(updatedItems);
      setValue("items", updatedItems);
    }
  };

  const handleClientSelect = async (client: ClientType) => {
    setValue("clientId", client._id as string);
    setValue("prefix" as any, client.prefix);
    clearErrors(["clientId", "prefix" as any]);
    setSelectedClient(client);

    setIsAutoFilling(true);
    setAutoFilledFields([]);

    try {
      // Fetch all invoices for the client
      const invoices = await getClientInvoicesForAutofill(client._id as string);

      if (invoices.length > 0) {
        setClientInvoices(invoices);
        setShowInvoiceSelector(true);
      } else {
        toast("No previous invoices found for this client");
        setShowInvoiceSelector(false);
      }
    } catch (error) {
      console.error("Error fetching client invoices:", error);
      toast.error("Failed to fetch client invoices");
    } finally {
      setIsAutoFilling(false);
    }
  };

  const handleInvoiceSelect = (invoice: any) => {
    const fieldsToUpdate = [];

    if (invoice.jobTitle) {
      setValue("jobTitle", invoice.jobTitle);
      fieldsToUpdate.push("jobTitle");
    }
    if (invoice.frequency) {
      setValue("frequency", invoice.frequency);
      fieldsToUpdate.push("frequency");
    }
    if (invoice.location) {
      setValue("location", invoice.location);
      fieldsToUpdate.push("location");
    }
    if (invoice.notes) {
      setValue("notes", invoice.notes);
      fieldsToUpdate.push("notes");
    }
    if (invoice.items && invoice.items.length > 0) {
      setItems(invoice.items);
      setValue("items", invoice.items);
      fieldsToUpdate.push("items");
    }

    setAutoFilledFields(fieldsToUpdate);
    setShowInvoiceSelector(false);
    toast.success(`Form auto-filled from invoice ${invoice.invoiceId}`);
  };

  const { isProcessing, debouncedSubmit } = useDebounceSubmit({
    onSubmit: async (data: InvoiceFormValues) => {
      const userName = user?.fullName || user?.firstName || "User";
      await createInvoice(data, userName);
      setOpen(false);
      setResetKey((prev) => prev + 1);
      setItems([{ description: "", details: "", price: 0 }]);
      reset();
    },
    successMessage: "Invoice has been successfully added",
  });

  const inputFields = [
    {
      name: "jobTitle",
      type: "text",
      placeholder: "Enter job title or description",
      isRequired: true,
      icon: FaBriefcase,
      label: "Job Title",
      description: "Brief description of the work to be performed",
    },
    {
      name: "frequency",
      type: "number",
      placeholder: "1",
      isRequired: true,
      minLength: 1,
      maxLength: 1,
      icon: FaCalendarCheck,
      label: "Frequency (per year)",
      description: "How many times per year this job occurs",
    },
    {
      name: "location",
      type: "text",
      placeholder: "Job location or property address",
      isRequired: true,
      icon: FaMapMarkerAlt,
      label: "Location",
      description: "Where the work will be performed",
    },
    {
      name: "dateIssued",
      type: "date",
      placeholder: "Date Issued",
      isRequired: true,
      icon: FaCalendarCheck,
      label: "Date Issued",
      description: "When this invoice is being created",
    },
    {
      name: "dateDue",
      type: "text",
      placeholder: "Date Due",
      isRequired: true,
      readOnly: true,
      icon: FaCalendarCheck,
      label: "Date Due",
      description: "Automatically calculated based on issue date and frequency",
    },
    {
      name: "notes",
      type: "textarea",
      placeholder: "Additional notes, special instructions, or important details...",
      isRequired: false,
      icon: FaStickyNote,
      label: "Additional Notes",
      description: "Optional notes about this job or invoice",
    },
  ];

  const handleSave: SubmitHandler<InvoiceFormValues> = (data) => {
    debouncedSubmit(data);
  };

  const calculateTotal = () => {
    return items.reduce((total, item) => total + (item.price || 0), 0);
  };

  return (
    <>
      {/* Background Overlay */}
      <div
        className={`fixed inset-0 z-40 bg-black/70 backdrop-blur-md transition-all duration-300 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setOpen(false)}
      ></div>
      
      {/* Modal Content */}
      <div
        className={`fixed right-0 top-0 z-50 flex h-screen w-full max-w-2xl transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex w-full flex-col bg-white shadow-2xl">
          {/* Header */}
          <div className="flex w-full flex-row items-center justify-between bg-linear-to-r from-darkGreen to-green-600 p-4 shadow-lg">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
                <FaFileInvoice className="h-4 w-4 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Create New Invoice</h2>
                <p className="text-xs text-green-100">Generate invoice for client services</p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="group rounded-lg p-2 text-white hover:bg-white/20 transition-all duration-200 border border-white/20"
            >
              <FaTimes className="h-3 w-3 transition-transform group-hover:rotate-90" />
            </button>
          </div>
          
          <form
            onSubmit={handleSubmit(handleSave)}
            className="flex-1 overflow-auto bg-gray-50"
          >
            <div className="space-y-3 p-4">
              {/* Auto-fill Status */}
              {isAutoFilling && (
                <div className="flex items-center justify-center bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-400 border-t-transparent"></div>
                  <span className="ml-2 text-xs font-medium text-blue-700">
                    Loading client data...
                  </span>
                </div>
              )}

              {/* Client Selection */}
              <div className="group">
                <label className="mb-1 block text-xs font-semibold text-gray-800">
                  Select Client <span className="ml-1 text-red-500">*</span>
                </label>
                <p className="mb-2 text-xs text-gray-500 leading-relaxed">
                  Choose the client for this invoice
                </p>
                <ClientSearchSelect
                  placeholder="Search and select a client..."
                  data={clients}
                  onSelect={handleClientSelect}
                  register={register}
                  error={errors.clientId}
                  resetKey={resetKey}
                />
              </div>

              {/* Invoice Selection Modal */}
              <InvoiceSelectionModal
                invoices={clientInvoices}
                isOpen={showInvoiceSelector}
                onClose={() => setShowInvoiceSelector(false)}
                onSelect={handleInvoiceSelect}
              />

              {/* Input Fields */}
              {inputFields.map(
                ({
                  name,
                  type,
                  placeholder,
                  isRequired,
                  minLength,
                  maxLength,
                  readOnly,
                  icon: Icon,
                  label,
                  description,
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
                          {...register(name as keyof InvoiceFormValues, {
                            required: isRequired,
                          })}
                          placeholder={placeholder}
                          className={`w-full pl-10 pr-3 py-2 rounded-lg border text-gray-800 placeholder-gray-400 outline-none transition-all duration-200 resize-none h-20 text-sm ${
                            autoFilledFields.includes(name)
                              ? "border-green-400 bg-green-50 ring-1 ring-green-100"
                              : errors[name as keyof InvoiceFormValues]
                              ? "border-red-300 bg-red-50 focus:border-red-500 focus:ring-1 focus:ring-red-200"
                              : "border-gray-200 bg-white focus:border-darkGreen focus:ring-1 focus:ring-green-100 hover:border-gray-300"
                          }`}
                        />
                      ) : (
                        <input
                          {...register(name as keyof InvoiceFormValues, {
                            required: isRequired,
                            minLength: minLength,
                            maxLength: maxLength,
                          })}
                          type={type}
                          placeholder={placeholder}
                          readOnly={readOnly}
                          className={`w-full pl-10 pr-3 py-2 rounded-lg border text-gray-800 placeholder-gray-400 outline-none transition-all duration-200 text-sm ${
                            readOnly ? "bg-gray-100 cursor-not-allowed" : ""
                          } ${
                            autoFilledFields.includes(name)
                              ? "border-green-400 bg-green-50 ring-1 ring-green-100"
                              : errors[name as keyof InvoiceFormValues]
                              ? "border-red-300 bg-red-50 focus:border-red-500 focus:ring-1 focus:ring-red-200"
                              : "border-gray-200 bg-white focus:border-darkGreen focus:ring-1 focus:ring-green-100 hover:border-gray-300"
                          }`}
                        />
                      )}
                    </div>
                    {errors[name as keyof InvoiceFormValues] && (
                      <div className="mt-1 flex items-center gap-1 text-xs text-red-600">
                        <div className="h-1 w-1 rounded-full bg-red-500"></div>
                        {errors[name as keyof InvoiceFormValues]?.type === "required" && `${label} is required`}
                        {errors[name as keyof InvoiceFormValues]?.type === "minLength" && `${label} must be at least ${minLength} character${minLength !== 1 ? 's' : ''}`}
                        {errors[name as keyof InvoiceFormValues]?.type === "maxLength" && `${label} cannot exceed ${maxLength} character${maxLength !== 1 ? 's' : ''}`}
                      </div>
                    )}
                  </div>
                ),
              )}

              {/* Invoice Items Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-linear-to-r from-darkBlue to-blue-600">
                    <FaList className="h-3 w-3 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-800">Invoice Items</h3>
                    <p className="text-xs text-gray-600">Add services and their costs</p>
                  </div>
                </div>
                
                {items.map((item, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border transition-all duration-200 ${
                      autoFilledFields.includes("items")
                        ? "border-green-400 bg-green-50 ring-1 ring-green-100"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="flex-1 space-y-2">
                        <div className="relative">
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                            <FaList className="h-3 w-3" />
                          </div>
                          <input
                            {...register(`items[${index}].description` as any, {
                              required: "Item description is required",
                              onChange: (e) =>
                                handleItemChange(index, "description", e.target.value),
                            })}
                            defaultValue={item.description}
                            placeholder="Service description (e.g., Hood Cleaning, Vent Maintenance)"
                            className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-800 placeholder-gray-400 outline-none focus:border-darkGreen focus:ring-1 focus:ring-green-100 text-sm"
                          />
                        </div>
                        <div className="relative">
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                            <FaStickyNote className="h-3 w-3" />
                          </div>
                          <input
                            {...register(`items[${index}].details` as any, {
                              onChange: (e) =>
                                handleItemChange(index, "details", e.target.value),
                            })}
                            defaultValue={item.details || ""}
                            placeholder="System details (e.g., 2 hoods 17 filters)"
                            className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-800 placeholder-gray-400 outline-none focus:border-darkGreen focus:ring-1 focus:ring-green-100 text-sm"
                          />
                        </div>
                        <div className="relative w-24">
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                            <FaDollarSign className="h-3 w-3" />
                          </div>
                          <input
                            {...register(`items[${index}].price` as any, {
                              required: "Price is required",
                              valueAsNumber: true,
                              onChange: (e) =>
                                handleItemChange(index, "price", parseFloat(e.target.value) || 0),
                            })}
                            defaultValue={item.price}
                            placeholder="0.00"
                            type="number"
                            step="0.01"
                            min="0"
                            className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-800 placeholder-gray-400 outline-none focus:border-darkGreen focus:ring-1 focus:ring-green-100 text-sm"
                          />
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => deleteItem(index)}
                        disabled={items.length === 1}
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 border border-red-200 text-red-500 hover:bg-red-100 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <FaTrash className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
                
                {errors.items && (
                  <div className="mt-1 flex items-center gap-1 text-xs text-red-600">
                    <div className="h-1 w-1 rounded-full bg-red-500"></div>
                    All items require description and price
                  </div>
                )}
                
                <button
                  type="button"
                  onClick={addItem}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-gray-100 border border-dashed border-gray-300 px-3 py-2 font-medium text-gray-600 transition-all duration-200 hover:bg-gray-200 hover:border-gray-400 text-sm"
                >
                  <FaPlus className="h-3 w-3" />
                  Add Another Item
                </button>

                {/* Total Display */}
                {items.length > 0 && items.some(item => item.price > 0) && (
                  <div className="flex items-center justify-between rounded-lg bg-darkGreen/10 border border-darkGreen/20 p-3">
                    <span className="font-semibold text-gray-800 text-sm">Total Amount:</span>
                    <span className="text-lg font-bold text-darkGreen">
                      ${calculateTotal().toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Submit Button */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4">
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
                      Creating Invoice...
                    </>
                  ) : (
                    <>
                      <FaFileInvoice className="h-3 w-3" />
                      Create Invoice
                    </>
                  )}
                </div>
              </button>
            </div>
          </form>
        </div>
      </div>
      
      {/* Header Section */}
      <div className="mb-4 flex flex-row items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-r from-darkGreen to-green-600 shadow-lg">
            <FaFileInvoice className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
            <p className="text-xs text-gray-600">Create and manage client invoices</p>
          </div>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="group flex items-center gap-2 rounded-xl bg-linear-to-r from-darkBlue to-blue-600 px-4 py-2 font-semibold text-white shadow-lg border border-blue-500/20 transition-all duration-300 hover:shadow-xl hover:scale-105 active:scale-95"
        >
          <FaPlus className="h-3 w-3 transition-transform group-hover:rotate-90" />
          Add Invoice
        </button>
      </div>
    </>
  );
};

export default AddInvoice;

