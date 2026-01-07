"use client";
import { useState } from "react";
import TransactionHistory from "./TransactionHistory";
import InlineEditClient from "./EditClientModal";
import ArchiveClientModal from "./ArchiveClientModal";
import ArchivedBanner from "../ui/archived-banner";
import { ClientType } from "../../app/lib/typeDefinitions";
import ClientPortalAccess from "../client-portal/ClientPortalAccess";
import { Card, CardContent } from "../ui/card";
import { User } from "lucide-react";

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
      {/* Archived Banner */}
      {client.isArchived && (
        <ArchivedBanner
          entity="client"
          archiveReason={client.archiveReason}
          archivedAt={client.archivedAt}
        />
      )}
      
      {/* Action Bar */}
      <Card className="">
        <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex items-center space-x-4">
            <div className="bg-primary/10 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg sm:h-12 sm:w-12">
              <User className="text-primary h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div>
              <h2 className="text-foreground text-base font-semibold sm:text-lg">
                Client Management
              </h2>
              <p className="text-muted-foreground text-xs sm:text-sm">
                Manage client information and portal access
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ArchiveClientModal client={client} />
            <ClientPortalAccess
              clientId={client._id as string}
              clientName={client.clientName}
            />
          </div>
        </CardContent>
      </Card>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Client Information - 2/3 width */}
        <div className="lg:col-span-2">
          <InlineEditClient
            client={client}
            isEditing={isEditing}
            toggleEdit={toggleEdit}
          />
        </div>

        {/* Transaction History - 1/3 width */}
        <div className="lg:col-span-1">
          <TransactionHistory invoices={invoices} />
        </div>
      </div>
    </div>
  );
};

export default ClientDetailedContainer;
