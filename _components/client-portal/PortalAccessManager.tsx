"use client";

import AccessLinkGenerator from "./AccessLinkGenerator";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

interface PortalAccessManagerProps {
  clientId: string;
  clientName: string;
  clientEmail?: string | null;
  portalAccessToken?: string | null;
  portalAccessTokenExpiry?: Date | string | null;
}

export default function PortalAccessManager({
  clientId,
  clientName,
  clientEmail,
  portalAccessToken,
  portalAccessTokenExpiry,
}: PortalAccessManagerProps) {
  return (
    <Card className="">
      <CardHeader>
        <CardTitle>Client Portal Access</CardTitle>
      </CardHeader>
      <CardContent>
        <AccessLinkGenerator
          clientId={clientId}
          clientName={clientName}
          defaultEmail={clientEmail}
          existingAccessToken={portalAccessToken}
          existingAccessTokenExpiry={portalAccessTokenExpiry}
        />
      </CardContent>
    </Card>
  );
}
