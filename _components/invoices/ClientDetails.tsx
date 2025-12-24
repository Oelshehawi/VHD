"use client";

import Link from "next/link";
import { Phone, Mail, User, ExternalLink } from "lucide-react";
import { ClientType } from "../../app/lib/typeDefinitions";
import { getEmailForPurpose } from "../../app/lib/utils";
import { Card, CardContent, CardHeader } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";

const ClientDetails = ({
  client,
  canManage,
}: {
  client: ClientType;
  canManage: boolean;
}) => {
  // Get the primary email or fallback to the old email field
  const primaryEmail =
    getEmailForPurpose(client, "primary") || client.email || "";
  const accountingEmail = getEmailForPurpose(client, "accounting");
  const schedulingEmail = getEmailForPurpose(client, "scheduling");

  return (
    <Card>
      <CardHeader className="border-b">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-lg">
            <User className="text-primary h-4 w-4" />
          </div>
          <h3 className="text-foreground text-base font-semibold">
            Client Information
          </h3>
        </div>
      </CardHeader>

      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Client Name */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <User className="text-muted-foreground h-4 w-4" />
              <div>
                <p className="text-muted-foreground text-xs font-medium">
                  Client Name
                </p>
                <p className="text-foreground text-sm font-semibold">
                  {client.clientName}
                </p>
              </div>
            </div>
            {canManage && (
              <Button variant="outline" size="sm" asChild>
                <Link href={`/database/${client._id}`}>
                  <span className="mr-1">View Details</span>
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </Button>
            )}
          </div>

          {/* Primary Email */}
          <div className="flex items-center gap-3">
            <Mail className="text-muted-foreground h-4 w-4" />
            <div>
              <p className="text-muted-foreground text-xs font-medium">
                Primary Email
              </p>
              <a
                href={`mailto:${primaryEmail}`}
                className="text-primary text-sm transition-colors hover:underline"
              >
                {primaryEmail}
              </a>
            </div>
          </div>

          {/* Accounting Email - Always show if different from primary */}
          {accountingEmail && accountingEmail !== primaryEmail && (
            <div className="flex items-center gap-3">
              <Mail className="text-muted-foreground h-4 w-4" />
              <div className="flex-1">
                <div className="mb-1 flex items-center gap-2">
                  <p className="text-muted-foreground text-xs font-medium">
                    Accounting Email
                  </p>
                  <Badge variant="secondary" className="text-xs">
                    Billing
                  </Badge>
                </div>
                <a
                  href={`mailto:${accountingEmail}`}
                  className="text-primary text-sm transition-colors hover:underline"
                >
                  {accountingEmail}
                </a>
              </div>
            </div>
          )}

          {/* Scheduling Email - Only show if different from both primary and accounting */}
          {schedulingEmail &&
            schedulingEmail !== primaryEmail &&
            schedulingEmail !== accountingEmail && (
              <div className="flex items-center gap-3">
                <Mail className="text-muted-foreground h-4 w-4" />
                <div className="flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <p className="text-muted-foreground text-xs font-medium">
                      Scheduling Email
                    </p>
                    <Badge variant="outline" className="text-xs">
                      Scheduling
                    </Badge>
                  </div>
                  <a
                    href={`mailto:${schedulingEmail}`}
                    className="text-primary text-sm transition-colors hover:underline"
                  >
                    {schedulingEmail}
                  </a>
                </div>
              </div>
            )}

          {/* Phone Number */}
          <div className="flex items-center gap-3">
            <Phone className="text-muted-foreground h-4 w-4" />
            <div>
              <p className="text-muted-foreground text-xs font-medium">
                Phone Number
              </p>
              <a
                href={`tel:${client.phoneNumber}`}
                className="text-primary text-sm transition-colors hover:underline"
              >
                {client.phoneNumber}
              </a>
            </div>
          </div>

          {/* Notes */}
          {client.notes && (
            <div className="border-t pt-4">
              <p className="text-muted-foreground mb-2 text-xs font-medium">
                Notes
              </p>
              <p className="text-muted-foreground bg-muted rounded-lg p-2 text-xs">
                {client.notes}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ClientDetails;
