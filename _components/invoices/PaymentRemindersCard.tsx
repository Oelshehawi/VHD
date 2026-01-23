"use client";

import { useState, useCallback, useMemo } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { FaPaperPlane, FaHistory } from "react-icons/fa";
import { Bell, Clock } from "lucide-react";
import {
  PaymentReminderSettings,
  AuditLogEntry,
  ClientType,
} from "../../app/lib/typeDefinitions";
import {
  configurePaymentReminders,
  getReminderAuditLogs,
  sendPaymentReminderEmail,
} from "../../app/lib/actions/reminder.actions";
import { toast } from "sonner";
import { formatDateStringUTC } from "../../app/lib/utils";
import { Card } from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Button } from "../ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import { ScrollArea } from "../ui/scroll-area";
import { Badge } from "../ui/badge";
import { Separator } from "../ui/separator";
import { Label } from "../ui/label";

interface PaymentRemindersCardProps {
  invoiceId: string;
  client?: ClientType;
  initialSettings?: PaymentReminderSettings;
}

export default function PaymentRemindersCard({
  invoiceId,
  client,
  initialSettings,
}: PaymentRemindersCardProps) {
  const { user } = useUser();
  const router = useRouter();

  // Initialize from server-provided data (no initial fetch needed)
  const [settings, setSettings] = useState<PaymentReminderSettings>(
    initialSettings || { enabled: false, frequency: "none" },
  );
  const [startFrom, setStartFrom] = useState<"today" | "dateIssued">(
    "dateIssued",
  );

  // Audit logs are lazy-loaded when history tab is clicked
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [isAuditLogsLoaded, setIsAuditLogsLoaded] = useState(false);
  const [isLoadingAuditLogs, setIsLoadingAuditLogs] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<string>("");
  const [showReminderDialog, setShowReminderDialog] = useState(false);
  const [activeTab, setActiveTab] = useState("settings");

  // Lazy-load audit logs when history tab is selected
  const loadAuditLogs = useCallback(async () => {
    if (isAuditLogsLoaded || isLoadingAuditLogs) return;

    setIsLoadingAuditLogs(true);
    try {
      const result = await getReminderAuditLogs(invoiceId);
      if (result.success) {
        setAuditLogs(result.data || []);
      }
    } catch (error) {
      console.error("Error loading audit logs:", error);
    } finally {
      setIsLoadingAuditLogs(false);
      setIsAuditLogsLoaded(true);
    }
  }, [invoiceId, isAuditLogsLoaded, isLoadingAuditLogs]);

  // Get all available client emails
  const availableEmails = useMemo(() => {
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

  const defaultEmail = useMemo(() => {
    if (availableEmails.length === 0) return "";
    return (
      availableEmails.find((email) => email.type === "Accounting")?.email ||
      availableEmails[0]?.email ||
      ""
    );
  }, [availableEmails]);

  const selectedEmailValue = useMemo(() => {
    if (!selectedEmail) return defaultEmail;
    const isValid = availableEmails.some(
      (email) => email.email === selectedEmail,
    );
    return isValid ? selectedEmail : defaultEmail;
  }, [availableEmails, defaultEmail, selectedEmail]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    // Lazy-load audit logs when switching to history tab
    if (value === "history") {
      loadAuditLogs();
    }
  };

  const handleDialogOpenChange = (open: boolean) => {
    setShowReminderDialog(open);
    if (open) {
      setSelectedEmail(selectedEmailValue || defaultEmail);
    } else {
      setSelectedEmail("");
    }
  };

  const handleFrequencyChange = (value: string) => {
    const frequency = value as "none" | "3days" | "5days" | "7days";
    setSettings((prev) => ({
      ...prev,
      enabled: frequency !== "none",
      frequency,
    }));
  };

  const handleSaveSettings = async () => {
    setIsLoading(true);
    try {
      const userName = user?.fullName || user?.firstName || "User";
      const result = await configurePaymentReminders(
        invoiceId,
        {
          enabled: settings.enabled,
          frequency: settings.frequency,
          startFrom,
        },
        userName,
      );

      if (result.success) {
        toast.success("Reminder settings updated");
        // Refresh server data to get updated settings from server
        router.refresh();
        // Invalidate audit logs cache so they reload on next view
        setIsAuditLogsLoaded(false);
      } else {
        toast.error(result.error || "Failed to update settings");
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Failed to update settings");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendReminder = async () => {
    setIsSending(true);
    try {
      const userName = user?.fullName || user?.firstName || "User";
      const recipientEmail = selectedEmailValue || defaultEmail;
      if (!recipientEmail) {
        toast.error("No recipient email found for this client");
        setIsSending(false);
        return;
      }
      const result = await sendPaymentReminderEmail(
        invoiceId,
        userName,
        recipientEmail,
      );
      if (result.success) {
        toast.success("Reminder sent successfully");
        // Refresh server data to get updated settings
        router.refresh();
        // Invalidate audit logs cache
        setIsAuditLogsLoaded(false);
        setShowReminderDialog(false);
        setSelectedEmail("");
      } else {
        toast.error(result.error || "Failed to send reminder");
      }
    } catch (error) {
      console.error("Error sending reminder:", error);
      toast.error("Failed to send reminder");
    } finally {
      setIsSending(false);
    }
  };

  const getFrequencyLabel = (frequency: string) => {
    switch (frequency) {
      case "3days":
        return "Every 3 days";
      case "5days":
        return "Every 5 days";
      case "7days":
        return "Every 7 days";
      default:
        return "None";
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case "reminder_configured":
        return "Settings Updated";
      case "reminder_sent_auto":
        return "Auto Reminder Sent";
      case "reminder_sent_manual":
        return "Manual Reminder Sent";
      case "reminder_failed":
        return "Reminder Failed";
      default:
        return action;
    }
  };

  const reminderLogs = auditLogs
    .filter((log) =>
      [
        "reminder_configured",
        "reminder_sent_auto",
        "reminder_sent_manual",
        "reminder_failed",
      ].includes(log.action),
    )
    .sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );

  return (
    <Card className="p-4 sm:p-6">
      {/* Header */}
      <div className="mb-4 flex items-center gap-3">
        <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg">
          <Bell className="text-primary h-5 w-5" aria-hidden="true" />
        </div>
        <div>
          <h3 className="text-foreground font-semibold">Payment Reminders</h3>
          <p className="text-muted-foreground text-xs">
            {settings.enabled
              ? `Auto: ${getFrequencyLabel(settings.frequency)}`
              : "No automatic reminders"}
          </p>
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="w-full"
      >
        <TabsList className="mb-4 grid w-full grid-cols-2">
          <TabsTrigger value="settings" className="text-xs">
            Settings
          </TabsTrigger>
          <TabsTrigger value="history" className="text-xs">
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="mt-0 space-y-4">
          {/* Current Status */}
          {settings.nextReminderDate && (
            <div className="bg-muted/50 flex items-center gap-2 rounded-md border p-3">
              <Clock
                className="text-muted-foreground h-4 w-4"
                aria-hidden="true"
              />
              <span className="text-sm">
                Next reminder: {formatDateStringUTC(settings.nextReminderDate)}
              </span>
            </div>
          )}

          {/* Frequency and Start From Selection - Same Row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-sm" htmlFor="reminder-frequency">
                Frequency
              </Label>
              <Select
                value={settings.frequency}
                onValueChange={handleFrequencyChange}
              >
                <SelectTrigger id="reminder-frequency">
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="3days">Every 3 days</SelectItem>
                  <SelectItem value="5days">Every 5 days</SelectItem>
                  <SelectItem value="7days">Every 7 days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm" htmlFor="reminder-start-from">
                Start From
              </Label>
              <Select
                value={startFrom}
                onValueChange={(value) =>
                  setStartFrom(value as "today" | "dateIssued")
                }
              >
                <SelectTrigger id="reminder-start-from">
                  <SelectValue placeholder="Select start" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="dateIssued">Issue Date</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <p className="text-muted-foreground text-xs">
            {startFrom === "today"
              ? "First reminder will be sent X days from now"
              : "Calculates from invoice issue date, skips past intervals"}
          </p>

          {/* Save Button */}
          <Button
            onClick={handleSaveSettings}
            disabled={isLoading}
            size="sm"
            className="w-full"
          >
            {isLoading ? "Saving…" : "Save Settings"}
          </Button>

          <Separator />

          {/* Manual Send Button */}
          <Button
            disabled={isSending || availableEmails.length === 0}
            variant="secondary"
            size="sm"
            className="w-full gap-2"
            onClick={() => setShowReminderDialog(true)}
          >
            {isSending ? (
              <FaPaperPlane
                className="h-3 w-3 animate-spin"
                aria-hidden="true"
              />
            ) : (
              <FaPaperPlane className="h-3 w-3" aria-hidden="true" />
            )}
            Send Reminder Now
          </Button>

          {/* Reminder Dialog */}
          <AlertDialog
            open={showReminderDialog}
            onOpenChange={handleDialogOpenChange}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Send Payment Reminder?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will immediately send a payment reminder email to the
                  client.
                </AlertDialogDescription>
              </AlertDialogHeader>

              {availableEmails.length > 1 && (
                <div className="px-6 pb-4">
                  <Label
                    className="mb-2 block text-sm font-medium"
                    htmlFor="email-select"
                  >
                    Select recipient email
                  </Label>
                  <Select
                    value={selectedEmailValue || ""}
                    onValueChange={setSelectedEmail}
                  >
                    <SelectTrigger id="email-select">
                      <SelectValue placeholder="Select email" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableEmails.map((emailEntry) => (
                        <SelectItem
                          key={emailEntry.email}
                          value={emailEntry.email}
                        >
                          {emailEntry.type}: {emailEntry.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-muted-foreground mt-1 text-xs">
                    Reminder will be sent to:{" "}
                    <strong>{selectedEmailValue || "Select an email"}</strong>
                  </p>
                </div>
              )}

              {availableEmails.length === 1 && (
                <div className="px-6 pb-4">
                  <p className="text-muted-foreground text-sm">
                    Reminder will be sent to: <strong>{defaultEmail}</strong>
                  </p>
                </div>
              )}

              {availableEmails.length === 0 && (
                <div className="px-6 pb-4">
                  <p className="text-muted-foreground text-sm">
                    No recipient email is available for this client.
                  </p>
                </div>
              )}

              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleSendReminder}
                  disabled={
                    isSending ||
                    availableEmails.length === 0 ||
                    !selectedEmailValue
                  }
                >
                  Send Reminder
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </TabsContent>

        <TabsContent value="history" className="mt-0">
          {isLoadingAuditLogs ? (
            <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 text-center">
              <div className="border-primary mb-2 h-6 w-6 animate-spin rounded-full border-b-2"></div>
              <p className="text-muted-foreground text-sm">Loading history…</p>
            </div>
          ) : reminderLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 text-center">
              <FaHistory
                className="text-muted-foreground/50 mb-2 h-6 w-6"
                aria-hidden="true"
              />
              <p className="text-muted-foreground text-sm">
                No reminder history yet
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[200px] w-full rounded-md border p-3">
              <div className="space-y-3">
                {reminderLogs.map((log, index) => (
                  <div
                    key={index}
                    className="flex flex-col gap-1 border-b pb-2 last:border-0 last:pb-0"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        {getActionLabel(log.action)}
                      </span>
                      <Badge
                        variant={log.success ? "secondary" : "destructive"}
                        className="px-1.5 text-[10px]"
                      >
                        {log.success ? "✓" : "✗"}
                      </Badge>
                    </div>
                    <div className="text-muted-foreground flex justify-between text-xs">
                      <span>{formatDateStringUTC(log.timestamp)}</span>
                      <span>by {log.performedBy}</span>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </TabsContent>
      </Tabs>
    </Card>
  );
}
