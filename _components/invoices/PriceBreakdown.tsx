"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { updateInvoice } from "../../app/lib/actions/actions";
import { FaPen, FaPlus, FaTrash, FaCalculator, FaSave, FaTimes } from "react-icons/fa";

const PriceBreakdown = ({ invoice }: { invoice: any }) => {
  const updateInvoiceWithId = updateInvoice.bind(null, invoice._id);
  const { register, handleSubmit, setValue } = useForm();
  const [isEditingAmount, setIsEditingAmount] = useState(false);
  const toggleEdit = () => {
    setIsEditingAmount(!isEditingAmount);
  };
  const [items, setItems] = useState(invoice.items);

  const addItem = () => {
    setItems([...items, { description: "", details: "", price: 0 }]);
  };

  const deleteItem = (index: number) => {
    if (items.length > 1) {
      const updatedItems = items.filter((_: any, i: number) => i !== index);
      setItems(updatedItems);
      setValue("items", updatedItems);
    }
  };

  const onSubmit = async (formData: any) => {
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

  const calculateSubtotal = (items: any) => {
    return items.reduce((acc: number, item: { price: number }) => acc + Number(item.price), 0);
  };

  const calculateGST = (subtotal: number) => {
    return subtotal * 0.05;
  };

  const calculateTotal = (items: any) => {
    const subtotal = calculateSubtotal(items);
    const gst = calculateGST(subtotal);
    return subtotal + gst;
  };

  const subtotal = calculateSubtotal(items);
  const gst = calculateGST(subtotal);
  const total = calculateTotal(items);

  return (
    <div className="rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
              <FaCalculator className="h-5 w-5 text-purple-600" />
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-semibold text-gray-900">Price Breakdown</h3>
              <p className="text-sm text-gray-500">
                {items.length} {items.length === 1 ? 'item' : 'items'}
              </p>
            </div>
          </div>
          <button
            onClick={toggleEdit}
            className="inline-flex items-center rounded-lg bg-purple-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
          >
            <FaPen className="mr-2 h-4 w-4" />
            {isEditingAmount ? 'Cancel' : 'Edit'}
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="p-6">
        <div className="space-y-4">
          {/* Items List */}
          <div className="space-y-3">
            {items.map((item: any, index: number  ) => (
              <div
                key={index}
                className={`rounded-lg border p-4 transition-all duration-200 ${
                  isEditingAmount ? 'border-purple-200 bg-purple-50' : 'border-gray-200 bg-gray-50'
                }`}
              >
                {isEditingAmount ? (
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <div className="flex-1">
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Description
                        </label>
                        <input
                          {...register(`items[${index}].description`)}
                          defaultValue={item.description}
                          placeholder="Enter description"
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                        />
                      </div>
                      <div className="w-32">
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Price
                        </label>
                        <input
                          {...register(`items[${index}].price`)}
                          defaultValue={item.price}
                          placeholder="0.00"
                          type="number"
                          step="0.01"
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => deleteItem(index)}
                        disabled={items.length <= 1}
                        className="mt-6 flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 text-red-600 transition-colors hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        title={items.length <= 1 ? "Cannot delete the last item" : "Delete item"}
                      >
                        <FaTrash className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        System Details
                      </label>
                      <input
                        {...register(`items[${index}].details`)}
                        defaultValue={item.details || ""}
                        placeholder="System specifications (e.g., 2 hoods 17 filters)"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <span className="text-gray-900 font-medium">{item.description}</span>
                      {item.details && (
                        <div className="text-sm text-gray-600 mt-1">
                          {item.details}
                        </div>
                      )}
                    </div>
                    <span className="text-gray-900 font-semibold">
                      ${parseFloat(item.price).toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Add Item Button (Edit Mode Only) */}
          {isEditingAmount && (
            <button
              type="button"
              onClick={addItem}
              className="flex w-full items-center justify-center rounded-lg border-2 border-dashed border-purple-300 py-3 text-purple-600 transition-colors hover:border-purple-400 hover:bg-purple-50"
            >
              <FaPlus className="mr-2 h-4 w-4" />
              Add Item
            </button>
          )}

          {/* Totals Section */}
          <div className="border-t border-gray-200 pt-4 space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Subtotal:</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>GST (5%):</span>
              <span>${gst.toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-t border-gray-200 pt-2 text-lg font-semibold text-gray-900">
              <span>Total:</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>

          {/* Action Buttons (Edit Mode Only) */}
          {isEditingAmount && (
            <div className="flex space-x-3 pt-4">
              <button
                type="submit"
                className="flex-1 inline-flex items-center justify-center rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
              >
                <FaSave className="mr-2 h-4 w-4" />
                Save Changes
              </button>
              <button
                type="button"
                onClick={toggleEdit}
                className="flex-1 inline-flex items-center justify-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                <FaTimes className="mr-2 h-4 w-4" />
                Cancel
              </button>
            </div>
          )}
        </div>
      </form>
    </div>
  );
};

export default PriceBreakdown;
