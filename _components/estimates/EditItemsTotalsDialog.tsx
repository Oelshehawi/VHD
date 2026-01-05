"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { useState, useEffect } from "react";
import { FaSave, FaTimes, FaPlus, FaTrash, FaDollarSign } from "react-icons/fa";
import { toast } from "react-hot-toast";
import { updateEstimate } from "../../app/lib/actions/estimates.actions";
import { EstimateType } from "../../app/lib/typeDefinitions";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { ScrollArea } from "../ui/scroll-area";
import { Card } from "../ui/card";
import { Separator } from "../ui/separator";

interface EditItemsTotalsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  estimate: EstimateType;
}

interface ItemFormData {
  description: string;
  details: string;
  price: number;
}

interface FormData {
  items: ItemFormData[];
}

export default function EditItemsTotalsDialog({
  isOpen,
  onClose,
  estimate,
}: EditItemsTotalsDialogProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  const updateEstimateWithId = updateEstimate.bind(
    null,
    estimate._id.toString(),
  );

  const { register, handleSubmit, control, watch, reset } = useForm<FormData>({
    defaultValues: {
      items:
        estimate.items?.map((item) => ({
          description: item.description || "",
          details: item.details || "",
          price: item.price || 0,
        })) || [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  // Reset form when dialog opens with new estimate data
  useEffect(() => {
    if (isOpen) {
      reset({
        items:
          estimate.items?.map((item) => ({
            description: item.description || "",
            details: item.details || "",
            price: item.price || 0,
          })) || [],
      });
    }
  }, [isOpen, estimate.items, reset]);

  // Watch items for live total calculation
  const watchedItems = watch("items");

  // Calculate totals
  const calculateTotals = () => {
    const subtotal =
      Math.round(
        (watchedItems?.reduce(
          (sum, item) => sum + (Number(item.price) || 0),
          0,
        ) || 0) * 100,
      ) / 100;
    const gst = Math.round(subtotal * 0.05 * 100) / 100;
    const total = Math.round((subtotal + gst) * 100) / 100;
    return { subtotal, gst, total };
  };

  const { subtotal, gst, total } = calculateTotals();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency: "CAD",
    }).format(amount);
  };

  const onSubmit = async (formData: FormData) => {
    setIsUpdating(true);
    try {
      const items = formData.items.map((item) => ({
        description: item.description,
        details: item.details || "",
        price: Number(item.price) || 0,
      }));

      await updateEstimateWithId({ items });
      toast.success("Items updated successfully");
      onClose();
    } catch (error) {
      console.error("Error updating items:", error);
      toast.error("Failed to update items");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open && !isUpdating) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="flex max-h-[90vh] max-w-2xl flex-col p-0">
        <DialogHeader className="shrink-0 border-b px-6 pt-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg">
              <FaDollarSign className="text-primary h-5 w-5" />
            </div>
            <div>
              <DialogTitle>Edit Items & Totals</DialogTitle>
              <DialogDescription>
                Estimate {estimate.estimateNumber}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex min-h-0 flex-1 flex-col"
        >
          <ScrollArea className="flex-1 overflow-y-auto px-6 py-4">
            <div className="space-y-4 pr-4">
              {/* Items List */}
              <div className="flex items-center justify-between">
                <h4 className="text-foreground text-sm font-medium">
                  Line Items
                </h4>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    append({ description: "", details: "", price: 0 })
                  }
                >
                  <FaPlus className="mr-2 h-3 w-3" />
                  Add Item
                </Button>
              </div>

              <div className="space-y-3">
                {fields.map((field, index) => (
                  <Card key={field.id} className="p-4 py-0">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 space-y-3">
                        <div className="space-y-2">
                          <Label htmlFor={`description-${index}`}>
                            Description
                          </Label>
                          <Input
                            id={`description-${index}`}
                            {...register(`items.${index}.description` as const)}
                            placeholder="Service description"
                          />
                        </div>
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor={`details-${index}`}>
                              System Details
                            </Label>
                            <Input
                              id={`details-${index}`}
                              {...register(`items.${index}.details` as const)}
                              placeholder="e.g., 2 hoods, 17 filters"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`price-${index}`}>Price ($)</Label>
                            <Input
                              id={`price-${index}`}
                              {...register(`items.${index}.price` as const)}
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="0.00"
                            />
                          </div>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        onClick={() => remove(index)}
                        className="mt-7 shrink-0"
                      >
                        <FaTrash className="h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                ))}

                {fields.length === 0 && (
                  <div className="text-muted-foreground rounded-lg border-2 border-dashed py-8 text-center">
                    <p>No items added yet.</p>
                    <p className="mt-1 text-sm">
                      Click &quot;Add Item&quot; to get started.
                    </p>
                  </div>
                )}
              </div>

              <Separator className="my-4" />

              {/* Totals Preview */}
              <Card className="bg-muted/50 p-4 py-0">
                <h4 className="text-foreground mb-3 text-sm font-medium">
                  Totals Preview
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal:</span>
                    <span className="font-medium">
                      {formatCurrency(subtotal)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">GST (5%):</span>
                    <span className="font-medium">{formatCurrency(gst)}</span>
                  </div>
                  <Separator className="my-2" />
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">Total:</span>
                    <span className="text-lg font-bold">
                      {formatCurrency(total)}
                    </span>
                  </div>
                </div>
              </Card>
            </div>
          </ScrollArea>

          <DialogFooter className="shrink-0 gap-2 border-t px-6 py-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isUpdating}
            >
              <FaTimes className="mr-2 h-3 w-3" />
              Cancel
            </Button>
            <Button type="submit" disabled={isUpdating}>
              <FaSave className="mr-2 h-3 w-3" />
              {isUpdating ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
