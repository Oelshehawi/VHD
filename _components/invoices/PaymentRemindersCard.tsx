"use client";

import { useState, useEffect } from "react";
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
import toast from "react-hot-toast";
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
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // Load settings on mount
  useEffect(() => {
    if (invoiceId) {
      loadReminderSettings();
    }
  }, [invoiceId]);

  const loadReminderSettings = async () => {
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
  };

  const handleFrequencyChange = (value: string) => {
    const frequency = value as "none" | "3days" | "5days" | "7days" | "14days";
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
    const confirmed = window.confirm(
      "Send a payment reminder email to the client now?",
    );

    if (!confirmed) return;

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
      case "14days":
        return "Every 14 days";
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

          {/* Frequency Selection */}
          <div className="space-y-2">
            <Label className="text-sm">Auto Reminder Frequency</Label>
            <Select
              value={settings.frequency}
              onValueChange={handleFrequencyChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None (disabled)</SelectItem>
                <SelectItem value="3days">Every 3 days</SelectItem>
                <SelectItem value="5days">Every 5 days</SelectItem>
                <SelectItem value="7days">Every 7 days</SelectItem>
                <SelectItem value="14days">Every 14 days</SelectItem>
              </SelectContent>
            </Select>
          </div>

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

          {/* Manual Send Button */}
          <Button
            onClick={handleSendReminder}
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
