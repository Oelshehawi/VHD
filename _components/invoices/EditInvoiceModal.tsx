// @ts-nocheck
"use client";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { updateInvoice } from "../../app/lib/actions/actions";
import { formatDateToString, calculatePaymentDuration, getPaymentMethodDisplay } from "../../app/lib/utils";
import { toast } from "react-hot-toast";
import { calculateDueDate } from "../../app/lib/utils";
import { FaArrowCircleRight, FaCreditCard, FaCalendar, FaClock, FaFileInvoice, FaMapMarkerAlt, FaSave, FaTimes } from "react-icons/fa";
import { InvoiceType, PaymentInfo } from "../../app/lib/typeDefinitions";
import PaymentModal from "../payments/PaymentModal";

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

  const {
    register,
    handleSubmit,
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
      label: "Frequency (months)",
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
  const paymentDuration = invoice.status === "paid" && invoice.paymentInfo?.datePaid
    ? calculatePaymentDuration(invoice.dateIssued, invoice.paymentInfo.datePaid)
    : null;

  const renderField = (field: any) => (
    <div key={field.name} className="space-y-1">
      <div className="flex items-center">
        <field.icon className="mr-2 h-4 w-4 text-gray-400" />
        <label className="block text-sm font-medium text-gray-700">
          {field.label}
          {field.isRequired && <span className="text-red-500 ml-1">*</span>}
        </label>
      </div>

      {isEditing ? (
        <div className="ml-6">
          {field.type === "textarea" ? (
            <textarea
              {...register(field.name, { required: field.isRequired })}
              placeholder={field.label}
              defaultValue={invoice[field.name]}
              readOnly={field.readOnly}
              rows={2}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 disabled:bg-gray-50 disabled:text-gray-500"
            />
          ) : (
            <input
              {...register(field.name, {
                required: field.isRequired,
                minLength: field.minLength as number,
                maxLength: field.maxLength as number,
              })}
              type={field.type}
              placeholder={field.label}
              defaultValue={invoice[field.name]}
              readOnly={field.readOnly}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 disabled:bg-gray-50 disabled:text-gray-500"
            />
          )}
          {errors[field.name] && errors[field.name]?.type === "required" && (
            <p className="mt-1 text-xs text-red-500">
              {field.label} is required
            </p>
          )}
        </div>
      ) : (
        <div className="ml-6">
          <div className="rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-900">
            {field.name === "dateDue" || field.name === "dateIssued" ? (
              formatDateToString(invoice[field.name])
            ) : field.name === "location" ? (
              <div className="flex items-center justify-between">
                <span>{invoice[field.name]}</span>
                {invoice[field.name] && (
                  <a
                    href={`https://www.google.com/maps/place/${encodeURI(invoice[field.name])}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-2 text-blue-500 hover:text-blue-700 transition-colors"
                    title="View on Google Maps"
                  >
                    <FaArrowCircleRight className="h-4 w-4" />
                  </a>
                )}
              </div>
            ) : (
              invoice[field.name] || (
                <span className="text-gray-400 italic">Not provided</span>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      <div className="rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
        <div className="border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100">
                <FaFileInvoice className="h-4 w-4 text-green-600" />
              </div>
              <div className="ml-3">
                <h3 className="text-base font-semibold text-gray-900">Invoice Information</h3>
                <p className="text-xs text-gray-500">
                  {isEditing ? "Edit invoice details" : "View invoice information"}
                </p>
              </div>
            </div>
            {canManage && (
              <InvoiceStatusUpdate
                onStatusChange={handleStatusChange}
                invoiceStatus={invoice.status}
                isLoading={isUpdatingStatus}
              />
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-4">
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
            <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-3">
              <h3 className="mb-2 flex items-center text-sm font-semibold text-green-800">
                <FaCreditCard className="mr-2" />
                Payment Information
              </h3>
              <div className="space-y-2">
                <div className="flex items-center">
                  <FaCreditCard className="mr-2 h-3 w-3 text-green-600" />
                  <span className="text-xs font-medium text-green-700">Payment Method:</span>
                  <span className="ml-2 inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                    {getPaymentMethodDisplay(invoice.paymentInfo.method)}
                  </span>
                </div>
                <div className="flex items-center">
                  <FaCalendar className="mr-2 h-3 w-3 text-green-600" />
                  <span className="text-xs font-medium text-green-700">Date Paid:</span>
                  <span className="ml-2 text-xs text-green-800">
                    {formatDateToString(invoice.paymentInfo.datePaid)}
                  </span>
                </div>
                {paymentDuration && (
                  <div className="flex items-center">
                    <FaClock className="mr-2 h-3 w-3 text-green-600" />
                    <span className="text-xs font-medium text-green-700">Payment Duration:</span>
                    <span className={`ml-2 text-xs font-semibold ${
                      paymentDuration.days !== null && paymentDuration.days <= 0 
                        ? "text-green-700" 
                        : paymentDuration.days !== null && paymentDuration.days <= 30 
                        ? "text-blue-700" 
                        : "text-orange-700"
                    }`}>
                      {paymentDuration.text}
                    </span>
                  </div>
                )}
                {invoice.paymentInfo.notes && (
                  <div className="rounded-lg bg-white p-2 border border-green-200">
                    <span className="text-xs font-medium text-green-700">Notes:</span>
                    <p className="mt-1 text-xs text-green-800">{invoice.paymentInfo.notes}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {isEditing && (
            <div className="mt-4 flex space-x-3 border-t border-gray-200 pt-4">
              <button
                type="submit"
                className="flex-1 inline-flex items-center justify-center rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              >
                <FaSave className="mr-2 h-3 w-3" />
                Save Changes
              </button>
              <button
                type="button"
                onClick={toggleEdit}
                className="flex-1 inline-flex items-center justify-center rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                <FaTimes className="mr-2 h-3 w-3" />
                Cancel
              </button>
            </div>
          )}
        </form>
      </div>

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
  isLoading 
}: { 
  onStatusChange: (status: string) => void, 
  invoiceStatus: string, 
  isLoading?: boolean 
}) => {
  const { register, setValue } = useForm();
  const [status, setStatus] = useState(invoiceStatus);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (isLoading) return;
    
    const selectedStatus = e.target.value;
    setStatus(selectedStatus);
    setValue("status", selectedStatus);
    onStatusChange(selectedStatus);
  };

  const getStatusStyles = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800 ring-green-600/20";
      case "overdue":
        return "bg-red-100 text-red-800 ring-red-600/20";
      default:
        return "bg-yellow-100 text-yellow-800 ring-yellow-600/20";
    }
  };

  return (
    <form className="flex items-center">
      <select
        id="status"
        {...register("status")}
        onChange={handleChange}
        disabled={isLoading}
        className={`rounded-lg border-0 px-3 py-2 text-xs font-medium ring-1 ring-inset transition-colors hover:cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${getStatusStyles(status)}`}
        defaultValue={invoiceStatus}
      >
        <option value="paid">Paid</option>
        <option value="overdue">Overdue</option>
        <option value="pending">Pending</option>
      </select>
    </form>
  );
};

export default InlineEditInvoice;
