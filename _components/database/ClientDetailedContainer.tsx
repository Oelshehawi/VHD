"use client";
import { useState } from "react";
import { FaPenSquare } from "react-icons/fa";
import TransactionHistory from "./TransactionHistory";
import InlineEditClient from "./EditClientModal";
import { ClientType } from "../../app/lib/typeDefinitions";
import ClientPortalAccess from "../client-portal/ClientPortalAccess";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
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
      {/* Action Bar */}
      <Card>
        <CardContent className="flex items-center justify-between p-6">
          <div className="flex items-center space-x-4">
            <div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-lg">
              <User className="text-primary h-6 w-6" />
            </div>
            <div>
              <h2 className="text-foreground text-lg font-semibold">
                Client Management
              </h2>
              <p className="text-muted-foreground text-sm">
                Manage client information and portal access
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <ClientPortalAccess
              clientId={client._id as string}
              clientName={client.clientName}
            />
            <Button
              onClick={toggleEdit}
              variant={isEditing ? "outline" : "default"}
            >
              <FaPenSquare className="mr-2 h-4 w-4" />
              {isEditing ? "Cancel Edit" : "Edit Client"}
            </Button>
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
