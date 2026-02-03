"use client";
import { useState } from "react";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import {
  FaPlus,
  FaFileInvoice,
  FaList,
  FaDollarSign,
  FaTrash,
  FaEdit,
} from "react-icons/fa";
import { createEstimate } from "../../app/lib/actions/estimates.actions";
import { ClientType } from "../../app/lib/typeDefinitions";
import { useDebounceSubmit } from "../../app/hooks/useDebounceSubmit";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "../ui/drawer";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Separator } from "../ui/separator";
import { MultiSelect } from "../ui/multi-select";

interface AddEstimateProps {
  clients: ClientType[];
}

interface EstimateFormValues {
  prospectInfo?: {
    businessName?: string;
    contactPerson?: string;
    email?: string;
    phone?: string;
    address?: string;
    projectLocation?: string;
  };
  services: string[];
  notes?: string;
  items: { description: string; details?: string; price: number }[];
}

const AddEstimate = ({ clients }: AddEstimateProps) => {
  const [open, setOpen] = useState(false);

  // Default services list
  const defaultServices = [
    "Hood from inside and outside",
    "All filters",
    "Access panels to duct work (accessible area only)",
    "Rooftop fan (If safe access)",
    "Fire wall behind equipment",
    "ASTTBC Sticker",
    "Fire Dept Report",
    "Before/After pictures",
    "Eco unit maintenance",
    "Filter replacement",
  ];

  const [selectedServices, setSelectedServices] =
    useState<string[]>(defaultServices);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<EstimateFormValues>({
    defaultValues: {
      items: [{ description: "", details: "", price: 0 }],
      services: selectedServices,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  // Watch items for live total calculation
  const watchedItems = useWatch({ control, name: "items" });

  const { isProcessing, debouncedSubmit } = useDebounceSubmit({
    onSubmit: async (data: EstimateFormValues) => {
      // Process the form data
      const processedData: any = { ...data };

      // Extract prospect info fields
      const prospectInfo: any = {};
      Object.keys(data).forEach((key) => {
        if (key.startsWith("prospectInfo.")) {
          const fieldName = key.replace("prospectInfo.", "");
          prospectInfo[fieldName] = data[key as keyof EstimateFormValues];
          delete processedData[key];
        }
      });

      // Also check if prospectInfo is directly in the data
      if (data.prospectInfo) {
        Object.assign(prospectInfo, data.prospectInfo);
        delete processedData.prospectInfo;
      }

      // Only include prospectInfo if there are values
      if (Object.keys(prospectInfo).length > 0) {
        processedData.prospectInfo = prospectInfo;
      }

      // Process services field (use selectedServices state)
      processedData.services = selectedServices;

      // Add default terms
      processedData.terms =
        "Payment is due upon completion of service. Prices subject to change if scope of work differs from initial assessment.";

      // Process items array - ensure proper structure and calculate totals
      if (data.items) {
        processedData.items = data.items.map((item: any) => ({
          description: item.description || "",
          details: item.details || "",
          price: Number(item.price) || 0,
        }));

        // Calculate totals from items
        const subtotal = processedData.items.reduce(
          (sum: number, item: any) => sum + (Number(item.price) || 0),
          0,
        );
        const gst = subtotal * 0.05; // 5% GST
        const total = subtotal + gst;

        processedData.subtotal = subtotal;
        processedData.gst = gst;
        processedData.total = total;
      }

      await createEstimate(processedData);
      setOpen(false);
      reset();
      setSelectedServices(defaultServices);
    },
    successMessage: "Estimate has been successfully created",
  });

  const calculateTotal = () => {
    if (!watchedItems) return 0;
    return watchedItems.reduce((total, item) => {
      const price = Number(item?.price) || 0;
      return total + price;
    }, 0);
  };

  const subtotal = Math.round(calculateTotal() * 100) / 100;
  const gst = Math.round(subtotal * 0.05 * 100) / 100;
  const total = Math.round((subtotal + gst) * 100) / 100;

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button>
          <FaPlus className="h-4 w-4" />
          New Estimate
        </Button>
      </DrawerTrigger>
      <DrawerContent className="max-h-[96vh]">
        <DrawerHeader>
          <DrawerTitle className="flex items-center gap-2">
            <FaFileInvoice className="h-5 w-5" />
            Create New Estimate
          </DrawerTitle>
          <DrawerDescription>
            Generate estimate for client services
          </DrawerDescription>
        </DrawerHeader>

        <form
          onSubmit={handleSubmit(debouncedSubmit)}
          className="flex-1 overflow-auto"
        >
          <div className="space-y-4 p-4">
            {/* Prospect Information Section */}
            <Card className="">
              <CardHeader>
                <CardTitle className="text-base">
                  Prospect Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="businessName">Business Name</Label>
                    <Input
                      id="businessName"
                      {...register("prospectInfo.businessName")}
                      placeholder="Business or company name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contactPerson">Contact Person</Label>
                    <Input
                      id="contactPerson"
                      {...register("prospectInfo.contactPerson")}
                      placeholder="Primary contact name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      {...register("prospectInfo.email")}
                      placeholder="contact@business.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      {...register("prospectInfo.phone")}
                      placeholder="(555) 123-4567"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      {...register("prospectInfo.address")}
                      placeholder="Business address"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="projectLocation">Project Location</Label>
                    <Input
                      id="projectLocation"
                      {...register("prospectInfo.projectLocation")}
                      placeholder="Where the work will be performed"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Services Section */}
            <Card className="">
              <CardHeader>
                <CardTitle className="text-base">
                  Our vent cleaning service includes:
                </CardTitle>
              </CardHeader>
              <CardContent>
                <MultiSelect
                  options={defaultServices.map((service) => ({
                    label: service,
                    value: service,
                  }))}
                  onValueChange={setSelectedServices}
                  defaultValue={selectedServices}
                  placeholder="Select services included"
                  maxCount={3}
                />
              </CardContent>
            </Card>

            {/* Estimate Items Section */}
            <Card className="">
              <CardHeader>
                <CardTitle className="text-base">Estimate Items</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {fields.map((field, index) => (
                  <Card key={field.id} className="p-3 py-0">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 space-y-3">
                        <div className="space-y-2">
                          <Label htmlFor={`description-${index}`}>
                            Description
                          </Label>
                          <Input
                            id={`description-${index}`}
                            {...register(
                              `items.${index}.description` as const,
                              {
                                required: "Item description is required",
                              },
                            )}
                            placeholder="Service description (e.g., Kitchen hood cleaning)"
                          />
                          {errors.items?.[index]?.description && (
                            <p className="text-destructive text-sm">
                              {errors.items[index]?.description?.message}
                            </p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`details-${index}`}>
                            System Details
                          </Label>
                          <Input
                            id={`details-${index}`}
                            {...register(`items.${index}.details` as const)}
                            placeholder="System details (e.g., 2 hoods 17 filters)"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`price-${index}`}>Price</Label>
                          <div className="relative">
                            <FaDollarSign className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                            <Input
                              id={`price-${index}`}
                              {...register(`items.${index}.price` as const, {
                                required: "Price is required",
                                valueAsNumber: true,
                              })}
                              placeholder="0.00"
                              type="number"
                              step="0.01"
                              min="0"
                              className="pl-10"
                            />
                          </div>
                          {errors.items?.[index]?.price && (
                            <p className="text-destructive text-sm">
                              {errors.items[index]?.price?.message}
                            </p>
                          )}
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        onClick={() => remove(index)}
                        disabled={fields.length === 1}
                        className="mt-8"
                      >
                        <FaTrash className="h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    append({ description: "", details: "", price: 0 })
                  }
                  className="w-full"
                >
                  <FaPlus className="h-4 w-4" />
                  Add Another Item
                </Button>

                {/* Totals Display */}
                {fields.length > 0 && (
                  <Card className="bg-muted/50">
                    <CardContent className="space-y-2 p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground text-sm">
                          Subtotal:
                        </span>
                        <span className="text-sm font-medium">
                          ${subtotal.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground text-sm">
                          GST (5%):
                        </span>
                        <span className="text-sm font-medium">
                          ${gst.toFixed(2)}
                        </span>
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Total:</span>
                        <span className="text-lg font-bold">
                          ${total.toFixed(2)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>

            {/* Additional Notes */}
            <Card className="">
              <CardHeader>
                <CardTitle className="text-base">Additional Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  {...register("notes")}
                  placeholder="Special instructions, scheduling notes, etc."
                  rows={3}
                />
              </CardContent>
            </Card>
          </div>
        </form>

        <DrawerFooter>
          <Button
            type="submit"
            onClick={handleSubmit(debouncedSubmit)}
            disabled={isProcessing}
            className="w-full"
          >
            {isProcessing ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white"></div>
                Creating Estimate...
              </>
            ) : (
              <>
                <FaFileInvoice className="mr-2 h-4 w-4" />
                Create Estimate
              </>
            )}
          </Button>
          <DrawerClose asChild>
            <Button variant="outline">Cancel</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default AddEstimate;
