"use client";
import { useState, useEffect } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { FaTrash, FaPlus } from "react-icons/fa";
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
  items: { description: string; price: number }[];
}

const AddInvoice = ({ clients }: AddInvoiceProps) => {
  const [items, setItems] = useState([{ description: "", price: 0 }]);
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
    setItems([...items, { description: "", price: 0 }]);
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
      await createInvoice(data);
      setOpen(false);
      setResetKey((prev) => prev + 1);
      setItems([{ description: "", price: 0 }]);
      reset();
    },
    successMessage: "Invoice has been successfully added",
  });

  const inputFields = [
    {
      name: "jobTitle",
      type: "text",
      placeholder: "Job Title",
      isRequired: true,
    },
    {
      name: "frequency",
      type: "number",
      placeholder: "Frequency (per year)",
      isRequired: true,
      minLength: 1,
      maxLength: 1,
    },
    {
      name: "location",
      type: "text",
      placeholder: "Location",
      isRequired: true,
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
      name: "notes",
      type: "textarea",
      placeholder: "Additional Notes",
      isRequired: false,
    },
  ];

  const handleSave: SubmitHandler<InvoiceFormValues> = (data) => {
    debouncedSubmit(data);
  };

  return (
    <>
      <div
        className={`fixed inset-0 z-10 bg-[#1f293799] transition-opacity duration-300 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setOpen(false)}
      ></div>
      <div
        className={`fixed right-0 top-0 z-30 flex h-screen w-3/4 max-w-full transition-transform duration-300 lg:w-1/3 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex w-full flex-col bg-white shadow-lg">
          <div className="flex w-full flex-row items-center justify-between bg-darkGreen p-2">
            <h2 className="text-lg font-medium text-white">Add New Invoice</h2>
            <button
              onClick={() => setOpen(false)}
              className="rounded-md p-2 text-white hover:text-gray-500"
            >
              X
            </button>
          </div>
          <form
            onSubmit={handleSubmit(handleSave)}
            className="mt-4 space-y-6 overflow-auto p-4"
          >
            {isAutoFilling && (
              <div className="mb-4 flex items-center justify-center">
                <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-darkGreen"></div>
                <span className="ml-2 text-sm text-gray-600">
                  Auto-filling form...
                </span>
              </div>
            )}

            {/* Client Dropdown */}
            <ClientSearchSelect
              placeholder="Search for a Client"
              data={clients}
              onSelect={handleClientSelect}
              register={register}
              error={errors.clientId}
              resetKey={resetKey}
            />

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
              }) => (
                <div key={name} className="field">
                  {type === "textarea" ? (
                    <textarea
                      {...register(name as keyof InvoiceFormValues, {
                        required: isRequired,
                      })}
                      placeholder={placeholder}
                      className={`h-24 w-full rounded border-2 p-2 text-gray-700 outline-none focus:border-darkGreen focus:ring-2 focus:ring-darkGreen ${
                        autoFilledFields.includes(name)
                          ? "border-green-400 bg-green-50"
                          : "border-gray-400"
                      } transition-colors duration-300`}
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
                      className={`text-black w-full rounded border-2 p-2 outline-none focus:border-darkGreen focus:ring-2 focus:ring-darkGreen ${
                        autoFilledFields.includes(name)
                          ? "border-green-400 bg-green-50"
                          : "border-gray-400"
                      } transition-colors duration-300`}
                    />
                  )}
                  {errors[name as keyof InvoiceFormValues]?.type ===
                    "required" && (
                    <p className="mt-1 text-xs text-red-500">
                      {name} is required
                    </p>
                  )}
                  {errors[name as keyof InvoiceFormValues]?.type ===
                    "minLength" && (
                    <p className="mt-1 text-xs text-red-500">
                      {name} must be at least {minLength} character
                    </p>
                  )}
                  {errors[name as keyof InvoiceFormValues]?.type ===
                    "maxLength" && (
                    <p className="mt-1 text-xs text-red-500">
                      {name} cannot be more than {maxLength} characters
                    </p>
                  )}
                </div>
              ),
            )}

            {/* Dynamically add item fields here */}
            {items.map((item, index) => (
              <div
                key={index}
                className={`flex w-full items-center justify-between space-x-2 ${
                  autoFilledFields.includes("items")
                    ? "rounded border-2 border-green-400 bg-green-50 p-2"
                    : ""
                }`}
              >
                <input
                  {...register(`items[${index}].description` as any, {
                    required: "Item description is required",
                    onChange: (e) =>
                      handleItemChange(index, "description", e.target.value),
                  })}
                  defaultValue={item.description}
                  placeholder="Item Description"
                  className="text-black w-3/5 rounded border-2 border-gray-400 p-2 outline-none focus:border-darkGreen focus:ring-2 focus:ring-darkGreen"
                />
                {errors.items?.[index]?.description && (
                  <p className="text-xs text-red-500">
                    {errors.items[index]?.description?.message}
                  </p>
                )}
                <input
                  {...register(`items[${index}].price` as any, {
                    required: "Price is required",
                    valueAsNumber: true,
                    onChange: (e) =>
                      handleItemChange(index, "price", e.target.value),
                  })}
                  defaultValue={item.price}
                  placeholder="Price"
                  type="number"
                  className="text-black w-1/5 rounded border-2 border-gray-400 p-2 outline-none focus:border-darkGreen focus:ring-2 focus:ring-darkGreen"
                />
                {errors.items?.[index]?.price && (
                  <p className="text-xs text-red-500">
                    {errors.items[index]?.price?.message}
                  </p>
                )}
                <FaTrash
                  className="size-8 cursor-pointer rounded bg-darkGray p-1 text-red-500"
                  onClick={() => deleteItem(index)}
                />
              </div>
            ))}
            <button
              type="button"
              onClick={addItem}
              className="flex flex-row items-center justify-center rounded bg-darkBlue px-4 py-2 font-bold text-white shadow-sm hover:bg-darkGreen"
            >
              <div>Add Item</div> <FaPlus />
            </button>
            <div className="flex justify-center">
              <button
                type="submit"
                disabled={isProcessing}
                className={`w-full rounded bg-darkGreen p-2 text-white hover:bg-darkBlue disabled:cursor-not-allowed disabled:opacity-50
                  ${isProcessing ? "animate-pulse" : ""}`}
              >
                {isProcessing ? "Saving..." : "Save Invoice"}
              </button>
            </div>
          </form>
          <div className="flex items-center justify-between p-4"></div>
        </div>
      </div>
      <div className="my-2 flex flex-row items-center justify-between">
        <div className="fw-bold text-xl">Invoices</div>
        <button
          onClick={() => setOpen(true)}
          className="flex h-full items-center gap-2 rounded bg-darkGreen px-4 py-2 font-bold text-white shadow-sm hover:bg-darkBlue"
        >
          <FaPlus className="h-4 w-4" />
          {"Add Invoice"}
        </button>
      </div>
    </>
  );
};

export default AddInvoice;
