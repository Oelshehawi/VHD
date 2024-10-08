"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { updateInvoice } from "../../app/lib/actions/actions";
import { FaPen, FaPlus, FaTrash } from "react-icons/fa";

const PriceBreakdown = ({ invoice }) => {
  const updateInvoiceWithId = updateInvoice.bind(null, invoice._id);
  const { register, handleSubmit, setValue } = useForm();
  const [isEditingAmount, setIsEditingAmount] = useState(false);
  const toggleEdit = () => {
    setIsEditingAmount(!isEditingAmount);
  };
  const [items, setItems] = useState(invoice.items);

  const addItem = () => {
    setItems([...items, { description: "", price: 0 }]);
  };

  const deleteItem = (index) => {
    if (items.length > 1) {
      const updatedItems = items.filter((_, i) => i !== index);
      setItems(updatedItems);
      setValue("items", updatedItems);
    }
  };

  const onSubmit = async (formData) => {
    try {
      await updateInvoiceWithId(formData);
      toast.success("Invoice status updated successfully");
      toggleEdit();
      setItems(formData.items);
    } catch (error) {
      console.error("Error updating invoice status:", error);
      toast.error("Failed to update invoice status");
    }
  };

  const calculateTotal = (items) => {
    const subtotal = items.reduce((acc, item) => acc + Number(item.price), 0);
    const gst = subtotal * 0.05;
    return (subtotal + gst).toFixed(2);
  };

  return (
    <div className="mb-4 w-full lg:w-[60%]">
      <div className="overflow-auto rounded border shadow">
        <div className="flex flex-row items-center justify-between border-b px-4 py-2 text-xl">
          <div>Price Breakdown</div>
          <FaPen
            className="size-6 cursor-pointer rounded bg-darkGreen p-1 text-white"
            onClick={toggleEdit}
          />
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-4">
          <ul className="flex w-full flex-col space-y-2 p-1">
            {items.map((item, index) => (
              <li
                key={index}
                className="flex items-center justify-between py-2"
              >
                {isEditingAmount ? (
                  <>
                    <input
                      {...register(`items[${index}].description`)}
                      defaultValue={item.description}
                      placeholder="Description"
                      className=" w-1/3 rounded border-2 border-gray-400 p-2 text-black outline-none focus:border-darkGreen focus:ring-2 focus:ring-darkGreen"
                    />
                    <input
                      {...register(`items[${index}].price`)}
                      defaultValue={item.price}
                      placeholder="Price"
                      type="number"
                      className=" w-1/3 rounded border-2 border-gray-400 p-2 text-black outline-none focus:border-darkGreen focus:ring-2 focus:ring-darkGreen"
                    />
                    <FaTrash
                      className="size-8 cursor-pointer rounded bg-darkGray p-1 text-red-500"
                      onClick={() => deleteItem(index)}
                    />
                  </>
                ) : (
                  <div className="flex w-full justify-between">
                    <span>{item.description}</span>
                    <span>${parseFloat(item.price).toFixed(2)}</span>
                  </div>
                )}
              </li>
            ))}
            {isEditingAmount && (
              <li>
                <button
                  type="button"
                  onClick={addItem}
                  className="flex h-full flex-row items-center justify-center space-x-2 rounded bg-darkBlue px-4 py-2 font-bold text-white shadow-sm hover:bg-darkGreen"
                >
                  <div>Add Item</div> <FaPlus />
                </button>
              </li>
            )}
            <li className="flex items-center justify-between py-2 font-bold">
              <span>Total (incl. 5% GST)</span>
              <span>${calculateTotal(items)}</span>
            </li>
          </ul>
          {isEditingAmount && (
            <div className="mt-4 flex flex-col space-y-4">
              <button
                type="submit"
                className="rounded bg-darkGreen px-4 py-2 text-white"
              >
                Update
              </button>
              <button
                type="button"
                onClick={toggleEdit}
                className="rounded bg-gray-200 px-4 py-2 text-gray-600"
              >
                Cancel
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default PriceBreakdown;
