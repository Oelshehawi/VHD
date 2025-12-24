"use client";
import { useState, useEffect } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import {
  FaTrash,
  FaPlus,
  FaFileInvoice,
  FaBriefcase,
  FaMapMarkerAlt,
  FaStickyNote,
  FaList,
  FaDollarSign,
} from "react-icons/fa";
import { X, Loader2 } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { calculateDueDate } from "../../app/lib/utils";
import {
  createInvoice,
  getClientInvoicesForAutofill,
} from "../../app/lib/actions/actions";
import { ClientType } from "../../app/lib/typeDefinitions";
import { ClientCombobox } from "./ClientCombobox";
import { useDebounceSubmit } from "../../app/hooks/useDebounceSubmit";
import { toast } from "react-hot-toast";
import InvoiceSelectionModal from "./InvoiceSelectionModal";
import { useIsMobile } from "../../app/hooks/use-mobile";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { DatePicker } from "../ui/date-picker";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

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
  const isMobile = useIsMobile();
  const [items, setItems] = useState([
    { description: "", details: "", price: 0 },
  ]);
  const [open, setOpen] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [isAutoFilling, setIsAutoFilling] = useState(false);
  const [autoFilledFields, setAutoFilledFields] = useState<string[]>([]);
  const [clientInvoices, setClientInvoices] = useState<any[]>([]);
  const [selectedClient, setSelectedClient] = useState<ClientType | null>(null);
  const [showInvoiceSelector, setShowInvoiceSelector] = useState(false);
  const [dateIssuedValue, setDateIssuedValue] = useState<Date | undefined>();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    clearErrors,
    watch,
    formState: { errors },
  } = useForm<InvoiceFormValues>({
    defaultValues: {
      frequency: 2, // Default to semi-annual (2x/year)
    },
  });

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

  const handleDateIssuedChange = (date: Date | undefined) => {
    setDateIssuedValue(date);
    if (date) {
      const formattedDate = format(date, "yyyy-MM-dd");
      setValue("dateIssued", formattedDate);
      clearErrors("dateIssued");
    }
  };

  const { isProcessing, debouncedSubmit } = useDebounceSubmit({
    onSubmit: async (data: InvoiceFormValues) => {
      const userName = user?.fullName || user?.firstName || "User";
      await createInvoice(data, userName);
      setOpen(false);
      setResetKey((prev) => prev + 1);
      setItems([{ description: "", details: "", price: 0 }]);
      setDateIssuedValue(undefined);
      reset();
    },
    successMessage: "Invoice has been successfully added",
  });

  const calculateTotal = () => {
    return items.reduce((total, item) => total + (item.price || 0), 0);
  };

  return (
    <>
      {/* Header Section */}
      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-lg">
            <FaFileInvoice className="text-primary-foreground h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-foreground truncate text-xl font-bold sm:text-2xl">
              Invoices
            </h1>
            <p className="text-muted-foreground text-xs">
              Create and manage client invoices
            </p>
          </div>
        </div>
        <Drawer
          open={open}
          onOpenChange={setOpen}
          direction={isMobile ? "bottom" : "right"}
        >
          <DrawerTrigger asChild>
            <Button className="w-full gap-2 sm:w-auto">
              <FaPlus className="h-3 w-3" />
              Add Invoice
            </Button>
          </DrawerTrigger>
          <DrawerContent
            className={cn(
              isMobile
                ? "inset-x-0 bottom-0 max-h-[96vh] rounded-t-[10px]"
                : "top-0 right-0 bottom-0 left-auto mt-0 h-full w-full max-w-2xl rounded-none border-l",
            )}
          >
            <DrawerHeader
              className={cn(
                "bg-primary text-primary-foreground shrink-0",
                isMobile && "text-center",
              )}
            >
              <div
                className={cn(
                  "flex items-center",
                  isMobile ? "flex-col gap-3" : "justify-between",
                )}
              >
                <div
                  className={cn(
                    "flex items-center gap-2",
                    isMobile && "flex-col",
                  )}
                >
                  <div className="bg-primary-foreground/20 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg">
                    <FaFileInvoice className="h-4 w-4" />
                  </div>
                  <div className={isMobile ? "text-center" : ""}>
                    <DrawerTitle>Create New Invoice</DrawerTitle>
                    <DrawerDescription className="text-primary-foreground/80">
                      Generate invoice for client services
                    </DrawerDescription>
                  </div>
                </div>
                <DrawerClose asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-primary-foreground hover:bg-primary-foreground/20"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </DrawerClose>
              </div>
            </DrawerHeader>
            <div className="bg-background flex-1 overflow-y-auto p-4 sm:p-6">
              <form
                onSubmit={handleSubmit((data) => debouncedSubmit(data))}
                className="space-y-4"
              >
                {/* Auto-fill Status */}
                {isAutoFilling && (
                  <div className="bg-muted border-border flex items-center justify-center rounded-lg border p-3">
                    <Loader2 className="text-muted-foreground mr-2 h-4 w-4 animate-spin" />
                    <span className="text-muted-foreground text-xs font-medium">
                      Loading client data...
                    </span>
                  </div>
                )}

                {/* Client Selection */}
                <div className="space-y-2">
                  <Label htmlFor="client" className="text-sm font-medium">
                    Select Client{" "}
                    <span className="text-destructive ml-1">*</span>
                  </Label>
                  <p className="text-muted-foreground text-xs">
                    Choose the client for this invoice
                  </p>
                  <ClientCombobox
                    clients={clients}
                    onSelect={handleClientSelect}
                    error={errors.clientId}
                    resetKey={resetKey}
                  />
                  {errors.clientId && (
                    <p className="text-destructive text-xs">
                      Client is required
                    </p>
                  )}
                </div>

                {/* Invoice Selection Modal */}
                <InvoiceSelectionModal
                  invoices={clientInvoices}
                  isOpen={showInvoiceSelector}
                  onClose={() => setShowInvoiceSelector(false)}
                  onSelect={handleInvoiceSelect}
                />

                {/* Job Title */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <FaBriefcase className="text-muted-foreground h-4 w-4" />
                    <Label htmlFor="jobTitle" className="text-sm font-medium">
                      Job Title <span className="text-destructive ml-1">*</span>
                    </Label>
                  </div>
                  <p className="text-muted-foreground ml-6 text-xs">
                    Brief description of the work to be performed
                  </p>
                  <Input
                    id="jobTitle"
                    {...register("jobTitle", { required: true })}
                    placeholder="Enter job title or description"
                    data-vaul-no-drag
                    className={cn(
                      autoFilledFields.includes("jobTitle") &&
                        "border-primary/50 bg-primary/5",
                      errors.jobTitle &&
                        "border-destructive focus-visible:ring-destructive",
                    )}
                  />
                  {errors.jobTitle && (
                    <p className="text-destructive ml-6 text-xs">
                      Job Title is required
                    </p>
                  )}
                </div>

                {/* Frequency */}
                <div className="space-y-2">
                  <Label htmlFor="frequency" className="text-sm font-medium">
                    Service Frequency{" "}
                    <span className="text-destructive ml-1">*</span>
                  </Label>
                  <p className="text-muted-foreground text-xs">
                    How often this service is needed
                  </p>
                  <Select
                    value={frequency?.toString() || "2"}
                    onValueChange={(value) =>
                      setValue("frequency", Number(value))
                    }
                  >
                    <SelectTrigger
                      data-vaul-no-drag
                      className={cn(
                        autoFilledFields.includes("frequency") &&
                          "border-primary/50 bg-primary/5",
                        errors.frequency &&
                          "border-destructive focus-visible:ring-destructive",
                      )}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="12">Monthly (12x/year)</SelectItem>
                      <SelectItem value="6">Bi-Monthly (6x/year)</SelectItem>
                      <SelectItem value="4">Quarterly (4x/year)</SelectItem>
                      <SelectItem value="3">Tri-Annual (3x/year)</SelectItem>
                      <SelectItem value="2">Semi-Annual (2x/year)</SelectItem>
                      <SelectItem value="1">Annual (1x/year)</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.frequency && (
                    <p className="text-destructive text-xs">
                      Frequency is required
                    </p>
                  )}
                </div>

                {/* Location */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <FaMapMarkerAlt className="text-muted-foreground h-4 w-4" />
                    <Label htmlFor="location" className="text-sm font-medium">
                      Location <span className="text-destructive ml-1">*</span>
                    </Label>
                  </div>
                  <p className="text-muted-foreground ml-6 text-xs">
                    Where the work will be performed
                  </p>
                  <Input
                    id="location"
                    {...register("location", { required: true })}
                    placeholder="Job location or property address"
                    data-vaul-no-drag
                    className={cn(
                      autoFilledFields.includes("location") &&
                        "border-primary/50 bg-primary/5",
                      errors.location &&
                        "border-destructive focus-visible:ring-destructive",
                    )}
                  />
                  {errors.location && (
                    <p className="text-destructive ml-6 text-xs">
                      Location is required
                    </p>
                  )}
                </div>

                {/* Date Issued */}
                <div className="space-y-2">
                  <Label htmlFor="dateIssued" className="text-sm font-medium">
                    Date Issued <span className="text-destructive ml-1">*</span>
                  </Label>
                  <p className="text-muted-foreground text-xs">
                    When this invoice is being created
                  </p>
                  <div data-vaul-no-drag>
                    <DatePicker
                      id="dateIssued"
                      date={dateIssuedValue}
                      onSelect={handleDateIssuedChange}
                      placeholder="Select date issued"
                      className={cn(
                        errors.dateIssued &&
                          "border-destructive focus-visible:ring-destructive",
                      )}
                    />
                  </div>
                  {errors.dateIssued && (
                    <p className="text-destructive text-xs">
                      Date Issued is required
                    </p>
                  )}
                </div>

                {/* Date Due (Read-only) */}
                <div className="space-y-2">
                  <Label htmlFor="dateDue" className="text-sm font-medium">
                    Date Due <span className="text-destructive ml-1">*</span>
                  </Label>
                  <p className="text-muted-foreground text-xs">
                    Automatically calculated based on issue date and frequency
                  </p>
                  <Input
                    id="dateDue"
                    {...register("dateDue", { required: true })}
                    readOnly
                    data-vaul-no-drag
                    className="bg-muted cursor-not-allowed"
                  />
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <FaStickyNote className="text-muted-foreground h-4 w-4" />
                    <Label htmlFor="notes" className="text-sm font-medium">
                      Additional Notes
                    </Label>
                  </div>
                  <p className="text-muted-foreground ml-6 text-xs">
                    Optional notes about this job or invoice
                  </p>
                  <Textarea
                    id="notes"
                    {...register("notes")}
                    placeholder="Additional notes, special instructions, or important details..."
                    data-vaul-no-drag
                    className={cn(
                      "min-h-[80px]",
                      autoFilledFields.includes("notes") &&
                        "border-primary/50 bg-primary/5",
                    )}
                  />
                </div>

                {/* Invoice Items Section */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="bg-primary flex h-6 w-6 shrink-0 items-center justify-center rounded-lg">
                      <FaList className="text-primary-foreground h-3 w-3" />
                    </div>
                    <div>
                      <h3 className="text-foreground text-sm font-bold">
                        Invoice Items
                      </h3>
                      <p className="text-muted-foreground text-xs">
                        Add services and their costs
                      </p>
                    </div>
                  </div>

                  {items.map((item, index) => (
                    <div
                      key={index}
                      className={cn(
                        "border-border rounded-lg border p-3 transition-all",
                        autoFilledFields.includes("items") &&
                          "border-primary/50 bg-primary/5",
                      )}
                    >
                      <div className="flex items-start gap-2">
                        <div className="flex-1 space-y-2">
                          <Input
                            {...register(`items[${index}].description` as any, {
                              required: "Item description is required",
                              onChange: (e) =>
                                handleItemChange(
                                  index,
                                  "description",
                                  e.target.value,
                                ),
                            })}
                            defaultValue={item.description}
                            placeholder="Service description (e.g., Hood Cleaning, Vent Maintenance)"
                            data-vaul-no-drag
                          />
                          <Input
                            {...register(`items[${index}].details` as any, {
                              onChange: (e) =>
                                handleItemChange(
                                  index,
                                  "details",
                                  e.target.value,
                                ),
                            })}
                            defaultValue={item.details || ""}
                            placeholder="System details (e.g., 2 hoods 17 filters)"
                            data-vaul-no-drag
                          />
                          <Input
                            {...register(`items[${index}].price` as any, {
                              required: "Price is required",
                              valueAsNumber: true,
                              onChange: (e) =>
                                handleItemChange(
                                  index,
                                  "price",
                                  parseFloat(e.target.value) || 0,
                                ),
                            })}
                            defaultValue={item.price}
                            placeholder="0.00"
                            type="number"
                            step="0.01"
                            min="0"
                            data-vaul-no-drag
                            className="w-32"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          onClick={() => deleteItem(index)}
                          disabled={items.length === 1}
                        >
                          <FaTrash className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}

                  {errors.items && (
                    <p className="text-destructive text-xs">
                      All items require description and price
                    </p>
                  )}

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full border-dashed"
                    onClick={addItem}
                  >
                    <FaPlus className="mr-2 h-3 w-3" />
                    Add Another Item
                  </Button>

                  {/* Total Display */}
                  {items.length > 0 && items.some((item) => item.price > 0) && (
                    <div className="bg-primary/10 border-primary/20 flex items-center justify-between rounded-lg border p-3">
                      <span className="text-foreground text-sm font-semibold">
                        Total Amount:
                      </span>
                      <span className="text-primary text-lg font-bold">
                        ${calculateTotal().toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              </form>
            </div>
            <DrawerFooter className="bg-background shrink-0 border-t">
              <Button
                onClick={handleSubmit((data) => debouncedSubmit(data))}
                disabled={isProcessing}
                className="w-full"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Invoice...
                  </>
                ) : (
                  <>
                    <FaFileInvoice className="mr-2 h-3 w-3" />
                    Create Invoice
                  </>
                )}
              </Button>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      </div>
    </>
  );
};

export default AddInvoice;
