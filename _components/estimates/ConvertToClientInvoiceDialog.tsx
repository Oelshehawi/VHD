"use client";

import { useForm } from "react-hook-form";
import { useState } from "react";
import {
  FaArrowRight,
  FaArrowLeft,
  FaTimes,
  FaCheck,
  FaBuilding,
  FaFileInvoice,
  FaCalendarAlt,
} from "react-icons/fa";
import { toast } from "react-hot-toast";
import { convertEstimateToClientAndInvoice } from "../../app/lib/actions/estimates.actions";
import { EstimateType } from "../../app/lib/typeDefinitions";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { ScrollArea } from "../ui/scroll-area";
import { Separator } from "../ui/separator";
import { Badge } from "../ui/badge";
import { Card } from "../ui/card";
import { Checkbox } from "../ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { DatePicker } from "../ui/date-picker";
import { DatePickerWithTime } from "../ui/date-picker-with-time";
import { format } from "date-fns";

interface ConvertToClientInvoiceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  estimate: EstimateType;
  technicians?: { id: string; name: string }[];
}

interface ClientFormData {
  clientName: string;
  email: string;
  phoneNumber: string;
  prefix: string;
  notes: string;
}

interface InvoiceFormData {
  jobTitle: string;
  location: string;
  frequency: number;
  dateIssued: Date | undefined;
  notes: string;
}

interface ScheduleFormData {
  createSchedule: boolean;
  startDateTime: Date | undefined;
  assignedTechnicians: string[];
  technicianNotes: string;
}

type Step = "client" | "invoice" | "schedule";

// Calculate total from items with GST
function calculateTotalFromItems(
  items: Array<{ description: string; details?: string; price: number }>,
): { subtotal: number; gst: number; total: number } {
  const subtotal = items.reduce((sum, item) => sum + (item.price || 0), 0);
  const gst = subtotal * 0.05;
  const total = subtotal + gst;
  return { subtotal, gst, total };
}

export default function ConvertToClientInvoiceDialog({
  isOpen,
  onClose,
  estimate,
  technicians = [],
}: ConvertToClientInvoiceDialogProps) {
  const [isConverting, setIsConverting] = useState(false);
  const [step, setStep] = useState<Step>("client");

  // Calculate totals from items
  const { subtotal, gst, total } = calculateTotalFromItems(estimate.items);

  // Client form
  const clientForm = useForm<ClientFormData>({
    defaultValues: {
      clientName: estimate.prospectInfo?.businessName || "",
      email: estimate.prospectInfo?.email || "",
      phoneNumber: estimate.prospectInfo?.phone || "",
      prefix: generatePrefix(estimate.prospectInfo?.businessName || ""),
      notes: "",
    },
  });

  // Invoice form
  const invoiceForm = useForm<InvoiceFormData>({
    defaultValues: {
      jobTitle: estimate.prospectInfo?.businessName || "",
      location:
        estimate.prospectInfo?.projectLocation ||
        estimate.prospectInfo?.address ||
        "",
      frequency: 2, // Default to semi-annual (2x/year)
      dateIssued: new Date(),
      notes: estimate.notes || "",
    },
  });

  // Schedule form
  const scheduleForm = useForm<ScheduleFormData>({
    defaultValues: {
      createSchedule: false,
      startDateTime: undefined,
      assignedTechnicians: [],
      technicianNotes: "",
    },
  });

  // Generate a prefix from business name (first 3 letters uppercase)
  function generatePrefix(name: string): string {
    return (
      name
        .replace(/[^a-zA-Z]/g, "")
        .substring(0, 3)
        .toUpperCase() || "NEW"
    );
  }

  // Validation checks
  const clientErrors = {
    clientName: !clientForm.watch("clientName"),
    email: !clientForm.watch("email"),
    phoneNumber: !clientForm.watch("phoneNumber"),
    prefix: !clientForm.watch("prefix"),
  };

  const invoiceErrors = {
    jobTitle: !invoiceForm.watch("jobTitle"),
    location: !invoiceForm.watch("location"),
    dateIssued: !invoiceForm.watch("dateIssued"),
  };

  const scheduleErrors = {
    startDateTime:
      scheduleForm.watch("createSchedule") &&
      !scheduleForm.watch("startDateTime"),
  };

  const isClientStepValid = !Object.values(clientErrors).some(Boolean);
  const isInvoiceStepValid = !Object.values(invoiceErrors).some(Boolean);
  const isScheduleStepValid = !Object.values(scheduleErrors).some(Boolean);

  const handleNextStep = () => {
    if (step === "client" && isClientStepValid) {
      setStep("invoice");
    } else if (step === "invoice" && isInvoiceStepValid) {
      // When moving to schedule step, auto-fill startDateTime with dateIssued
      const dateIssued = invoiceForm.getValues("dateIssued");
      if (dateIssued && !scheduleForm.getValues("startDateTime")) {
        const scheduleDate = new Date(dateIssued);
        scheduleDate.setHours(9, 0, 0, 0); // Default 9am
        scheduleForm.setValue("startDateTime", scheduleDate);
      }
      setStep("schedule");
    }
  };

  const handleBackStep = () => {
    if (step === "invoice") {
      setStep("client");
    } else if (step === "schedule") {
      setStep("invoice");
    }
  };

  const handleConvert = async () => {
    if (!isClientStepValid || !isInvoiceStepValid || !isScheduleStepValid) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsConverting(true);
    try {
      const clientData = clientForm.getValues();
      const invoiceData = invoiceForm.getValues();
      const scheduleData = scheduleForm.getValues();

      // Format dateIssued as yyyy-MM-dd string
      const dateIssuedStr = invoiceData.dateIssued
        ? format(invoiceData.dateIssued, "yyyy-MM-dd")
        : format(new Date(), "yyyy-MM-dd");

      await convertEstimateToClientAndInvoice(
        estimate._id.toString(),
        {
          clientName: clientData.clientName,
          email: clientData.email,
          emails: { primary: clientData.email },
          phoneNumber: clientData.phoneNumber,
          prefix: clientData.prefix,
          notes: clientData.notes,
        },
        {
          jobTitle: invoiceData.jobTitle,
          location: invoiceData.location,
          frequency: invoiceData.frequency,
          dateIssued: dateIssuedStr,
          notes: invoiceData.notes,
          items: estimate.items,
        },
        scheduleData.createSchedule
          ? {
              startDateTime: scheduleData.startDateTime,
              assignedTechnicians: scheduleData.assignedTechnicians,
              technicianNotes: scheduleData.technicianNotes,
            }
          : undefined,
      );

      toast.success("Client and invoice created successfully!");
      onClose();
    } catch (error) {
      console.error("Error converting estimate:", error);
      toast.error("Failed to convert estimate");
    } finally {
      setIsConverting(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open && !isConverting) {
      setStep("client");
      onClose();
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency: "CAD",
    }).format(amount);
  };

  const getStepIcon = () => {
    switch (step) {
      case "client":
        return <FaBuilding className="h-5 w-5 text-green-600" />;
      case "invoice":
        return <FaFileInvoice className="h-5 w-5 text-green-600" />;
      case "schedule":
        return <FaCalendarAlt className="h-5 w-5 text-green-600" />;
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case "client":
        return "Create Client";
      case "invoice":
        return "Create Invoice";
      case "schedule":
        return "Schedule Job (Optional)";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="flex max-h-[90vh] max-w-2xl flex-col p-0">
        <DialogHeader className="shrink-0 border-b px-6 pt-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
              {getStepIcon()}
            </div>
            <div>
              <DialogTitle>{getStepTitle()}</DialogTitle>
              <div className="text-muted-foreground mt-1 flex items-center gap-2 text-sm">
                <Badge
                  variant="outline"
                  className={step === "client" ? "bg-primary/10" : ""}
                >
                  1. Client
                </Badge>
                <FaArrowRight className="text-muted-foreground h-3 w-3" />
                <Badge
                  variant="outline"
                  className={step === "invoice" ? "bg-primary/10" : ""}
                >
                  2. Invoice
                </Badge>
                <FaArrowRight className="text-muted-foreground h-3 w-3" />
                <Badge
                  variant="outline"
                  className={step === "schedule" ? "bg-primary/10" : ""}
                >
                  3. Schedule
                </Badge>
              </div>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 overflow-y-auto px-6 py-4">
          <div className="space-y-6 pr-4">
            {step === "client" && (
              <>
                {/* Client Form */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium">Client Information</h4>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="clientName">
                        Client Name <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="clientName"
                        {...clientForm.register("clientName")}
                        placeholder="Company name"
                        className={
                          clientErrors.clientName ? "border-destructive" : ""
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">
                        Email <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        {...clientForm.register("email")}
                        placeholder="email@example.com"
                        className={
                          clientErrors.email ? "border-destructive" : ""
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phoneNumber">
                        Phone <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="phoneNumber"
                        type="tel"
                        {...clientForm.register("phoneNumber")}
                        placeholder="(555) 123-4567"
                        className={
                          clientErrors.phoneNumber ? "border-destructive" : ""
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="prefix">
                        Invoice Prefix{" "}
                        <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="prefix"
                        {...clientForm.register("prefix")}
                        placeholder="e.g., ABC"
                        maxLength={5}
                        className={
                          clientErrors.prefix ? "border-destructive" : ""
                        }
                      />
                      <p className="text-muted-foreground text-xs">
                        Used for invoice numbering (e.g., ABC-001)
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="clientNotes">Notes (optional)</Label>
                      <Input
                        id="clientNotes"
                        {...clientForm.register("notes")}
                        placeholder="Additional notes"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            {step === "invoice" && (
              <>
                {/* Invoice Form */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium">Invoice Details</h4>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="jobTitle">
                        Job Title <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="jobTitle"
                        {...invoiceForm.register("jobTitle")}
                        placeholder="Job title for invoice"
                        className={
                          invoiceErrors.jobTitle ? "border-destructive" : ""
                        }
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="location">
                        Location <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="location"
                        {...invoiceForm.register("location")}
                        placeholder="Service location"
                        className={
                          invoiceErrors.location ? "border-destructive" : ""
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="dateIssued">
                        Date Issued <span className="text-destructive">*</span>
                      </Label>
                      <DatePicker
                        id="dateIssued"
                        date={invoiceForm.watch("dateIssued")}
                        onSelect={(date) =>
                          invoiceForm.setValue("dateIssued", date)
                        }
                        placeholder="Select date"
                        className={
                          invoiceErrors.dateIssued ? "border-destructive" : ""
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="frequency">Service Frequency</Label>
                      <Select
                        value={invoiceForm.watch("frequency").toString()}
                        onValueChange={(value) =>
                          invoiceForm.setValue("frequency", Number(value))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="12">Monthly (12x/year)</SelectItem>
                          <SelectItem value="6">
                            Bi-Monthly (6x/year)
                          </SelectItem>
                          <SelectItem value="4">Quarterly (4x/year)</SelectItem>
                          <SelectItem value="3">
                            Tri-Annual (3x/year)
                          </SelectItem>
                          <SelectItem value="2">
                            Semi-Annual (2x/year)
                          </SelectItem>
                          <SelectItem value="1">Annual (1x/year)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="invoiceNotes">Notes (optional)</Label>
                      <Input
                        id="invoiceNotes"
                        {...invoiceForm.register("notes")}
                        placeholder="Invoice notes"
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Items Preview */}
                <Card className="bg-muted/50 p-4">
                  <h4 className="mb-3 text-sm font-medium">
                    Items from Estimate
                  </h4>
                  <div className="space-y-2">
                    {estimate.items.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-muted-foreground">
                          {item.description}
                        </span>
                        <span className="font-medium">
                          {formatCurrency(item.price)}
                        </span>
                      </div>
                    ))}
                    <Separator className="my-2" />
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal:</span>
                      <span>{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">GST (5%):</span>
                      <span>{formatCurrency(gst)}</span>
                    </div>
                    <div className="flex items-center justify-between font-semibold">
                      <span>Total:</span>
                      <span>{formatCurrency(total)}</span>
                    </div>
                  </div>
                </Card>
              </>
            )}

            {step === "schedule" && (
              <>
                {/* Schedule Form */}
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="createSchedule"
                      checked={scheduleForm.watch("createSchedule")}
                      onCheckedChange={(checked) =>
                        scheduleForm.setValue(
                          "createSchedule",
                          checked as boolean,
                        )
                      }
                    />
                    <div className="grid gap-1.5 leading-none">
                      <label
                        htmlFor="createSchedule"
                        className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Also create a scheduled job
                      </label>
                      <p className="text-muted-foreground text-sm">
                        Schedule this job on the calendar immediately
                      </p>
                    </div>
                  </div>

                  {scheduleForm.watch("createSchedule") && (
                    <div className="space-y-4 rounded-lg border p-4">
                      <div className="space-y-2">
                        <Label htmlFor="startDateTime">
                          Start Date & Time{" "}
                          <span className="text-destructive">*</span>
                        </Label>
                        <DatePickerWithTime
                          date={scheduleForm.watch("startDateTime")}
                          onSelect={(date) =>
                            scheduleForm.setValue("startDateTime", date)
                          }
                          datePlaceholder="Select date"
                          timePlaceholder="Select time"
                          dateId="scheduleDate"
                          timeId="scheduleTime"
                        />
                        {scheduleErrors.startDateTime && (
                          <p className="text-destructive text-sm">
                            Start date & time is required
                          </p>
                        )}
                      </div>

                      {technicians.length > 0 && (
                        <div className="space-y-2">
                          <Label>Assign Technicians</Label>
                          <div className="flex flex-wrap gap-2">
                            {technicians.map((tech) => (
                              <Badge
                                key={tech.id}
                                variant={
                                  scheduleForm
                                    .watch("assignedTechnicians")
                                    .includes(tech.id)
                                    ? "default"
                                    : "outline"
                                }
                                className="cursor-pointer"
                                onClick={() => {
                                  const current = scheduleForm.getValues(
                                    "assignedTechnicians",
                                  );
                                  if (current.includes(tech.id)) {
                                    scheduleForm.setValue(
                                      "assignedTechnicians",
                                      current.filter((id) => id !== tech.id),
                                    );
                                  } else {
                                    scheduleForm.setValue(
                                      "assignedTechnicians",
                                      [...current, tech.id],
                                    );
                                  }
                                }}
                              >
                                {tech.name}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label htmlFor="technicianNotes">
                          Technician Notes (optional)
                        </Label>
                        <Input
                          id="technicianNotes"
                          {...scheduleForm.register("technicianNotes")}
                          placeholder="Notes for technicians"
                        />
                      </div>
                    </div>
                  )}

                  {!scheduleForm.watch("createSchedule") && (
                    <Card className="bg-muted/30 p-4 py-0">
                      <p className="text-muted-foreground text-center text-sm">
                        You can skip this step and create a scheduled job later
                        from the Schedule page.
                      </p>
                    </Card>
                  )}
                </div>
              </>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="shrink-0 gap-2 border-t px-6 py-4">
          {step === "client" && (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isConverting}
              >
                <FaTimes className="mr-2 h-3 w-3" />
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleNextStep}
                disabled={!isClientStepValid}
              >
                Next: Invoice
                <FaArrowRight className="ml-2 h-3 w-3" />
              </Button>
            </>
          )}

          {step === "invoice" && (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={handleBackStep}
                disabled={isConverting}
              >
                <FaArrowLeft className="mr-2 h-3 w-3" />
                Back
              </Button>
              <Button
                type="button"
                onClick={handleNextStep}
                disabled={!isInvoiceStepValid}
              >
                Next: Schedule
                <FaArrowRight className="ml-2 h-3 w-3" />
              </Button>
            </>
          )}

          {step === "schedule" && (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={handleBackStep}
                disabled={isConverting}
              >
                <FaArrowLeft className="mr-2 h-3 w-3" />
                Back
              </Button>
              <Button
                type="button"
                onClick={handleConvert}
                disabled={isConverting || !isScheduleStepValid}
                className="bg-green-600 hover:bg-green-700"
              >
                <FaCheck className="mr-2 h-3 w-3" />
                {isConverting
                  ? "Creating..."
                  : scheduleForm.watch("createSchedule")
                    ? "Create All"
                    : "Create Client & Invoice"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
