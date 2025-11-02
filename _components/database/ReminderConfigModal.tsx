"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { FaTimes, FaPaperPlane, FaHistory, FaClock } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
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
  const [activeTab, setActiveTab] = useState<"settings" | "history">(
    "settings",
  );
  useEffect(() => {
    if (isOpen && invoiceId) {
      loadReminderSettings();
    }
  }, [isOpen, invoiceId]);

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
      toast.error("Failed to load reminder settings");
    }
  };

  const handleFrequencyChange = (
    frequency: "none" | "3days" | "7days" | "14days",
  ) => {
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
        userName
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
      "Are you sure you want to send a payment reminder now? This will immediately send an email to the client."
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
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="bg-black/50 fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm"
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className="relative h-full max-h-[90vh] w-full overflow-hidden rounded-lg bg-white shadow-xl md:h-auto md:max-h-[700px] md:w-[500px]"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b bg-white p-4">
              <h2 className="text-lg font-bold text-gray-800">
                Configure Auto Reminders
              </h2>
              <button
                onClick={onClose}
                className="rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
              >
                <FaTimes size={16} />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b">
              <button
                onClick={() => setActiveTab("settings")}
                className={`flex-1 px-4 py-3 text-sm font-medium ${
                  activeTab === "settings"
                    ? "border-b-2 border-blue-500 text-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Settings
              </button>
              <button
                onClick={() => setActiveTab("history")}
                className={`flex-1 px-4 py-3 text-sm font-medium ${
                  activeTab === "history"
                    ? "border-b-2 border-blue-500 text-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                History
              </button>
            </div>

            {/* Content */}
            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              {activeTab === "settings" ? (
                <div className="space-y-6">
                  {/* Current Settings */}
                  <div>
                    <h3 className="mb-2 text-sm font-medium text-gray-700">
                      Current Setting
                    </h3>
                    <div className="rounded-lg bg-gray-50 p-3">
                      <span className="text-sm text-gray-600">
                        {settings.enabled
                          ? getFrequencyLabel(settings.frequency)
                          : "No auto reminders"}
                      </span>
                      {settings.nextReminderDate && (
                        <div className="mt-1 text-xs text-gray-500">
                          Next reminder:{" "}
                          {formatDateStringUTC(settings.nextReminderDate)}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Frequency Selection */}
                  <div>
                    <h3 className="mb-3 text-sm font-medium text-gray-700">
                      Reminder Frequency
                    </h3>
                    <div className="space-y-2">
                      {[
                        { value: "none", label: "None (default)" },
                        { value: "3days", label: "Every 3 days" },
                        { value: "7days", label: "Every 7 days" },
                        { value: "14days", label: "Every 14 days" },
                      ].map((option) => (
                        <label
                          key={option.value}
                          className="flex cursor-pointer items-center space-x-3 rounded-lg border p-3 hover:bg-gray-50"
                        >
                          <input
                            type="radio"
                            name="frequency"
                            value={option.value}
                            checked={settings.frequency === option.value}
                            onChange={(e) =>
                              handleFrequencyChange(e.target.value as any)
                            }
                            className="h-4 w-4 text-blue-600"
                          />
                          <span className="text-sm text-gray-700">
                            {option.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Manual Send Button */}
                  <div>
                    <h3 className="mb-2 text-sm font-medium text-gray-700">
                      Send Reminder Now
                    </h3>
                    <button
                      onClick={handleSendReminder}
                      disabled={isSending}
                      className="flex w-full items-center justify-center space-x-2 rounded-lg bg-blue-500 px-4 py-2 text-white transition-colors hover:bg-blue-600 disabled:opacity-50"
                    >
                      {isSending ? (
                        <FaPaperPlane className="h-4 w-4 animate-spin" />
                      ) : (
                        <FaPaperPlane className="h-4 w-4" />
                      )}
                      <span>Send Reminder Now</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-gray-700">
                    Reminder History & Audit
                  </h3>

                  {auditLogs.length === 0 ? (
                    <div className="rounded-lg border-2 border-dashed border-gray-200 p-8 text-center">
                      <FaHistory className="mx-auto h-8 w-8 text-gray-400" />
                      <p className="mt-2 text-sm text-gray-500">
                        No reminder history yet
                      </p>
                    </div>
                  ) : (
                    <div className="max-h-64 space-y-3 overflow-y-auto">
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
                            className="rounded-lg border bg-gray-50 p-3"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                  <span className="text-sm font-medium text-gray-900">
                                    {getActionLabel(log.action)}
                                  </span>
                                  {log.success ? (
                                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-600">
                                      Success
                                    </span>
                                  ) : (
                                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-600">
                                      Failed
                                    </span>
                                  )}
                                </div>
                                <div className="mt-1 text-xs text-gray-500">
                                  {formatDateStringUTC(log.timestamp)} by{" "}
                                  {log.performedBy}
                                </div>
                                {log.details?.reason && (
                                  <div className="mt-1 text-xs text-gray-600">
                                    {log.details.reason}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            {activeTab === "settings" && (
              <div className="flex items-center justify-end space-x-3 border-t bg-gray-50 p-4">
                <button
                  onClick={onClose}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveSettings}
                  disabled={isLoading}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {isLoading ? "Saving..." : "Save Settings"}
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ReminderConfigModal;
