"use client";

import { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { FaPaperPlane, FaHistory } from "react-icons/fa";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
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

interface ReminderConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoiceId: string;
  onSettingsUpdate: (
    invoiceId: string,
    settings: PaymentReminderSettings,
  ) => void;
}

const ReminderConfigModal = ({
  isOpen,
  onClose,
  invoiceId,
  onSettingsUpdate,
}: ReminderConfigModalProps) => {
  const { user } = useUser();
  const [settings, setSettings] = useState<PaymentReminderSettings>({
    enabled: false,
    frequency: "none",
  });
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);

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
      toast.error("Failed to load reminder settings");
    }
  }, [invoiceId]);

  // Reload settings when modal opens
  useEffect(() => {
    if (isOpen && invoiceId) {
      loadReminderSettings();
    }
  }, [isOpen, invoiceId, loadReminderSettings]);

  const handleFrequencyChange = (value: string) => {
    const frequency = value as "none" | "3days" | "7days" | "14days";
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
        onSettingsUpdate(invoiceId, settings);
        toast.success("Reminder settings updated successfully");
        await loadReminderSettings(); // Reload to get updated audit logs
      } else {
        toast.error(result.error || "Failed to update settings");
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Failed to update reminder settings");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendReminder = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to send a payment reminder now? This will immediately send an email to the client.",
    );

    if (!confirmed) {
      return;
    }

    setIsSending(true);
    try {
      const userName = user?.fullName || user?.firstName || "User";
      const result = await sendPaymentReminderEmail(invoiceId, userName);
      if (result.success) {
        toast.success(result.message || "Reminder sent successfully");
        await loadReminderSettings(); // Reload to get updated history
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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Configure Auto Reminders</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="settings" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="settings" className="space-y-6 pt-4">
            {/* Current Settings */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Current Setting
              </label>
              <div className="bg-muted/50 rounded-md border p-3">
                <span className="text-sm font-medium">
                  {settings.enabled
                    ? getFrequencyLabel(settings.frequency)
                    : "No auto reminders"}
                </span>
                {settings.nextReminderDate && (
                  <div className="text-muted-foreground mt-1 text-xs">
                    Next reminder:{" "}
                    {formatDateStringUTC(settings.nextReminderDate)}
                  </div>
                )}
              </div>
            </div>

            {/* Frequency Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Reminder Frequency
              </label>
              <Select
                value={settings.frequency}
                onValueChange={handleFrequencyChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None (default)</SelectItem>
                  <SelectItem value="3days">Every 3 days</SelectItem>
                  <SelectItem value="7days">Every 7 days</SelectItem>
                  <SelectItem value="14days">Every 14 days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Save Button */}
            <Button
              onClick={handleSaveSettings}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? "Saving..." : "Save Settings"}
            </Button>

            <Separator />

            {/* Manual Send Button */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Send Reminder Now
              </label>
              <Button
                onClick={handleSendReminder}
                disabled={isSending}
                variant="secondary"
                className="w-full gap-2"
              >
                {isSending ? (
                  <FaPaperPlane className="h-4 w-4 animate-spin" />
                ) : (
                  <FaPaperPlane className="h-4 w-4" />
                )}
                <span>Send Reminder Now</span>
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="history" className="pt-4">
            <h3 className="mb-4 text-sm font-medium text-gray-700">
              Reminder History & Audit
            </h3>

            {auditLogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center">
                <FaHistory className="text-muted-foreground/50 mb-2 h-8 w-8" />
                <p className="text-muted-foreground text-sm">
                  No reminder history yet
                </p>
              </div>
            ) : (
              <ScrollArea className="h-[300px] w-full rounded-md border p-4">
                <div className="space-y-4">
                  {auditLogs
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
                        new Date(b.timestamp).getTime() -
                        new Date(a.timestamp).getTime(),
                    )
                    .map((log, index) => (
                      <div
                        key={index}
                        className="flex flex-col gap-1 border-b pb-3 last:border-0 last:pb-0"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            {getActionLabel(log.action)}
                          </span>
                          <Badge
                            variant={log.success ? "secondary" : "destructive"}
                            className="bg-opacity-10 px-2 text-[10px]"
                          >
                            {log.success ? "Success" : "Failed"}
                          </Badge>
                        </div>
                        <div className="text-muted-foreground flex justify-between text-xs">
                          <span>{formatDateStringUTC(log.timestamp)}</span>
                          <span>by {log.performedBy}</span>
                        </div>
                        {log.details?.reason && (
                          <p className="text-muted-foreground/80 text-xs">
                            {log.details.reason}
                          </p>
                        )}
                      </div>
                    ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default ReminderConfigModal;
