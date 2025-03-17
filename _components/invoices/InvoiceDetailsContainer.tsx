"use client";
import { useState } from "react";
import { FaPenSquare, FaArrowLeft, FaPrint } from "react-icons/fa";
import InlineEditInvoice from "./EditInvoiceModal";
import ClientDetails from "./ClientDetails";
import { useRouter } from "next/navigation";
import PriceBreakdown from "./PriceBreakdown";
import GeneratePDF from "./GeneratePDF";
import { ClientType, InvoiceType } from "../../app/lib/typeDefinitions";

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
              invoiceId={invoice._id as string}
              jobTitle={invoice.jobTitle}
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
