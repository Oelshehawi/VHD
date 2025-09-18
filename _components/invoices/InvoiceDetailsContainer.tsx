"use client";
import { useState } from "react";
import { FaPenSquare, FaPrint, FaFileDownload, FaReceipt } from "react-icons/fa";
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

const InvoiceDetailsContainer = ({
  invoice,
  client,
  canManage,
}: {
  invoice: InvoiceType;
  client: ClientType;
  canManage: boolean;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

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
  const clientEmail = getEmailForPurpose(client, "primary") || client.email || "";

  // Prepare invoice data for PDF generation
  const invoiceData = {
    invoiceId: invoice.invoiceId,
    dateIssued: formatDateToString(invoice.dateIssued as string),
    jobTitle: invoice.jobTitle,
    location: invoice.location,
    clientName: client.clientName,
    email: clientEmail,
    phoneNumber: client.phoneNumber,
    items: invoice.items.map((item: { description: any; details?: any; price: any }) => ({
      description: item.description,
      details: item.details || "",
      price: item.price,
      total: item.price,
    })),
    subtotal: calculateSubtotal(invoice.items),
    gst: calculateGST(calculateSubtotal(invoice.items)),
    totalAmount:
      calculateSubtotal(invoice.items) +
      calculateGST(calculateSubtotal(invoice.items)),
    cheque: "51-11020 Williams Rd Richmond, BC V7A 1X8",
    eTransfer: "adam@vancouverventcleaning.ca",
    terms:
      "Please report any and all cleaning inquiries within 5 business days.",
  };

  // Prepare receipt data for modal (without datePaid and paymentMethod)
  const receiptDataForModal: Omit<ReceiptData, "datePaid" | "paymentMethod"> = {
    receiptId: `R-${invoice.invoiceId}`, // Generate receipt ID based on invoice ID
    invoiceId: invoice.invoiceId,
    jobTitle: invoice.jobTitle,
    location: invoice.location,
    clientName: client.clientName,
    email: clientEmail,
    phoneNumber: client.phoneNumber,
    items: invoice.items.map((item: { description: any; details?: any; price: any }) => ({
      description: item.description,
      details: item.details || "",
      price: item.price,
      total: item.price,
    })),
    subtotal: calculateSubtotal(invoice.items),
    gst: calculateGST(calculateSubtotal(invoice.items)),
    totalAmount:
      calculateSubtotal(invoice.items) +
      calculateGST(calculateSubtotal(invoice.items)),
  };

  return (
    <div className="space-y-6">
      {/* Action Bar - Only show if user can manage */}
      {canManage && (
        <div className="flex items-center justify-between rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
          <div className="flex items-center space-x-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c-.621 0-1.125-.504-1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Invoice Actions</h2>
              <p className="text-sm text-gray-500">Generate PDFs and manage invoice details</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <GeneratePDF
              pdfData={{ type: "invoice", data: invoiceData }}
              fileName={`Invoice - ${invoice.jobTitle}.pdf`}
              buttonText="Invoice PDF"
              className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            />
            <button
              onClick={openReceiptModal}
              className="inline-flex items-center rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              <FaReceipt className="mr-2 h-4 w-4" />
              <span>Receipt PDF</span>
            </button>
            <button
              onClick={toggleEdit}
              className="inline-flex items-center rounded-lg bg-gray-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              <FaPenSquare className="mr-2 h-4 w-4" />
              <span>{isEditing ? 'Cancel Edit' : 'Edit Invoice'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left side - Invoice Info & Price Breakdown */}
        <div className="space-y-6 lg:col-span-2">
          <InlineEditInvoice
            invoice={invoice}
            isEditing={isEditing}
            toggleEdit={toggleEdit}
            canManage={canManage}
          />
          {canManage && <PriceBreakdown invoice={invoice} />}
        </div>

        {/* Right side - Client Info */}
        <div className="space-y-6 lg:col-span-1">
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
