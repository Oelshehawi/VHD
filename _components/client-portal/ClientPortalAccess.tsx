"use client";

import { useState } from "react";
import PortalAccessManager from "./PortalAccessManager";
import { useRouter } from "next/navigation";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";

interface ClientPortalAccessProps {
  clientId: string;
  clientName: string;
}

export default function ClientPortalAccess({
  clientId,
  clientName,
}: ClientPortalAccessProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  const handleViewAsClient = () => {
    router.push(`/client-portal/dashboard?clientId=${clientId}`);
  };

  return (
    <>
      <div className="flex space-x-2">
        <Button
          type="button"
          onClick={() => setIsModalOpen(true)}
          variant="default"
        >
          Client Portal Access
        </Button>

        <Button
          type="button"
          onClick={handleViewAsClient}
          variant="default"
          className="bg-primary"
        >
          View Client Portal
        </Button>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Client Portal Access for {clientName}</DialogTitle>
            <DialogDescription>
              Manage portal access settings and generate access links
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <PortalAccessManager clientId={clientId} clientName={clientName} />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
