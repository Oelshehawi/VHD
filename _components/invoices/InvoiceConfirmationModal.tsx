"use client";

import { ClientType, InvoiceType } from "../../app/lib/typeDefinitions";
import { calculateSubtotal, calculateGST, getEmailForPurpose } from "../../app/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Loader2, Mail } from "lucide-react";

interface InvoiceConfirmationModalProps {
  invoice: InvoiceType | null;
  client: ClientType | null;
  isOpen: boolean;
  isLoading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function InvoiceConfirmationModal({
  invoice,
  client,
  isOpen,
  isLoading,
  onConfirm,
  onCancel,
}: InvoiceConfirmationModalProps) {
  if (!invoice || !client) return null;

  // Get client email (use accounting email like the actual send function does)
  const clientEmail =
    getEmailForPurpose(client, "accounting") || client.email || "";

  // Calculate amounts
  const subtotal = calculateSubtotal(invoice.items);
  const gst = calculateGST(subtotal);
  const total = subtotal + gst;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="bg-primary/10 border-primary/20 -mx-6 -mt-6 border-b px-6 py-6">
          <DialogTitle className="text-xl">Send Invoice</DialogTitle>
          <DialogDescription>
            Confirm sending invoice to client
          </DialogDescription>
        </DialogHeader>

        {/* Content */}
        <div className="space-y-6 py-4">
          {/* Invoice Details */}
          <div className="space-y-4">
            <div className="bg-muted rounded-lg p-4">
              <div className="space-y-3">
                {/* Invoice Number */}
                <div className="flex items-start justify-between">
                  <span className="text-muted-foreground text-sm font-medium">
                    Invoice Number
                  </span>
                  <span className="text-foreground text-sm font-semibold">
                    {invoice.invoiceId}
                  </span>
                </div>

                {/* Job Title */}
                <div className="flex items-start justify-between">
                  <span className="text-muted-foreground text-sm font-medium">
                    Job Title
                  </span>
                  <span className="text-foreground max-w-xs text-right text-sm font-semibold">
                    {invoice.jobTitle}
                  </span>
                </div>

                {/* Amount */}
                <div className="border-border flex items-start justify-between border-t pt-3">
                  <span className="text-muted-foreground text-sm font-medium">
                    Total Amount
                  </span>
                  <span className="text-primary text-lg font-bold">
                    ${total.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Recipient */}
            <div>
              <label className="text-foreground mb-2 block text-sm font-medium">
                Sending to
              </label>
              <div className="bg-muted border-border flex items-center gap-3 rounded-lg border px-4 py-3">
                <Mail className="text-muted-foreground h-5 w-5 shrink-0" />
                <div>
                  <p className="text-muted-foreground text-xs font-medium">
                    {client.clientName}
                  </p>
                  <p className="text-foreground truncate text-sm font-semibold">
                    {clientEmail}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Confirmation Message */}
          <div className="bg-muted border-border rounded-lg border p-4">
            <p className="text-foreground text-sm">
              This will send the invoice to <span className="font-semibold">{client.clientName}</span> at{" "}
              <span className="font-semibold">{clientEmail}</span> and create an audit log entry.
            </p>
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            onClick={onCancel}
            disabled={isLoading}
            variant="outline"
            type="button"
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isLoading}
            type="button"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Mail className="mr-2 h-4 w-4" />
                Confirm & Send
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
