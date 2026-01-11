"use client";

import { useState } from "react";
import { Archive, ArchiveRestore } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import { ClientType } from "../../app/lib/typeDefinitions";
import { archiveClient, unarchiveClient } from "../../app/lib/actions/client.actions";
import { toast } from "sonner";

interface ArchiveClientModalProps {
  client: ClientType;
  onUpdate?: () => void;
}

export default function ArchiveClientModal({
  client,
  onUpdate,
}: ArchiveClientModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [archiveReason, setArchiveReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleArchive = async () => {
    if (!archiveReason.trim()) {
      toast.error("Please provide a reason for archiving");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await archiveClient(client._id as string, archiveReason);
      if (result.success) {
        toast.success("Client archived successfully");
        setIsOpen(false);
        setArchiveReason("");
        onUpdate?.();
      } else {
        toast.error(result.error || "Failed to archive client");
      }
    } catch (error) {
      toast.error("An error occurred while archiving the client");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnarchive = async () => {
    setIsSubmitting(true);
    try {
      const result = await unarchiveClient(client._id as string);
      if (result.success) {
        toast.success("Client unarchived successfully");
        setIsOpen(false);
        onUpdate?.();
      } else {
        toast.error(result.error || "Failed to unarchive client");
      }
    } catch (error) {
      toast.error("An error occurred while unarchiving the client");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (client.isArchived) {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <ArchiveRestore className="mr-2 h-4 w-4" />
            Unarchive
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unarchive Client</DialogTitle>
            <DialogDescription>
              Are you sure you want to unarchive {client.clientName}? They will
              appear again in the clients table, invoices, and jobs due soon.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUnarchive}
              disabled={isSubmitting}
              variant="default"
            >
              {isSubmitting ? "Unarchiving..." : "Unarchive Client"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Archive className="mr-2 h-4 w-4" />
          Archive
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Archive Client</DialogTitle>
          <DialogDescription>
            Archiving {client.clientName} will hide them from the clients table,
            invoices, and jobs due soon. This action can be reversed later.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for archiving</Label>
            <Textarea
              id="reason"
              placeholder="e.g., Client no longer needs service, Business closed, etc."
              value={archiveReason}
              onChange={(e) => setArchiveReason(e.target.value)}
              disabled={isSubmitting}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleArchive}
            disabled={isSubmitting || !archiveReason.trim()}
            variant="destructive"
          >
            {isSubmitting ? "Archiving..." : "Archive Client"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
