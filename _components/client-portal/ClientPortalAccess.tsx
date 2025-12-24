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
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          onClick={() => setIsModalOpen(true)}
          variant="default"
          size="sm"
          className="text-xs sm:text-sm"
        >
          <span className="hidden sm:inline">Client Portal Access</span>
          <span className="sm:hidden">Portal Access</span>
        </Button>

        <Button
          type="button"
          onClick={handleViewAsClient}
          variant="default"
          size="sm"
          className="bg-primary text-xs sm:text-sm"
        >
          <span className="hidden sm:inline">View Client Portal</span>
          <span className="sm:hidden">View Portal</span>
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
