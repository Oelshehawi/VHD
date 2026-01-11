"use client";
import { useState, useMemo, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { FaReceipt, FaPaperPlane } from "react-icons/fa";
import { Loader2, FileText, Settings } from "lucide-react";
import InlineEditInvoice from "./EditInvoiceModal";
import ClientDetails from "./ClientDetails";
import PriceBreakdown from "./PriceBreakdown";
import { type ReceiptData } from "../pdf/GeneratePDF";
import ReceiptModal from "./ReceiptModal";
import SendInvoiceModal from "./SendInvoiceModal";
import PaymentRemindersCard from "./PaymentRemindersCard";
import { ClientType, InvoiceType } from "../../app/lib/typeDefinitions";
import {
  calculateGST,
  calculateSubtotal,
  formatDateToString,
  getEmailForPurpose,
} from "../../app/lib/utils";
import { sendInvoiceDeliveryEmail } from "../../app/lib/actions/email.actions";
import { getReportStatusByInvoiceId } from "../../app/lib/actions/scheduleJobs.actions";
import { useDebounceSubmit } from "../../app/hooks/useDebounceSubmit";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import dynamic from "next/dynamic";

const GeneratePDF = dynamic(() => import("../pdf/GeneratePDF"), { ssr: false });

const InvoiceDetailsContainer = ({
  invoice,
  client,
  canManage,
}: {
  invoice: InvoiceType;
  client: ClientType;
  canManage: boolean;
}) => {
  const { user } = useUser();
  const [isEditing, setIsEditing] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [showBillToOverride, setShowBillToOverride] = useState(false);
  const [overrideBillTo, setOverrideBillTo] = useState<{
    name: string;
    address: string;
    phone: string;
  } | null>(null);
  const [currency, setCurrency] = useState<"CAD" | "USD">("CAD");
  const [exchangeRate, setExchangeRate] = useState<number>(1.35); // Default CAD to USD rate
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [hasSchedule, setHasSchedule] = useState(false);
  const [hasReport, setHasReport] = useState(false);
  const [isCheckingReport, setIsCheckingReport] = useState(false);

  // Check report status when modal opens
  useEffect(() => {
    if (showConfirmationModal && invoice._id) {
      setIsCheckingReport(true);
      getReportStatusByInvoiceId(invoice._id as string)
        .then((status) => {
          setHasSchedule(status.hasSchedule);
          setHasReport(status.hasReport);
        })
        .catch(() => {
          setHasSchedule(false);
          setHasReport(false);
        })
        .finally(() => setIsCheckingReport(false));
    }
  }, [showConfirmationModal, invoice._id]);

  // Email sending with debounce
  const {
    isProcessing: isSendingEmail,
    debouncedSubmit: handleSendInvoiceConfirmed,
  } = useDebounceSubmit({
    onSubmit: async ({
      recipients,
      includeReport,
    }: {
      recipients: string[];
      includeReport: boolean;
    }) => {
      const performedBy = user?.fullName || user?.firstName || "user";
      const response = await sendInvoiceDeliveryEmail(
        invoice._id as string,
        performedBy,
        recipients,
        includeReport,
      );
      if (!response.success) {
        throw new Error(response.error || "Failed to send invoice email");
      }
      // Close modal after successful send
      setShowConfirmationModal(false);
    },
    successMessage: "Invoice email sent successfully",
    delay: 500,
  });

  // Open confirmation modal instead of sending directly
  const handleSendInvoice = () => {
    setShowConfirmationModal(true);
  };

  // Handle confirmation modal cancel
  const handleCancelConfirmation = () => {
    setShowConfirmationModal(false);
  };

  const toggleEdit = () => {
    setIsEditing(!isEditing);
  };

  const openReceiptModal = () => {
    setIsReceiptModalOpen(true);
  };

  const closeReceiptModal = () => {
    setIsReceiptModalOpen(false);
  };

  // Get client email for invoice display
  const clientEmail =
    getEmailForPurpose(client, "primary") || client.email || "";

  // Calculate due date (14 days from issue date)
  const issueDate = new Date(invoice.dateIssued);
  const dueDate = new Date(issueDate);
  dueDate.setDate(dueDate.getDate() + 14);
  const formattedDueDate = dueDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Prepare invoice data for PDF generation
  const invoiceData = useMemo(() => {
    // Ensure we have valid items and they're all valid objects
    if (!invoice.items || invoice.items.length === 0) {
      return null;
    }

    // Validate all items have required properties to prevent reconciliation errors
    const hasInvalidItems = invoice.items.some(
      (item: any) =>
        !item ||
        typeof item.price === "undefined" ||
        typeof item.description === "undefined",
    );

    if (hasInvalidItems) {
      return null;
    }

    // Calculate CAD amounts first
    const subtotalCAD = calculateSubtotal(invoice.items);
    const gstCAD = calculateGST(subtotalCAD);
    const totalCAD = subtotalCAD + gstCAD;

    // If USD, convert using exchange rate
    let subtotal, gst, totalAmount, itemsWithPrices;

    if (currency === "USD") {
      // Convert CAD to USD
      subtotal = subtotalCAD / exchangeRate;
      gst = calculateGST(subtotal); // GST on USD amount
      totalAmount = subtotal + gst;

      // Convert item prices to USD
      itemsWithPrices = invoice.items.map(
        (item: { description: any; details?: any; price: any }) => ({
          description: item.description,
          details: item.details || "",
          price: item.price / exchangeRate,
          total: item.price / exchangeRate,
        }),
      );
    } else {
      // CAD - use original amounts
      subtotal = subtotalCAD;
      gst = gstCAD;
      totalAmount = totalCAD;

      itemsWithPrices = invoice.items.map(
        (item: { description: any; details?: any; price: any }) => ({
          description: item.description,
          details: item.details || "",
          price: item.price,
          total: item.price,
        }),
      );
    }

    return {
      invoiceId: invoice.invoiceId,
      dateIssued: formatDateToString(invoice.dateIssued as string),
      dateDue: formattedDueDate,
      jobTitle: invoice.jobTitle,
      location: invoice.location,
      clientName: client.clientName,
      email: clientEmail,
      phoneNumber: client.phoneNumber,
      items: itemsWithPrices,
      subtotal: subtotal,
      gst: gst,
      totalAmount: totalAmount,
      cheque: "51-11020 Williams Rd Richmond, BC V7A 1X8",
      eTransfer: "adam@vancouverventcleaning.ca",
      terms:
        "Please report any and all cleaning inquiries within 5 business days.",
      overrideBillTo: overrideBillTo,
      currency: currency,
      exchangeRate: currency === "USD" ? exchangeRate : undefined,
      // Original CAD amounts for reference
      originalCAD:
        currency === "USD"
          ? {
              subtotal: subtotalCAD,
              gst: gstCAD,
              total: totalCAD,
            }
          : undefined,
    };
  }, [
    invoice,
    client,
    clientEmail,
    formattedDueDate,
    overrideBillTo,
    currency,
    exchangeRate,
  ]);

  // Prepare receipt data for modal (without datePaid and paymentMethod)
  const receiptDataForModal: Omit<ReceiptData, "datePaid" | "paymentMethod"> = {
    receiptId: `R-${invoice.invoiceId}`, // Generate receipt ID based on invoice ID
    invoiceId: invoice.invoiceId,
    jobTitle: invoice.jobTitle,
    location: invoice.location,
    clientName: client.clientName,
    email: clientEmail,
    phoneNumber: client.phoneNumber,
    items: invoice.items.map(
      (item: { description: any; details?: any; price: any }) => ({
        description: item.description,
        details: item.details || "",
        price: item.price,
        total: item.price,
      }),
    ),
    subtotal: calculateSubtotal(invoice.items),
    gst: calculateGST(calculateSubtotal(invoice.items)),
    totalAmount:
      calculateSubtotal(invoice.items) +
      calculateGST(calculateSubtotal(invoice.items)),
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Action Bar - Only show if user can manage */}
      {canManage && (
        <Card className="p-4 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="bg-primary/10 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg sm:h-12 sm:w-12">
                <FileText className="text-primary h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div>
                <h2 className="text-foreground text-base font-semibold sm:text-lg">
                  Invoice Actions
                </h2>
                <p className="text-muted-foreground hidden text-xs sm:block sm:text-sm">
                  Generate PDFs and manage invoice details
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap sm:gap-3 sm:overflow-x-auto">
              <Button
                onClick={handleSendInvoice}
                disabled={isSendingEmail}
                size="sm"
              >
                {isSendingEmail ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <FaPaperPlane className="h-3 w-3 sm:mr-2 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Send Invoice</span>
                    <span className="sm:hidden">Send</span>
                  </>
                )}
              </Button>
              <Popover
                open={showBillToOverride}
                onOpenChange={setShowBillToOverride}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="max-w-[200px]"
                  >
                    <Settings className="h-3 w-3 shrink-0 sm:mr-2 sm:h-4 sm:w-4" />
                    <span className="hidden truncate sm:inline">
                      {overrideBillTo ? "Bill To (Custom)" : "Bill To"} -{" "}
                      {currency}
                    </span>
                    <span className="sm:hidden">{currency}</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-96 p-4" align="end">
                  <h3 className="text-foreground mb-3 text-sm font-semibold">
                    Bill To Options
                  </h3>

                  <div className="space-y-3">
                    <Button
                      onClick={() => {
                        setOverrideBillTo(null);
                        setShowBillToOverride(false);
                      }}
                      variant={!overrideBillTo ? "default" : "outline"}
                      className="w-full justify-start text-left"
                      size="sm"
                    >
                      <div>
                        <div className="font-medium">
                          Use Client Information
                        </div>
                        <div className="text-muted-foreground mt-1 text-xs">
                          {invoice.jobTitle} - {invoice.location}
                        </div>
                      </div>
                    </Button>

                    <div
                      className={`border-border rounded-lg border p-3 ${
                        overrideBillTo
                          ? "bg-primary/10 border-primary/20"
                          : "bg-background"
                      }`}
                    >
                      <div className="text-foreground mb-2 text-sm font-medium">
                        Override Bill To
                      </div>
                      <div className="space-y-2">
                        <Input
                          placeholder="Name (e.g., ESFM)"
                          value={overrideBillTo?.name || ""}
                          onChange={(e) =>
                            setOverrideBillTo({
                              name: e.target.value,
                              address: overrideBillTo?.address || "",
                              phone: overrideBillTo?.phone || "",
                            })
                          }
                        />
                        <Input
                          placeholder="Address"
                          value={overrideBillTo?.address || ""}
                          onChange={(e) =>
                            setOverrideBillTo({
                              name: overrideBillTo?.name || "",
                              address: e.target.value,
                              phone: overrideBillTo?.phone || "",
                            })
                          }
                        />
                        <Input
                          placeholder="Phone"
                          value={overrideBillTo?.phone || ""}
                          onChange={(e) =>
                            setOverrideBillTo({
                              name: overrideBillTo?.name || "",
                              address: overrideBillTo?.address || "",
                              phone: e.target.value,
                            })
                          }
                        />
                        <Button
                          onClick={() => setShowBillToOverride(false)}
                          disabled={
                            !overrideBillTo?.name || !overrideBillTo?.address
                          }
                          className="w-full"
                          size="sm"
                        >
                          Apply Custom Bill To
                        </Button>
                      </div>
                    </div>

                    <div className="border-border bg-background rounded-lg border p-3">
                      <div className="text-foreground mb-2 text-sm font-medium">
                        Invoice Currency
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => setCurrency("CAD")}
                          variant={currency === "CAD" ? "default" : "outline"}
                          className="flex-1"
                          size="sm"
                        >
                          CAD
                        </Button>
                        <Button
                          onClick={() => setCurrency("USD")}
                          variant={currency === "USD" ? "default" : "outline"}
                          className="flex-1"
                          size="sm"
                        >
                          USD
                        </Button>
                      </div>

                      {currency === "USD" && (
                        <div className="mt-3 space-y-2">
                          <Label className="text-xs">
                            Exchange Rate (CAD to USD)
                          </Label>
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground text-xs">
                              1 CAD =
                            </span>
                            <Input
                              type="number"
                              step="0.01"
                              min="0.01"
                              value={exchangeRate}
                              onChange={(e) =>
                                setExchangeRate(
                                  parseFloat(e.target.value) || 1.35,
                                )
                              }
                              placeholder="1.35"
                              className="flex-1"
                            />
                            <span className="text-muted-foreground text-xs">
                              USD
                            </span>
                          </div>
                          <p className="text-muted-foreground text-xs">
                            Current Bank of Canada rate: ~1.35 (check daily)
                          </p>
                          {(() => {
                            const subtotalCAD = calculateSubtotal(
                              invoice.items,
                            );
                            const gstCAD = calculateGST(subtotalCAD);
                            const totalCAD = subtotalCAD + gstCAD;
                            const totalUSD = totalCAD / exchangeRate;
                            return (
                              <div className="bg-primary/10 mt-2 rounded p-2 text-xs">
                                <div className="text-primary font-medium">
                                  Preview:
                                </div>
                                <div className="text-foreground">
                                  ${totalCAD.toFixed(2)} CAD = $
                                  {totalUSD.toFixed(2)} USD
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              {invoice.items && invoice.items.length > 0 && invoiceData && (
                <GeneratePDF
                  key={`invoice-${invoice._id}-${invoice.items.length}-${currency}-${overrideBillTo?.name || "default"}`}
                  pdfData={{ type: "invoice", data: invoiceData }}
                  fileName={`Invoice - ${invoice.jobTitle}.pdf`}
                  buttonText="Invoice PDF"
                  className="inline-flex items-center"
                  showScaleSelector={true}
                />
              )}
              <Button onClick={openReceiptModal} variant="secondary" size="sm">
                <FaReceipt className="h-3 w-3 sm:mr-2 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Receipt PDF</span>
                <span className="sm:hidden">Receipt</span>
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Left side - Invoice Info & Price Breakdown */}
        <div className="space-y-4 sm:space-y-6 md:col-span-2 lg:col-span-2">
          <InlineEditInvoice
            invoice={invoice}
            isEditing={isEditing}
            toggleEdit={toggleEdit}
            canManage={canManage}
          />
          {canManage && <PriceBreakdown invoice={invoice} />}
        </div>

        {/* Right side - Client Info & Reminders */}
        <div className="space-y-4 sm:space-y-6 md:col-span-2 lg:col-span-1">
          <ClientDetails client={client} canManage={canManage} />
          {canManage && (
            <PaymentRemindersCard invoiceId={invoice._id as string} />
          )}
        </div>
      </div>

      {/* Send Invoice Modal */}
      <SendInvoiceModal
        invoice={invoice}
        client={client}
        isOpen={showConfirmationModal}
        isLoading={isSendingEmail || isCheckingReport}
        hasSchedule={hasSchedule}
        hasReport={hasReport}
        onConfirm={(recipients, includeReport) => {
          handleSendInvoiceConfirmed({ recipients, includeReport });
        }}
        onCancel={handleCancelConfirmation}
      />

      {/* Receipt Modal */}
      <ReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={closeReceiptModal}
        receiptData={receiptDataForModal}
      />
    </div>
  );
};

export default InvoiceDetailsContainer;
