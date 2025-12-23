"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { updateInvoice } from "../../app/lib/actions/actions";
import { FaPen, FaPlus, FaTrash, FaCalculator, FaSave, FaTimes } from "react-icons/fa";
import { Card, CardContent, CardHeader } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

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
    <Card>
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg">
              <FaCalculator className="text-primary h-5 w-5" />
            </div>
            <div className="ml-3">
              <h3 className="text-foreground text-lg font-semibold">Price Breakdown</h3>
              <p className="text-muted-foreground text-sm">
                {items.length} {items.length === 1 ? 'item' : 'items'}
              </p>
            </div>
          </div>
          <Button
            onClick={toggleEdit}
            size="sm"
          >
            <FaPen className="mr-2 h-4 w-4" />
            {isEditingAmount ? 'Cancel' : 'Edit'}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Items List */}
          <div className="space-y-3">
            {items.map((item: any, index: number) => (
              <div
                key={index}
                className={`rounded-lg border p-4 transition-all duration-200 ${
                  isEditingAmount ? 'bg-muted border-border' : 'bg-muted/50 border-border'
                }`}
              >
                {isEditingAmount ? (
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <div className="flex-1">
                        <Label htmlFor={`description-${index}`} className="text-xs">
                          Description
                        </Label>
                        <Input
                          id={`description-${index}`}
                          {...register(`items[${index}].description`)}
                          defaultValue={item.description}
                          placeholder="Enter description"
                          className="mt-1"
                        />
                      </div>
                      <div className="w-32">
                        <Label htmlFor={`price-${index}`} className="text-xs">
                          Price
                        </Label>
                        <Input
                          id={`price-${index}`}
                          {...register(`items[${index}].price`)}
                          defaultValue={item.price}
                          placeholder="0.00"
                          type="number"
                          step="0.01"
                          className="mt-1"
                        />
                      </div>
                      <Button
                        type="button"
                        onClick={() => deleteItem(index)}
                        disabled={items.length <= 1}
                        variant="destructive"
                        size="icon"
                        className="mt-6"
                        title={items.length <= 1 ? "Cannot delete the last item" : "Delete item"}
                      >
                        <FaTrash className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex-1">
                      <Label htmlFor={`details-${index}`} className="text-xs">
                        System Details
                      </Label>
                      <Input
                        id={`details-${index}`}
                        {...register(`items[${index}].details`)}
                        defaultValue={item.details || ""}
                        placeholder="System specifications (e.g., 2 hoods 17 filters)"
                        className="mt-1"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <span className="text-foreground font-medium">{item.description}</span>
                      {item.details && (
                        <div className="text-muted-foreground mt-1 text-sm">
                          {item.details}
                        </div>
                      )}
                    </div>
                    <span className="text-foreground font-semibold">
                      ${parseFloat(item.price).toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Add Item Button (Edit Mode Only) */}
          {isEditingAmount && (
            <Button
              type="button"
              onClick={addItem}
              variant="outline"
              className="border-primary/30 text-primary hover:bg-primary/10 w-full border-2 border-dashed"
            >
              <FaPlus className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          )}

          {/* Totals Section */}
          <div className="border-border space-y-2 border-t pt-4">
            <div className="text-muted-foreground flex justify-between text-sm">
              <span>Subtotal:</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="text-muted-foreground flex justify-between text-sm">
              <span>GST (5%):</span>
              <span>${gst.toFixed(2)}</span>
            </div>
            <div className="text-foreground border-border flex justify-between border-t pt-2 text-lg font-semibold">
              <span>Total:</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>

          {/* Action Buttons (Edit Mode Only) */}
          {isEditingAmount && (
            <div className="flex space-x-3 pt-4">
              <Button
                type="submit"
                className="flex-1"
              >
                <FaSave className="mr-2 h-4 w-4" />
                Save Changes
              </Button>
              <Button
                type="button"
                onClick={toggleEdit}
                variant="outline"
                className="flex-1"
              >
                <FaTimes className="mr-2 h-4 w-4" />
                Cancel
              </Button>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
};

export default PriceBreakdown;
