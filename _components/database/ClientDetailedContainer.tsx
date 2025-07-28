"use client";
import { useState } from "react";
import { FaPenSquare } from "react-icons/fa";
import TransactionHistory from "./TransactionHistory";
import InlineEditClient from "./EditClientModal";
import { ClientType } from "../../app/lib/typeDefinitions";
import ClientPortalAccess from "../client-portal/ClientPortalAccess";

const ClientDetailedContainer = ({
  client,
  invoices,
}: {
  client: ClientType;
  invoices: any;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const toggleEdit = () => {
    setIsEditing(!isEditing);
  };

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex items-center justify-between rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
        <div className="flex items-center space-x-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
            <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Client Management</h2>
            <p className="text-sm text-gray-500">Manage client information and portal access</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <ClientPortalAccess
            clientId={client._id as string}
            clientName={client.clientName}
          />
          <button
            onClick={toggleEdit}
            className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <FaPenSquare className="mr-2 h-4 w-4" />
            {isEditing ? 'Cancel Edit' : 'Edit Client'}
          </button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Client Information */}
        <div className="space-y-6">
          <InlineEditClient
            client={client}
            isEditing={isEditing}
            toggleEdit={toggleEdit}
          />
        </div>

        {/* Transaction History */}
        <div className="space-y-6">
          <TransactionHistory invoices={invoices} />
        </div>
      </div>
    </div>
  );
};

export default ClientDetailedContainer;
