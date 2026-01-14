"use client";

import { useState, useEffect, useCallback } from "react";
import { ClientType, InvoiceType } from "../../app/lib/typeDefinitions";
import { calculateSubtotal, calculateGST } from "../../app/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Checkbox } from "../ui/checkbox";
import {
  Loader2,
  Mail,
  Plus,
  X,
  AlertTriangle,
  FileText,
  Calendar,
} from "lucide-react";

interface SendInvoiceModalProps {
  invoice: InvoiceType | null;
  client: ClientType | null;
  isOpen: boolean;
  isLoading: boolean;
  hasSchedule: boolean;
  hasReport: boolean;
  onConfirm: (recipients: string[], includeReport: boolean) => void;
  onCancel: () => void;
}

export default function SendInvoiceModal({
  invoice,
  client,
  isOpen,
  isLoading,
  hasSchedule,
  hasReport,
  onConfirm,
  onCancel,
}: SendInvoiceModalProps) {
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [additionalRecipients, setAdditionalRecipients] = useState<string[]>(
    [],
  );
  const [newRecipient, setNewRecipient] = useState("");
  const [emailError, setEmailError] = useState("");
  const [includeReport, setIncludeReport] = useState(false);

  // Get all available client emails
  const getAvailableEmails = useCallback(() => {
    const emails: { type: string; email: string }[] = [];
    if (client) {
      if (client.emails) {
        if (client.emails.primary)
          emails.push({ type: "Primary", email: client.emails.primary });
        if (
          client.emails.accounting &&
          client.emails.accounting !== client.emails.primary
        ) {
          emails.push({ type: "Accounting", email: client.emails.accounting });
        }
        if (
          client.emails.scheduling &&
          client.emails.scheduling !== client.emails.primary &&
          client.emails.scheduling !== client.emails.accounting
        ) {
          emails.push({ type: "Scheduling", email: client.emails.scheduling });
        }
      } else if (client.email) {
        emails.push({ type: "Primary", email: client.email });
      }
    }
    return emails;
  }, [client]);

  const availableEmails = client ? getAvailableEmails() : [];

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen && client) {
      const emails = getAvailableEmails();
      // Default to first email (accounting or primary)
      const defaultEmail =
        emails.find((e) => e.type === "Accounting")?.email || emails[0]?.email;

      // Use setTimeout to avoid synchronous setState in effect
      setTimeout(() => {
        setSelectedEmails(defaultEmail ? [defaultEmail] : []);
        setAdditionalRecipients([]);
        setNewRecipient("");
        setEmailError("");
        setIncludeReport(false);
      }, 0);
    }
  }, [isOpen, client, getAvailableEmails]);

  if (!invoice || !client) return null;

  // Calculate amounts
  const subtotal = calculateSubtotal(invoice.items);
  const gst = calculateGST(subtotal);
  const total = subtotal + gst;

  // Validate email format
  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  // Add recipient
  const handleAddRecipient = () => {
    const email = newRecipient.trim().toLowerCase();

    if (!email) {
      setEmailError("Please enter an email address");
      return;
    }

    if (!isValidEmail(email)) {
      setEmailError("Please enter a valid email address");
      return;
    }

    if (selectedEmails.includes(email)) {
      setEmailError("This email is already selected");
      return;
    }

    if (additionalRecipients.includes(email)) {
      setEmailError("This email has already been added");
      return;
    }

    setAdditionalRecipients([...additionalRecipients, email]);
    setNewRecipient("");
    setEmailError("");
  };

  // Remove recipient
  const handleRemoveRecipient = (email: string) => {
    setAdditionalRecipients(additionalRecipients.filter((r) => r !== email));
  };

  // Handle form submit
  const handleConfirm = () => {
    const allRecipients = [...selectedEmails, ...additionalRecipients];
    onConfirm(allRecipients, includeReport);
  };

  // Handle key press in input
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddRecipient();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="bg-primary/10 border-primary/20 -mx-6 -mt-6 border-b px-6 py-6">
          <DialogTitle className="text-xl">Send Invoice</DialogTitle>
          <DialogDescription>
            Send invoice to one or more recipients
          </DialogDescription>
        </DialogHeader>

        {/* Content */}
        <div className="space-y-6 py-4">
          {/* Status Warnings */}
          {!hasSchedule && (
            <div className="bg-muted border-border text-muted-foreground flex items-start gap-3 rounded-lg border p-4">
              <Calendar className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <p className="text-sm font-medium">No Job Scheduled</p>
                <p className="mt-1 text-xs opacity-80">
                  There is no job scheduled for this invoice. Schedule a job
                  first, complete the work, then send the invoice.
                </p>
              </div>
            </div>
          )}

          {hasSchedule && !hasReport && (
            <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <p className="text-sm font-medium">Report Not Completed</p>
                <p className="mt-1 text-xs opacity-80">
                  The cleaning report for this job has not been completed. You
                  must complete the report before sending the invoice.
                </p>
              </div>
            </div>
          )}

          {/* Invoice Details */}
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

          {/* Primary Recipient */}
          <div>
            <Label className="text-foreground mb-2 block text-sm font-medium">
              Select Recipients
            </Label>
            <div className="space-y-2">
              {availableEmails.map((emailEntry) => (
                <div
                  key={emailEntry.email}
                  className="bg-muted/50 border-border flex items-center gap-3 rounded-lg border px-4 py-3"
                >
                  <Checkbox
                    id={`email-${emailEntry.type}`}
                    checked={selectedEmails.includes(emailEntry.email)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedEmails([
                          ...selectedEmails,
                          emailEntry.email,
                        ]);
                      } else {
                        setSelectedEmails(
                          selectedEmails.filter((e) => e !== emailEntry.email),
                        );
                      }
                    }}
                  />
                  <div className="flex-1">
                    <p className="text-muted-foreground text-xs font-medium">
                      {emailEntry.type}
                    </p>
                    <p className="text-foreground truncate text-sm font-semibold">
                      {emailEntry.email}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Additional Recipients */}
          <div>
            <Label className="text-foreground mb-2 block text-sm font-medium">
              Additional Recipients (optional)
            </Label>
            <p className="text-muted-foreground mb-3 text-xs">
              Add other email addresses to receive this invoice
            </p>

            {/* Added Recipients */}
            {additionalRecipients.length > 0 && (
              <div className="mb-3 space-y-2">
                {additionalRecipients.map((email) => (
                  <div
                    key={email}
                    className="bg-muted/50 border-border flex items-center justify-between gap-2 rounded-lg border px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <Mail className="text-muted-foreground h-4 w-4" />
                      <span className="text-foreground text-sm">{email}</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => handleRemoveRecipient(email)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Add Recipient Input */}
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  type="email"
                  placeholder="Enter email address"
                  value={newRecipient}
                  onChange={(e) => {
                    setNewRecipient(e.target.value);
                    setEmailError("");
                  }}
                  onKeyDown={handleKeyPress}
                  className={emailError ? "border-destructive" : ""}
                />
                {emailError && (
                  <p className="text-destructive mt-1 text-xs">{emailError}</p>
                )}
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleAddRecipient}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Include Report Option */}
          {hasReport && (
            <div className="bg-muted/50 rounded-lg border p-4">
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="includeReport"
                  checked={includeReport}
                  onCheckedChange={(checked) =>
                    setIncludeReport(checked as boolean)
                  }
                />
                <div className="flex items-center gap-2">
                  <FileText className="text-muted-foreground h-4 w-4" />
                  <Label
                    htmlFor="includeReport"
                    className="cursor-pointer text-sm font-normal"
                  >
                    Also send cleaning report with invoice
                  </Label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="gap-2">
          <Button
            onClick={onCancel}
            disabled={isLoading}
            variant="outline"
            type="button"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={
              isLoading ||
              !hasSchedule ||
              !hasReport ||
              selectedEmails.length + additionalRecipients.length === 0
            }
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
                Send Invoice
                {selectedEmails.length + additionalRecipients.length > 1
                  ? ` to ${selectedEmails.length + additionalRecipients.length} recipients`
                  : ""}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
