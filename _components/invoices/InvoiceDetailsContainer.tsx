"use client";
import { useState } from "react";
import { FaPenSquare, FaArrowLeft, FaPrint } from "react-icons/fa";
import InlineEditInvoice from "./EditInvoiceModal";
import ClientDetails from "./ClientDetails";
import { useRouter } from "next/navigation";
import PriceBreakdown from "./PriceBreakdown";
import GeneratePDF from "./GeneratePDF";
import { formatDateToString } from "../../app/lib/utils";
import { ClientType, InvoiceType } from "../../app/lib/typeDefinitions";

const InvoiceDetailsContainer = ({
  invoice,
  client,
}: {
  invoice: InvoiceType;
  client: ClientType;
}) => {
  const router = useRouter();

  const [isEditing, setIsEditing] = useState(false);

  const toggleEdit = () => {
    setIsEditing(!isEditing);
  };

  const calculateSubtotal = (items: any[]) =>
    items.reduce((acc, item) => acc + item.price, 0);

  const calculateGST = (subtotal: number) => subtotal * 0.05;

  const invoiceData = {
    invoiceId: invoice.invoiceId,
    dateIssued: formatDateToString(invoice.dateIssued),
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
    cheque: "51-11020 Williams Rd",
    eTransfer: "adam@vancouverventcleaning.ca",
    terms:
      "Please report any and all cleaning inquiries within 5 business days.",
    thankYou: "Thank you for choosing Vancouver Hood Doctors!",
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
        <div className="space-x-2">
          <GeneratePDF invoiceData={invoiceData} />
          <button
            className="mr-2 inline-flex items-center rounded bg-darkGreen px-4 py-2 text-white hover:bg-green-700"
            onClick={toggleEdit}
          >
            <FaPenSquare className="lg:mr-2" />
            <span>Edit</span>
          </button>
        </div>
      </div>
      <div className="-mx-2 flex flex-wrap text-sm lg:flex-nowrap lg:text-[1rem]">
        <InlineEditInvoice
          invoice={invoice}
          isEditing={isEditing}
          toggleEdit={toggleEdit}
        />
        <ClientDetails client={client} />
      </div>
      <PriceBreakdown invoice={invoice} />
    </>
  );
};

export default InvoiceDetailsContainer;
