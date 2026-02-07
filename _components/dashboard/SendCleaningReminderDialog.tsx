"use client";

import { useState } from "react";
import { Mail, Link2, CheckCircle2 } from "lucide-react";
import { formatDateTimeStringUTC } from "../../app/lib/utils";
import { CleaningReminderEmailHistoryEntry } from "../../app/lib/typeDefinitions";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Switch } from "../ui/switch";
import { Label } from "../ui/label";

interface SendCleaningReminderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (includeSchedulingLink: boolean) => Promise<void>;
  jobTitle: string;
  isSending: boolean;
  emailAlreadySent: boolean;
  emailHistory: CleaningReminderEmailHistoryEntry[];
}

export default function SendCleaningReminderDialog({
  isOpen,
  onClose,
  onSend,
  jobTitle,
  isSending,
  emailAlreadySent,
  emailHistory,
}: SendCleaningReminderDialogProps) {
  const [includeSchedulingLink, setIncludeSchedulingLink] = useState(true);
  const toSortableTimestamp = (value: Date | string) =>
    value instanceof Date ? value.toISOString() : String(value || "");
  const sortedEmailHistory = [...(emailHistory || [])].sort((a, b) =>
    toSortableTimestamp(b.sentAt).localeCompare(toSortableTimestamp(a.sentAt)),
  );

  const handleSend = async () => {
    await onSend(includeSchedulingLink);
    onClose();
  };

  const handleClose = () => {
    // Reset to default when closing
    setIncludeSchedulingLink(true);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Send Cleaning Reminder
          </DialogTitle>
          <DialogDescription>{jobTitle}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Banner if email was already sent */}
          {emailAlreadySent && (
            <div className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-950/30">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />
              <div className="text-sm">
                <p className="font-medium text-green-800 dark:text-green-200">
                  Email Already Sent
                </p>
                <p className="text-green-700 dark:text-green-300">
                  A reminder was previously sent. You can send another if
                  needed.
                </p>
              </div>
            </div>
          )}

          {sortedEmailHistory.length > 0 && (
            <div className="space-y-2 rounded-lg border p-3">
              <p className="text-sm font-medium">Reminder Email Timeline</p>
              <div className="max-h-44 space-y-2 overflow-y-auto pr-1">
                {sortedEmailHistory.map((entry, index) => (
                  <div
                    key={`${entry.recipient}-${entry.sentAt}-${index}`}
                    className="bg-muted/50 rounded-md border p-2"
                  >
                    <p className="text-sm font-medium">
                      {formatDateTimeStringUTC(entry.sentAt)}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      To: {entry.recipient}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      Scheduling link:{" "}
                      {entry.includeSchedulingLink
                        ? "Included"
                        : "Not included"}
                    </p>
                    {entry.performedBy && (
                      <p className="text-muted-foreground text-xs">
                        Sent by: {entry.performedBy}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="flex items-center gap-3">
              <Link2 className="text-muted-foreground h-5 w-5" />
              <div className="space-y-0.5">
                <Label
                  htmlFor="scheduling-link-toggle"
                  className="text-sm font-medium"
                >
                  Include Scheduling Link
                </Label>
                <p className="text-muted-foreground text-xs">
                  Allow the client to self-schedule online
                </p>
              </div>
            </div>
            <Switch
              id="scheduling-link-toggle"
              checked={includeSchedulingLink}
              onCheckedChange={setIncludeSchedulingLink}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSending}>
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={isSending}>
            {isSending
              ? "Sending..."
              : emailAlreadySent
                ? "Send Again"
                : "Send Email"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
