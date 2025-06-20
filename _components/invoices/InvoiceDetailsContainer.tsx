"use client";
import { useState } from "react";
import { FaPenSquare, FaArrowLeft, FaPrint } from "react-icons/fa";
import InlineEditInvoice from "./EditInvoiceModal";
import ClientDetails from "./ClientDetails";
import { useRouter } from "next/navigation";
import PriceBreakdown from "./PriceBreakdown";
import GeneratePDF from "../pdf/GeneratePDF";
import { ClientType, InvoiceType } from "../../app/lib/typeDefinitions";
import {
  calculateGST,
  calculateSubtotal,
  formatDateToString,
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
  const router = useRouter();

  const [isEditing, setIsEditing] = useState(false);

  const toggleEdit = () => {
    setIsEditing(!isEditing);
  };

  // Prepare invoice data for PDF generation
  const invoiceData = {
    invoiceId: invoice.invoiceId,
    dateIssued: formatDateToString(invoice.dateIssued as string),
    jobTitle: invoice.jobTitle,
    location: invoice.location,
    clientName: client.clientName,
    email: client.email,
    phoneNumber: client.phoneNumber,
    items: invoice.items.map((item: { description: any; price: any }) => ({
      description: item.description,
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

  return (
    <>
      <div className="mb-4 flex justify-between">
        <button
          className="inline-flex items-center rounded bg-gray-700 px-4 py-2 text-white hover:bg-gray-900"
          onClick={() => router.back()}
        >
          <FaArrowLeft className="lg:mr-2" />
          <span>Back</span>
        </button>
        {canManage && (
          <div className="space-x-2">
            <GeneratePDF
              pdfData={{ type: "invoice", data: invoiceData }}
              buttonText="Generate PDF"
            />
            <button
              className="mr-2 inline-flex items-center rounded bg-darkGreen px-4 py-2 text-white hover:bg-green-700"
              onClick={toggleEdit}
            >
              <FaPenSquare className="lg:mr-2" />
              <span>Edit</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 gap-2 lg:grid-cols-5">
        {/* Left side - Invoice Info & Price Breakdown */}
        <div className="space-y-4 lg:col-span-3">
          <InlineEditInvoice
            invoice={invoice}
            isEditing={isEditing}
            toggleEdit={toggleEdit}
            canManage={canManage}
          />
          {canManage && <PriceBreakdown invoice={invoice} />}
        </div>

        {/* Right side - Client Info */}
        <div className="space-y-4 lg:col-span-2">
          <ClientDetails client={client} canManage={canManage} />
        </div>
      </div>
    </>
  );
};

export default InvoiceDetailsContainer;
