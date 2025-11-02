"use client";
import { useState, useMemo } from "react";
import { useUser } from "@clerk/nextjs";
import {
  FaPenSquare,
  FaPrint,
  FaFileDownload,
  FaReceipt,
  FaPaperPlane,
} from "react-icons/fa";
import InlineEditInvoice from "./EditInvoiceModal";
import ClientDetails from "./ClientDetails";
import PriceBreakdown from "./PriceBreakdown";
import GeneratePDF, { type ReceiptData } from "../pdf/GeneratePDF";
import ReceiptModal from "./ReceiptModal";
import { ClientType, InvoiceType } from "../../app/lib/typeDefinitions";
import {
  calculateGST,
  calculateSubtotal,
  formatDateToString,
  getEmailForPurpose,
} from "../../app/lib/utils";
import { sendInvoiceDeliveryEmail } from "../../app/lib/actions/email.actions";
import { useDebounceSubmit } from "../../app/hooks/useDebounceSubmit";

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

  // Email sending with debounce
  const { isProcessing: isSendingEmail, debouncedSubmit: handleSendInvoice } =
    useDebounceSubmit({
      onSubmit: async () => {
        const performedBy = user?.fullName || user?.firstName || "user";
        const response = await sendInvoiceDeliveryEmail(invoice._id as string, performedBy);
        if (!response.success) {
          throw new Error(response.error || "Failed to send invoice email");
        }
      },
      successMessage: "Invoice email sent successfully",
      delay: 500,
    });

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
      (item: any) => !item || typeof item.price === 'undefined' || typeof item.description === 'undefined'
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
      itemsWithPrices = invoice.items.map((item: { description: any; details?: any; price: any }) => ({
        description: item.description,
        details: item.details || "",
        price: item.price / exchangeRate,
        total: item.price / exchangeRate,
      }));
    } else {
      // CAD - use original amounts
      subtotal = subtotalCAD;
      gst = gstCAD;
      totalAmount = totalCAD;

      itemsWithPrices = invoice.items.map((item: { description: any; details?: any; price: any }) => ({
        description: item.description,
        details: item.details || "",
        price: item.price,
        total: item.price,
      }));
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
      originalCAD: currency === "USD" ? {
        subtotal: subtotalCAD,
        gst: gstCAD,
        total: totalCAD,
      } : undefined,
    };
  }, [invoice, client, clientEmail, formattedDueDate, overrideBillTo, currency, exchangeRate]);

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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-xl bg-white p-4 sm:p-6 shadow-sm ring-1 ring-gray-200">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg bg-green-100 flex-shrink-0">
              <svg
                className="h-5 w-5 sm:h-6 sm:w-6 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c-.621 0-1.125-.504-1.125-1.125V11.25a9 9 0 00-9-9z"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-gray-900">
                Invoice Actions
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 hidden sm:block">
                Generate PDFs and manage invoice details
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <button
              onClick={handleSendInvoice}
              disabled={isSendingEmail}
              className="inline-flex items-center rounded-lg bg-purple-600 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-white transition-colors hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 touch-manipulation whitespace-nowrap"
            >
              {isSendingEmail ? (
                <>
                  <svg
                    className="-ml-1 mr-2 h-4 w-4 animate-spin text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Sending...
                </>
              ) : (
                <>
                  <FaPaperPlane className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Send Invoice</span>
                  <span className="sm:hidden">Send</span>
                </>
              )}
            </button>
            <div className="relative">
              <button
                onClick={() => setShowBillToOverride(!showBillToOverride)}
                className="inline-flex items-center rounded-lg bg-gray-500 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-white transition-colors hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 touch-manipulation whitespace-nowrap"
              >
                <svg
                  className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <span className="hidden sm:inline">Bill To {overrideBillTo ? "(Custom)" : ""} - {currency}</span>
                <span className="sm:hidden">{currency}</span>
              </button>

              {showBillToOverride && (
                <div className="ring-black fixed inset-x-4 sm:absolute sm:inset-x-auto sm:right-0 z-50 mt-2 w-auto sm:w-96 rounded-lg bg-white p-4 shadow-lg ring-1 ring-opacity-5 max-h-[80vh] overflow-y-auto">
                  <h3 className="mb-3 text-sm font-semibold text-gray-900">
                    Bill To Options
                  </h3>

                  <div className="space-y-3">
                    <button
                      onClick={() => {
                        setOverrideBillTo(null);
                        setShowBillToOverride(false);
                      }}
                      className={`w-full rounded-lg border p-3 text-left text-sm transition-colors ${
                        !overrideBillTo
                          ? "border-blue-500 bg-blue-50 text-blue-900"
                          : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <div className="font-medium">Use Client Information</div>
                      <div className="mt-1 text-xs text-gray-500">
                        {invoice.jobTitle} - {invoice.location}
                      </div>
                    </button>

                    <div
                      className={`rounded-lg border p-3 ${
                        overrideBillTo
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-300 bg-white"
                      }`}
                    >
                      <div className="mb-2 text-sm font-medium text-gray-900">
                        Override Bill To
                      </div>
                      <div className="space-y-2">
                        <input
                          type="text"
                          placeholder="Name (e.g., ESFM)"
                          value={overrideBillTo?.name || ""}
                          onChange={(e) =>
                            setOverrideBillTo({
                              name: e.target.value,
                              address: overrideBillTo?.address || "",
                              phone: overrideBillTo?.phone || "",
                            })
                          }
                          className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <input
                          type="text"
                          placeholder="Address"
                          value={overrideBillTo?.address || ""}
                          onChange={(e) =>
                            setOverrideBillTo({
                              name: overrideBillTo?.name || "",
                              address: e.target.value,
                              phone: overrideBillTo?.phone || "",
                            })
                          }
                          className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <input
                          type="text"
                          placeholder="Phone"
                          value={overrideBillTo?.phone || ""}
                          onChange={(e) =>
                            setOverrideBillTo({
                              name: overrideBillTo?.name || "",
                              address: overrideBillTo?.address || "",
                              phone: e.target.value,
                            })
                          }
                          className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <button
                          onClick={() => setShowBillToOverride(false)}
                          disabled={
                            !overrideBillTo?.name || !overrideBillTo?.address
                          }
                          className="w-full rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Apply Custom Bill To
                        </button>
                      </div>
                    </div>

                    <div className="rounded-lg border border-gray-300 bg-white p-3">
                      <div className="mb-2 text-sm font-medium text-gray-900">
                        Invoice Currency
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setCurrency("CAD")}
                          className={`flex-1 rounded px-3 py-2 text-sm font-medium transition-colors ${
                            currency === "CAD"
                              ? "bg-green-600 text-white"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
                        >
                          CAD
                        </button>
                        <button
                          onClick={() => setCurrency("USD")}
                          className={`flex-1 rounded px-3 py-2 text-sm font-medium transition-colors ${
                            currency === "USD"
                              ? "bg-green-600 text-white"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
                        >
                          USD
                        </button>
                      </div>

                      {currency === "USD" && (
                        <div className="mt-3 space-y-2">
                          <label className="text-xs font-medium text-gray-700">
                            Exchange Rate (CAD to USD)
                          </label>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">1 CAD =</span>
                            <input
                              type="number"
                              step="0.01"
                              min="0.01"
                              value={exchangeRate}
                              onChange={(e) => setExchangeRate(parseFloat(e.target.value) || 1.35)}
                              className="flex-1 rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                              placeholder="1.35"
                            />
                            <span className="text-xs text-gray-500">USD</span>
                          </div>
                          <p className="text-xs text-gray-500">
                            Current Bank of Canada rate: ~1.35 (check daily)
                          </p>
                          {(() => {
                            const subtotalCAD = calculateSubtotal(invoice.items);
                            const gstCAD = calculateGST(subtotalCAD);
                            const totalCAD = subtotalCAD + gstCAD;
                            const totalUSD = totalCAD / exchangeRate;
                            return (
                              <div className="mt-2 rounded bg-blue-50 p-2 text-xs">
                                <div className="font-medium text-blue-900">Preview:</div>
                                <div className="text-blue-700">
                                  ${totalCAD.toFixed(2)} CAD = ${totalUSD.toFixed(2)} USD
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {invoice.items && invoice.items.length > 0 && invoiceData && (
              <GeneratePDF
                key={`invoice-${invoice._id}-${invoice.items.length}-${currency}-${overrideBillTo?.name || 'default'}`}
                pdfData={{ type: "invoice", data: invoiceData }}
                fileName={`Invoice - ${invoice.jobTitle}.pdf`}
                buttonText="Invoice PDF"
                className="inline-flex items-center rounded-lg bg-blue-600 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 touch-manipulation whitespace-nowrap"
                showScaleSelector={true}
              />
            )}
            <button
              onClick={openReceiptModal}
              className="inline-flex items-center rounded-lg bg-green-600 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-white transition-colors hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 touch-manipulation whitespace-nowrap"
            >
              <FaReceipt className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
              <span className="hidden sm:inline">Receipt PDF</span>
              <span className="sm:hidden">Receipt</span>
            </button>
            <button
              onClick={toggleEdit}
              className="inline-flex items-center rounded-lg bg-gray-600 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-white transition-colors hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 touch-manipulation whitespace-nowrap"
            >
              <FaPenSquare className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
              <span className="hidden sm:inline">{isEditing ? "Cancel Edit" : "Edit Invoice"}</span>
              <span className="sm:hidden">{isEditing ? "Cancel" : "Edit"}</span>
            </button>
          </div>
        </div>
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

        {/* Right side - Client Info */}
        <div className="space-y-4 sm:space-y-6 md:col-span-2 lg:col-span-1">
          <ClientDetails client={client} canManage={canManage} />
        </div>
      </div>

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
