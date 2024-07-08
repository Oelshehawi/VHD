"use client";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { FaTrash, FaPlus } from "react-icons/fa";
import { calculateDueDate } from "../../app/lib/utils";
import { createInvoice } from "../../app/lib/actions";
import { ClientType } from "../../app/lib/typeDefinitions";

const AddInvoice = ({ clients }: { clients: ClientType[] }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [items, setItems] = useState([{ description: "", price: "" }]);
  const [open, setOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
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

  const addItem = () => {
    setItems([...items, { description: "", price: 0 }]);
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...items];
    updatedItems[index][field] = value;
    setItems(updatedItems);
  };

  const deleteItem = (index) => {
    if (items.length > 1) {
      const updatedItems = items.filter((_, i) => i !== index);
      setItems(updatedItems);
      setValue("items", updatedItems);
    }
  };

  const handleSave = async (data) => {
    setIsLoading(true);
    try {
      await createInvoice(data);
      toast.success("Invoice has been successfully added.");
      setOpen(false);
      reset();
    } catch (error) {
      console.error("Error saving invoice:", error);
      toast.error("Error saving invoice. Please check input fields");
    } finally {
      setIsLoading(false);
    }
  };

  const inputFields = [
    {
      name: "clientId",
      type: "select",
      placeholder: "Select Client",
      isRequired: true,
    },
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

  const handleClientChange = (e) => {
    const selectedClientId = e.target.value;
    const selectedClient = clients.find(
      (client) => client._id === selectedClientId,
    );

    setValue("clientId", selectedClientId);
    if (selectedClient) {
      setValue("prefix", selectedClient.prefix);
    }
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
                      {...register(name, { required: isRequired })}
                      placeholder={placeholder}
                      className="h-24 w-full rounded border-2 border-gray-400 p-2 text-gray-700 outline-none focus:border-darkGreen focus:ring-2 focus:ring-darkGreen"
                    />
                  ) : type === "select" ? (
                    <div className="field">
                      <select
                        {...register("clientId", { required: true })}
                        onChange={handleClientChange}
                        className="w-full rounded border-2 border-gray-400 p-2 text-gray-700 outline-none focus:border-darkGreen focus:ring-2 focus:ring-darkGreen"
                      >
                        <option value="">Select Client</option>
                        {clients.map((client) => (
                          <option key={client._id} value={client._id}>
                            {client.clientName} - {client.email}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <input
                      {...register(name, {
                        required: isRequired,
                        minLength: minLength,
                        maxLength: maxLength,
                      })}
                      type={type}
                      placeholder={placeholder}
                      readOnly={readOnly}
                      className="w-full rounded border-2 border-gray-400 p-2 text-black outline-none focus:border-darkGreen focus:ring-2 focus:ring-darkGreen"
                    />
                  )}
                  {errors[name] && errors[name]?.type === "required" && (
                    <p className="mt-1 text-xs text-red-500">
                      {name} is required
                    </p>
                  )}
                  {errors[name] && errors[name]?.type === "minLength" && (
                    <p className="mt-1 text-xs text-red-500">
                      {name} must be at least 1 characters
                    </p>
                  )}
                  {errors[name] && errors[name]?.type === "maxLength" && (
                    <p className="mt-1 text-xs text-red-500">
                      {name} Cannot be more than 1 characters
                    </p>
                  )}
                </div>
              ),
            )}

            {/* Dynamically add item fields here */}

            {items.map((item, index) => (
              <div
                key={index}
                className="flex w-full items-center justify-between space-x-2"
              >
                <input
                  {...register(`items[${index}].description`, {
                    required: "Item description is required",
                    onChange: (e) =>
                      handleItemChange(index, "description", e.target.value),
                  })}
                  defaultValue={item.description}
                  placeholder="Item Description"
                  className="w-3/5 rounded border-2 border-gray-400 p-2 text-black outline-none focus:border-darkGreen focus:ring-2 focus:ring-darkGreen"
                />
                {errors.items?.[index]?.description && (
                  <p className="text-xs text-red-500">
                    {errors.items[index].description.message}
                  </p>
                )}
                <input
                  {...register(`items[${index}].price`, {
                    required: "Price is required",
                    valueAsNumber: true,
                    onChange: (e) =>
                      handleItemChange(index, "price", e.target.value),
                  })}
                  defaultValue={item.price}
                  placeholder="Price"
                  type="number"
                  className="w-1/5 rounded border-2 border-gray-400 p-2 text-black outline-none focus:border-darkGreen focus:ring-2 focus:ring-darkGreen"
                />
                {errors.items?.[index]?.price && (
                  <p className="text-xs text-red-500">
                    {errors.items[index].price.message}
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
                className={`btn ${
                  isLoading ? "loading" : ""
                } w-full rounded bg-darkGreen p-2 text-white hover:bg-darkBlue`}
              >
                {isLoading ? "Saving..." : "Save Invoice"}
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
          className="h-full rounded bg-darkGreen px-4 py-2 font-bold text-white shadow-sm hover:bg-darkBlue"
        >
          {"Add Invoice"}
        </button>
      </div>
    </>
  );
};

export default AddInvoice;
