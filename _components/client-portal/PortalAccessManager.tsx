"use client";

import AccessLinkGenerator from "./AccessLinkGenerator";

interface PortalAccessManagerProps {
  clientId: string;
  clientName: string;
}

export default function PortalAccessManager({
  clientId,
  clientName,
}: PortalAccessManagerProps) {
  return (
    <div className="rounded-lg border bg-white p-4 shadow">
      <h3 className="mb-4 text-xl font-semibold">Client Portal Access</h3>
      <AccessLinkGenerator clientId={clientId} clientName={clientName} />
    </div>
  );
} 