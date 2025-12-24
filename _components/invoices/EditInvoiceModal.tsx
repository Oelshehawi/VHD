// @ts-nocheck
"use client";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { updateInvoice } from "../../app/lib/actions/actions";
import {
  formatDateToString,
  calculatePaymentDuration,
  getPaymentMethodDisplay,
} from "../../app/lib/utils";
import { toast } from "react-hot-toast";
import { calculateDueDate } from "../../app/lib/utils";
import {
  FaArrowCircleRight,
  FaCreditCard,
  FaCalendar,
  FaClock,
  FaFileInvoice,
  FaMapMarkerAlt,
  FaSave,
  FaTimes,
  FaPenSquare,
} from "react-icons/fa";
import { InvoiceType, PaymentInfo } from "../../app/lib/typeDefinitions";
import PaymentModal from "../payments/PaymentModal";
import { Card, CardContent, CardHeader } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { DatePicker } from "../ui/date-picker";
import { format } from "date-fns";

const InlineEditInvoice = ({
  invoice,
  isEditing,
  toggleEdit,
  canManage,
}: {
  invoice: InvoiceType;
  isEditing: boolean;
  toggleEdit: () => void;
  canManage: boolean;
}) => {
  const updateInvoiceWithId = updateInvoice.bind(null, invoice._id);
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [dateIssuedValue, setDateIssuedValue] = useState<Date | undefined>(
    () => {
      if (invoice.dateIssued) {
        // Parse as local date to avoid timezone conversion issues
        const dateString =
          typeof invoice.dateIssued === "string"
            ? invoice.dateIssued.split("T")[0]
            : invoice.dateIssued;
        const [year, month, day] = String(dateString).split("-").map(Number);
        const date = new Date(year, month - 1, day);
        return isNaN(date.getTime()) ? undefined : date;
      }
      return undefined;
    },
  );

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      invoiceId: invoice.invoiceId,
      jobTitle: invoice.jobTitle,
      dateIssued: invoice.dateIssued,
      dateDue: invoice.dateDue,
      frequency: invoice.frequency,
      location: invoice.location,
      notes: invoice.notes,
    },
  });

  const dateIssued = watch("dateIssued");
  const frequency = watch("frequency");

  useEffect(() => {
    const updatedDateDue = calculateDueDate(dateIssued, frequency);
    setValue("dateDue", updatedDateDue);
  }, [dateIssued, frequency, setValue]);

  const onSubmit = async (formData: any) => {
    try {
      // Trim all string fields to remove leading/trailing spaces
      const trimmedFormData = { ...formData };
      if (trimmedFormData.jobTitle) {
        trimmedFormData.jobTitle = trimmedFormData.jobTitle.trim();
      }
      if (trimmedFormData.location) {
        trimmedFormData.location = trimmedFormData.location.trim();
      }
      if (trimmedFormData.notes) {
        trimmedFormData.notes = trimmedFormData.notes.trim();
      }

      await updateInvoiceWithId(trimmedFormData);
      toast.success("Invoice updated successfully");
      if (!trimmedFormData.status) {
        toggleEdit();
      }
    } catch (error) {
      console.error("Error updating Invoice", error);
      toast.error("Failed to update invoice");
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === "paid") {
      // Show payment tracking modal
      setShowPaymentModal(true);
    } else {
      // Direct status update for non-paid statuses
      await updateStatus(newStatus);
    }
  };

  const updateStatus = async (newStatus: string, paymentInfo?: PaymentInfo) => {
    setIsUpdatingStatus(true);
    try {
      const updateData: any = { status: newStatus };

      // Add payment info if provided
      if (paymentInfo && newStatus === "paid") {
        updateData.paymentInfo = {
          method: paymentInfo.method,
          datePaid: paymentInfo.datePaid,
          notes: paymentInfo.notes,
        };
      }

      await updateInvoiceWithId(updateData);
      toast.success("Status updated successfully!");
      setShowPaymentModal(false);
      // Refresh the page to show updated payment info
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Error updating status!");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handlePaymentSubmit = (paymentData: PaymentInfo) => {
    updateStatus("paid", paymentData);
  };

  // Helper function to display frequency in human-readable format
  const getFrequencyDisplay = (frequency: number): string => {
    const frequencyMap: Record<number, string> = {
      12: "Monthly (12x/year)",
      6: "Bi-Monthly (6x/year)",
      4: "Quarterly (4x/year)",
      3: "Tri-Annual (3x/year)",
      2: "Semi-Annual (2x/year)",
      1: "Annual (1x/year)",
    };
    return frequencyMap[frequency] || `${frequency}x/year`;
  };

  // Split fields into two columns for better layout
  const leftColumnFields = [
    {
      name: "invoiceId",
      type: "text",
      label: "Invoice ID",
      isRequired: true,
      readOnly: true,
      icon: FaFileInvoice,
    },
    {
      name: "jobTitle",
      type: "text",
      label: "Job Title",
      isRequired: false,
      icon: FaFileInvoice,
    },
    {
      name: "dateIssued",
      type: "date",
      label: "Date Issued",
      isRequired: true,
      icon: FaCalendar,
    },
    {
      name: "dateDue",
      type: "text",
      label: "Date Due",
      isRequired: true,
      readOnly: true,
      icon: FaCalendar,
    },
  ];

  const rightColumnFields = [
    {
      name: "frequency",
      type: "number",
      label: "Frequency",
      isRequired: true,
      minLength: 1,
      maxLength: 1,
      icon: FaClock,
    },
    {
      name: "location",
      type: "text",
      label: "Location",
      isRequired: false,
      icon: FaMapMarkerAlt,
    },
    {
      name: "notes",
      type: "textarea",
      label: "Additional Notes",
      isRequired: false,
      icon: FaFileInvoice,
    },
  ];

  // Calculate payment duration if invoice is paid
  const paymentDuration =
    invoice.status === "paid" && invoice.paymentInfo?.datePaid
      ? calculatePaymentDuration(
          invoice.dateIssued,
          invoice.paymentInfo.datePaid,
        )
      : null;

  const renderField = (field: any) => (
    <div key={field.name} className="space-y-1">
      <div className="flex items-center">
        <field.icon className="text-muted-foreground mr-2 h-4 w-4" />
        <Label className="text-sm font-medium">
          {field.label}
          {field.isRequired && <span className="text-destructive ml-1">*</span>}
        </Label>
      </div>

      {isEditing ? (
        <div className="ml-6">
          {field.name === "frequency" ? (
            <Select
              value={frequency?.toString() || "6"}
              className="w-full"
              onValueChange={(value) => setValue("frequency", Number(value))}
            >
              <SelectTrigger className="w-full">
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
          ) : field.name === "dateDue" ? (
            // dateDue is always calculated/read-only, so display formatted value instead of Input
            <div className="bg-muted text-muted-foreground rounded-lg px-3 py-2 text-sm">
              {formatDateToString(watch("dateDue"))}
            </div>
          ) : field.name === "dateIssued" ? (
            <DatePicker
              id="dateIssued"
              date={dateIssuedValue}
              onSelect={(date) => {
                setDateIssuedValue(date);
                if (date) {
                  const formattedDate = format(date, "yyyy-MM-dd");
                  setValue("dateIssued", formattedDate);
                }
              }}
              placeholder="Select date issued"
            />
          ) : field.type === "textarea" ? (
            <Textarea
              {...register(field.name, { required: field.isRequired })}
              placeholder={field.label}
              defaultValue={invoice[field.name]}
              readOnly={field.readOnly}
              rows={2}
              disabled={field.readOnly}
            />
          ) : (
            <Input
              {...register(field.name, {
                required: field.isRequired,
                minLength: field.minLength as number,
                maxLength: field.maxLength as number,
              })}
              type={field.type}
              placeholder={field.label}
              defaultValue={
                field.name === "dateDue"
                  ? formatDateToString(invoice[field.name])
                  : invoice[field.name]
              }
              readOnly={field.readOnly}
              disabled={field.readOnly}
            />
          )}
          {errors[field.name] && errors[field.name]?.type === "required" && (
            <p className="text-destructive mt-1 text-xs">
              {field.label} is required
            </p>
          )}
        </div>
      ) : (
        <div className="ml-6">
          <div className="bg-muted text-foreground rounded-lg px-3 py-2 text-sm">
            {field.name === "dateDue" || field.name === "dateIssued" ? (
              formatDateToString(invoice[field.name])
            ) : field.name === "frequency" ? (
              getFrequencyDisplay(invoice.frequency)
            ) : field.name === "location" ? (
              <div className="flex items-center justify-between">
                <span>{invoice[field.name]}</span>
                {invoice[field.name] && (
                  <a
                    href={`https://www.google.com/maps/place/${encodeURI(invoice[field.name])}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary/80 ml-2 transition-colors"
                    title="View on Google Maps"
                  >
                    <FaArrowCircleRight className="h-4 w-4" />
                  </a>
                )}
              </div>
            ) : (
              invoice[field.name] || (
                <span className="text-muted-foreground italic">
                  Not provided
                </span>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      <Card>
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-lg">
                <FaFileInvoice className="text-primary h-4 w-4" />
              </div>
              <div className="ml-3">
                <h3 className="text-foreground text-base font-semibold">
                  Invoice Information
                </h3>
                <p className="text-muted-foreground text-xs">
                  {isEditing
                    ? "Edit invoice details"
                    : "View invoice information"}
                </p>
              </div>
            </div>
            {canManage && (
              <div className="flex items-center gap-3">
                <InvoiceStatusUpdate
                  onStatusChange={handleStatusChange}
                  invoiceStatus={invoice.status}
                  isLoading={isUpdatingStatus}
                />
                <Button
                  onClick={toggleEdit}
                  variant={isEditing ? "outline" : "default"}
                  size="sm"
                >
                  <FaPenSquare className="h-3 w-3 sm:mr-2 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">
                    {isEditing ? "Cancel Edit" : "Edit Invoice"}
                  </span>
                  <span className="sm:hidden">
                    {isEditing ? "Cancel" : "Edit"}
                  </span>
                </Button>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-4">
          <form onSubmit={handleSubmit(onSubmit)}>
            {/* Two-column layout */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="space-y-4">
                {leftColumnFields.map(renderField)}
              </div>
              <div className="space-y-4">
                {rightColumnFields.map(renderField)}
              </div>
            </div>

            {/* Payment Information Section - Only show if invoice is paid */}
            {invoice.status === "paid" && invoice.paymentInfo && (
              <div className="bg-primary/10 border-primary/20 mt-4 rounded-lg border p-3">
                <h3 className="text-primary mb-2 flex items-center text-sm font-semibold">
                  <FaCreditCard className="mr-2" />
                  Payment Information
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <FaCreditCard className="text-primary mr-2 h-3 w-3" />
                    <span className="text-foreground text-xs font-medium">
                      Payment Method:
                    </span>
                    <Badge variant="secondary" className="ml-2">
                      {getPaymentMethodDisplay(invoice.paymentInfo.method)}
                    </Badge>
                  </div>
                  <div className="flex items-center">
                    <FaCalendar className="text-primary mr-2 h-3 w-3" />
                    <span className="text-foreground text-xs font-medium">
                      Date Paid:
                    </span>
                    <span className="text-foreground ml-2 text-xs">
                      {formatDateToString(invoice.paymentInfo.datePaid)}
                    </span>
                  </div>
                  {paymentDuration && (
                    <div className="flex items-center">
                      <FaClock className="text-primary mr-2 h-3 w-3" />
                      <span className="text-foreground text-xs font-medium">
                        Payment Duration:
                      </span>
                      <span
                        className={`ml-2 text-xs font-semibold ${
                          paymentDuration.days !== null &&
                          paymentDuration.days <= 0
                            ? "text-primary"
                            : paymentDuration.days !== null &&
                                paymentDuration.days <= 30
                              ? "text-blue-700"
                              : "text-orange-700"
                        }`}
                      >
                        {paymentDuration.text}
                      </span>
                    </div>
                  )}
                  {invoice.paymentInfo.notes && (
                    <div className="bg-background border-border rounded-lg border p-2">
                      <span className="text-foreground text-xs font-medium">
                        Notes:
                      </span>
                      <p className="text-muted-foreground mt-1 text-xs">
                        {invoice.paymentInfo.notes}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {isEditing && (
              <div className="border-border mt-4 flex space-x-3 border-t pt-4">
                <Button type="submit" className="flex-1">
                  <FaSave className="mr-2 h-3 w-3" />
                  Save Changes
                </Button>
                <Button
                  type="button"
                  onClick={toggleEdit}
                  variant="outline"
                  className="flex-1"
                >
                  <FaTimes className="mr-2 h-3 w-3" />
                  Cancel
                </Button>
              </div>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSubmit={handlePaymentSubmit}
        isLoading={isUpdatingStatus}
      />
    </>
  );
};

const InvoiceStatusUpdate = ({
  onStatusChange,
  invoiceStatus,
  isLoading,
}: {
  onStatusChange: (status: string) => void;
  invoiceStatus: string;
  isLoading?: boolean;
}) => {
  const { register, setValue } = useForm();
  const [status, setStatus] = useState(invoiceStatus);

  const handleChange = (value: string) => {
    if (isLoading) return;

    setStatus(value);
    setValue("status", value);
    onStatusChange(value);
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "paid":
        return "default";
      case "overdue":
        return "destructive";
      default:
        return "secondary";
    }
  };

  return (
    <Select value={status} onValueChange={handleChange} disabled={isLoading}>
      <SelectTrigger className="w-32">
        <Badge variant={getStatusVariant(status)} className="capitalize">
          <SelectValue />
        </Badge>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="paid">Paid</SelectItem>
        <SelectItem value="overdue">Overdue</SelectItem>
        <SelectItem value="pending">Pending</SelectItem>
      </SelectContent>
    </Select>
  );
};

export default InlineEditInvoice;
