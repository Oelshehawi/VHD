"use client";

import { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { FaPaperPlane, FaHistory } from "react-icons/fa";
import { Bell, Clock } from "lucide-react";
import {
  PaymentReminderSettings,
  AuditLogEntry,
} from "../../app/lib/typeDefinitions";
import {
  configurePaymentReminders,
  getReminderSettings,
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
  AlertDialogTrigger,
} from "../ui/alert-dialog";
import { ScrollArea } from "../ui/scroll-area";
import { Badge } from "../ui/badge";
import { Separator } from "../ui/separator";
import { Label } from "../ui/label";

interface PaymentRemindersCardProps {
  invoiceId: string;
}

export default function PaymentRemindersCard({
  invoiceId,
}: PaymentRemindersCardProps) {
  const { user } = useUser();
  const [settings, setSettings] = useState<PaymentReminderSettings>({
    enabled: false,
    frequency: "none",
  });
  const [startFrom, setStartFrom] = useState<"today" | "dateIssued">(
    "dateIssued",
  );
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  const loadReminderSettings = useCallback(async () => {
    try {
      const result = await getReminderSettings(invoiceId);
      if (result.success) {
        setSettings(
          result.data?.paymentReminders || {
            enabled: false,
            frequency: "none",
          },
        );
        setAuditLogs(result.data?.auditLogs || []);
      }
    } catch (error) {
      console.error("Error loading reminder settings:", error);
    } finally {
      setIsInitialLoading(false);
    }
  }, [invoiceId]);

  // Load settings on mount
  useEffect(() => {
    if (invoiceId) {
      loadReminderSettings();
    }
  }, [invoiceId, loadReminderSettings]);

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
        await loadReminderSettings();
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
      const result = await sendPaymentReminderEmail(invoiceId, userName);
      if (result.success) {
        toast.success("Reminder sent successfully");
        await loadReminderSettings();
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

  if (isInitialLoading) {
    return (
      <Card className="p-4 sm:p-6">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg">
            <Bell className="text-primary h-5 w-5" />
          </div>
          <div className="text-muted-foreground text-sm">
            Loading reminders...
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 sm:p-6">
      {/* Header */}
      <div className="mb-4 flex items-center gap-3">
        <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg">
          <Bell className="text-primary h-5 w-5" />
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

      <Tabs defaultValue="settings" className="w-full">
        <TabsList className="mb-4 grid w-full grid-cols-2">
          <TabsTrigger value="settings" className="text-xs">
            Settings
          </TabsTrigger>
          <TabsTrigger value="history" className="text-xs">
            History {reminderLogs.length > 0 && `(${reminderLogs.length})`}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="mt-0 space-y-4">
          {/* Current Status */}
          {settings.nextReminderDate && (
            <div className="bg-muted/50 flex items-center gap-2 rounded-md border p-3">
              <Clock className="text-muted-foreground h-4 w-4" />
              <span className="text-sm">
                Next reminder: {formatDateStringUTC(settings.nextReminderDate)}
              </span>
            </div>
          )}

          {/* Frequency and Start From Selection - Same Row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-sm">Frequency</Label>
              <Select
                value={settings.frequency}
                onValueChange={handleFrequencyChange}
              >
                <SelectTrigger>
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
              <Label className="text-sm">Start From</Label>
              <Select
                value={startFrom}
                onValueChange={(value) =>
                  setStartFrom(value as "today" | "dateIssued")
                }
              >
                <SelectTrigger>
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
            {isLoading ? "Saving..." : "Save Settings"}
          </Button>

          <Separator />

          {/* Manual Send Button with AlertDialog */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                disabled={isSending}
                variant="secondary"
                size="sm"
                className="w-full gap-2"
              >
                {isSending ? (
                  <FaPaperPlane className="h-3 w-3 animate-spin" />
                ) : (
                  <FaPaperPlane className="h-3 w-3" />
                )}
                Send Reminder Now
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Send Payment Reminder?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will immediately send a payment reminder email to the
                  client.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleSendReminder}>
                  Send Reminder
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </TabsContent>

        <TabsContent value="history" className="mt-0">
          {reminderLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 text-center">
              <FaHistory className="text-muted-foreground/50 mb-2 h-6 w-6" />
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
