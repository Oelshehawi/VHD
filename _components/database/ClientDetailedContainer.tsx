"use client";
import { useState } from "react";
import { FaPenSquare, FaArrowLeft } from "react-icons/fa";
import TransactionHistory from "./TransactionHistory";
import InlineEditClient from "./EditClientModal";
import { useRouter } from "next/navigation";
import { ClientType } from "../../app/lib/typeDefinitions";
import ClientPortalAccess from "../client-portal/ClientPortalAccess";

const ClientDetailedContainer = ({
  client,
  invoices,
}: {
  client: ClientType;
  invoices: any;
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
        <div className="flex space-x-2">
          <ClientPortalAccess
            clientId={client._id as string}
            clientName={client.clientName}
          />
          <button
            className="inline-flex items-center rounded bg-darkGreen px-4 py-2 text-white"
            onClick={toggleEdit}
          >
            <FaPenSquare className="mr-1" />
            <span>Edit</span>
          </button>
        </div>
      </div>
      <div className="-mx-2 flex flex-wrap">
        <InlineEditClient
          client={client}
          isEditing={isEditing}
          toggleEdit={toggleEdit}
        />
        <TransactionHistory invoices={invoices} />
      </div>
    </>
  );
};

export default ClientDetailedContainer;
