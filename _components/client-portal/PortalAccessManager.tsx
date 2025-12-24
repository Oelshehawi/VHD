"use client";

import AccessLinkGenerator from "./AccessLinkGenerator";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

interface PortalAccessManagerProps {
  clientId: string;
  clientName: string;
}

export default function PortalAccessManager({
  clientId,
  clientName,
}: PortalAccessManagerProps) {
  return (
    <Card className="">
      <CardHeader>
        <CardTitle>Client Portal Access</CardTitle>
      </CardHeader>
      <CardContent>
        <AccessLinkGenerator clientId={clientId} clientName={clientName} />
      </CardContent>
    </Card>
  );
}
