"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import {
  Clock3,
  ExternalLink,
  FileText,
  Loader2,
  Mail,
  MessageSquare,
  PhoneCall,
  ReceiptText,
  CalendarClock,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { getCommunicationsForContext } from "../../app/lib/communications.data";
import type {
  CommunicationItem,
  CommunicationsContextInput,
  CommunicationsContextPayload,
} from "../../app/lib/communications/types";
import { formatCommunicationDateTimeLocal } from "../../app/lib/utils/datePartsUtils";
import {
  sendCleaningReminderEmail,
  sendInvoiceDeliveryEmail,
} from "../../app/lib/actions/email.actions";
import { sendPaymentReminderEmail } from "../../app/lib/actions/reminder.actions";
import CallLogModal from "../database/CallLogModal";
import ReminderConfigModal from "../database/ReminderConfigModal";
import SendCleaningReminderDialog from "../dashboard/SendCleaningReminderDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { ScrollArea } from "../ui/scroll-area";
import { Separator } from "../ui/separator";

type UnifiedCommunicationsContext =
  | {
      type: "invoice";
      invoiceId: string;
      title?: string;
    }
  | {
      type: "jobsDueSoon";
      jobsDueSoonId: string;
      title?: string;
    };

interface UnifiedCommunicationsModalProps {
  open: boolean;
  onClose: () => void;
  context: UnifiedCommunicationsContext | null;
  hideSendInvoice?: boolean;
}

const TYPE_META: Record<
  CommunicationItem["type"],
  {
    label: string;
    dotClass: string;
    badgeClass: string;
    cardClass: string;
    Icon: LucideIcon;
  }
> = {
  call_payment: {
    label: "Call - Payment",
    dotClass: "border-blue-500/40 bg-blue-500/20 text-blue-200",
    badgeClass:
      "border-blue-500/40 bg-blue-500/15 text-blue-100 dark:text-blue-100",
    cardClass: "border-blue-500/25 bg-blue-500/5",
    Icon: PhoneCall,
  },
  call_scheduling: {
    label: "Call - Scheduling",
    dotClass: "border-emerald-500/40 bg-emerald-500/20 text-emerald-200",
    badgeClass:
      "border-emerald-500/40 bg-emerald-500/15 text-emerald-100 dark:text-emerald-100",
    cardClass: "border-emerald-500/25 bg-emerald-500/5",
    Icon: CalendarClock,
  },
  email_invoice_delivery: {
    label: "Email - Invoice Sent",
    dotClass: "border-violet-500/40 bg-violet-500/20 text-violet-200",
    badgeClass:
      "border-violet-500/40 bg-violet-500/15 text-violet-100 dark:text-violet-100",
    cardClass: "border-violet-500/25 bg-violet-500/5",
    Icon: ReceiptText,
  },
  email_cleaning_reminder: {
    label: "Email - Cleaning Reminder",
    dotClass: "border-orange-500/40 bg-orange-500/20 text-orange-200",
    badgeClass:
      "border-orange-500/40 bg-orange-500/15 text-orange-100 dark:text-orange-100",
    cardClass: "border-orange-500/25 bg-orange-500/5",
    Icon: Mail,
  },
  email_payment_reminder: {
    label: "Email - Payment Reminder",
    dotClass: "border-amber-500/40 bg-amber-500/20 text-amber-200",
    badgeClass:
      "border-amber-500/40 bg-amber-500/15 text-amber-100 dark:text-amber-100",
    cardClass: "border-amber-500/25 bg-amber-500/5",
    Icon: Mail,
  },
};

const formatDetailKey = (value: string): string => {
  return value
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .replace(/^./, (char) => char.toUpperCase());
};

const isPresent = (value: unknown): boolean => {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return true;
};

export default function UnifiedCommunicationsModal({
  open,
  onClose,
  context,
  hideSendInvoice = false,
}: UnifiedCommunicationsModalProps) {
  const router = useRouter();
  const { user } = useUser();
  const [payload, setPayload] = useState<CommunicationsContextPayload | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isCallLogOpen, setIsCallLogOpen] = useState(false);
  const [isReminderConfigOpen, setIsReminderConfigOpen] = useState(false);
  const [isCleaningReminderOpen, setIsCleaningReminderOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>(
    {},
  );
  const [isSendingInvoice, setIsSendingInvoice] = useState(false);
  const [isSendingPaymentReminder, setIsSendingPaymentReminder] =
    useState(false);
  const [isSendingCleaningReminder, setIsSendingCleaningReminder] =
    useState(false);

  const resolvedContextType =
    payload?.contextType ||
    (context?.type === "jobsDueSoon" ? "jobsDueSoon" : "invoice");
  const invoiceMongoId =
    payload?.refs.invoiceId ||
    (context?.type === "invoice" ? context.invoiceId : "");
  const canEmail = payload?.emailExists ?? false;

  const requestData = useMemo<CommunicationsContextInput | null>(() => {
    if (!context) return null;
    if (context.type === "invoice") {
      return { contextType: "invoice", invoiceId: context.invoiceId };
    }
    return {
      contextType: "jobsDueSoon",
      jobsDueSoonId: context.jobsDueSoonId,
    };
  }, [context]);

  const loadData = useCallback(async () => {
    if (!requestData) return;
    setIsLoading(true);
    try {
      const data = await getCommunicationsForContext(requestData);
      setPayload(data);
    } catch (error) {
      console.error("Failed to load communications:", error);
      toast.error("Failed to load communications");
    } finally {
      setIsLoading(false);
    }
  }, [requestData]);

  useEffect(() => {
    if (!open || !requestData) return;
    void loadData();
  }, [open, requestData, loadData]);

  const performedBy =
    user?.fullName ||
    user?.firstName ||
    user?.primaryEmailAddress?.emailAddress ||
    user?.id ||
    "user";

  const openInvoiceHref = invoiceMongoId
    ? `/invoices/${invoiceMongoId}`
    : "/dashboard";

  const toggleDetails = (itemId: string) => {
    setExpandedItems((prev) => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  const handleSendInvoice = async () => {
    if (!invoiceMongoId || isSendingInvoice) return;
    setIsSendingInvoice(true);
    try {
      const result = await sendInvoiceDeliveryEmail(
        invoiceMongoId,
        performedBy,
      );
      if (!result.success) {
        toast.error(result.error || "Failed to send invoice");
        return;
      }
      toast.success(result.message || "Invoice sent successfully");
      await loadData();
      router.refresh();
    } finally {
      setIsSendingInvoice(false);
    }
  };

  const handleSendPaymentReminder = async () => {
    if (!invoiceMongoId || isSendingPaymentReminder) return;
    setIsSendingPaymentReminder(true);
    try {
      const result = await sendPaymentReminderEmail(
        invoiceMongoId,
        performedBy,
      );
      if (!result.success) {
        toast.error(result.error || "Failed to send payment reminder");
        return;
      }
      toast.success(result.message || "Payment reminder sent");
      await loadData();
      router.refresh();
    } finally {
      setIsSendingPaymentReminder(false);
    }
  };

  const handleSendCleaningReminder = async (includeSchedulingLink: boolean) => {
    if (!payload?.jobsDueSoon || isSendingCleaningReminder) return;
    setIsSendingCleaningReminder(true);
    try {
      const result = await sendCleaningReminderEmail(
        {
          _id: payload.jobsDueSoon.jobsDueSoonId,
          clientId: payload.jobsDueSoon.clientId,
          invoiceId: payload.jobsDueSoon.invoiceId,
          jobTitle: payload.jobsDueSoon.jobTitle,
          dateDue: payload.jobsDueSoon.dateDue || new Date().toISOString(),
          isScheduled: Boolean(payload.jobsDueSoon.isScheduled),
          emailSent: Boolean(payload.jobsDueSoon.emailSent),
          emailHistory: payload.jobsDueSoon.emailHistory,
        },
        includeSchedulingLink,
        performedBy,
      );
      if (!result.success) {
        toast.error(result.error || "Failed to send cleaning reminder");
        return;
      }
      toast.success(result.message || "Cleaning reminder sent");
      await loadData();
    } finally {
      setIsSendingCleaningReminder(false);
    }
  };

  const callLogContext = useMemo(() => {
    if (!payload || !invoiceMongoId) return null;
    if (payload.contextType === "invoice") {
      return {
        type: "invoice" as const,
        id: invoiceMongoId,
        title: payload.title,
      };
    }
    return {
      type: "job" as const,
      id: invoiceMongoId,
      title: payload.title,
    };
  }, [payload, invoiceMongoId]);

  return (
    <>
      <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
        <DialogContent className="max-h-[92vh] w-full max-w-6xl! overflow-hidden p-0">
          <DialogHeader className="border-b px-6 py-4">
            <div className="flex items-start gap-3">
              <div className="space-y-1">
                <DialogTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Communications
                </DialogTitle>
                <p className="text-muted-foreground text-sm">
                  {payload?.title || context?.title || "Loading..."}
                </p>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 px-6 pt-4">
            <div className="flex flex-wrap gap-2">
              {resolvedContextType === "invoice" ? (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsCallLogOpen(true)}
                    disabled={!callLogContext}
                  >
                    <PhoneCall className="mr-2 h-4 w-4" />
                    Log Payment Call
                  </Button>
                  {!hideSendInvoice && (
                    <Button
                      size="sm"
                      onClick={handleSendInvoice}
                      disabled={isSendingInvoice || !canEmail}
                      title={
                        canEmail ? undefined : "No client email configured"
                      }
                    >
                      {isSendingInvoice ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Mail className="mr-2 h-4 w-4" />
                      )}
                      Send Invoice
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={handleSendPaymentReminder}
                    disabled={isSendingPaymentReminder || !canEmail}
                    title={canEmail ? undefined : "No client email configured"}
                  >
                    {isSendingPaymentReminder ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Mail className="mr-2 h-4 w-4" />
                    )}
                    Send Payment Reminder
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsReminderConfigOpen(true)}
                    disabled={!invoiceMongoId || !canEmail}
                    title={canEmail ? undefined : "No client email configured"}
                  >
                    <Clock3 className="mr-2 h-4 w-4" />
                    Configure Reminders
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsCallLogOpen(true)}
                    disabled={!callLogContext}
                  >
                    <PhoneCall className="mr-2 h-4 w-4" />
                    Log Scheduling Call
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setIsCleaningReminderOpen(true)}
                    disabled={!payload?.jobsDueSoon || !canEmail}
                    title={canEmail ? undefined : "No client email configured"}
                  >
                    <Mail className="mr-2 h-4 w-4" />
                    Send Cleaning Reminder
                  </Button>
                </>
              )}

              <Button size="sm" variant="ghost" asChild>
                <Link href={openInvoiceHref}>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Open Invoice
                </Link>
              </Button>
            </div>

            {!canEmail && (
              <p className="text-muted-foreground text-xs">
                Client has no configured email address. Email actions are
                disabled.
              </p>
            )}
          </div>

          <Separator />

          <ScrollArea className="max-h-[calc(92vh-210px)] px-6 pb-6">
            {isLoading ? (
              <div className="text-muted-foreground py-10 text-center text-sm">
                Loading communication timeline...
              </div>
            ) : (payload?.items.length || 0) === 0 ? (
              <div className="text-muted-foreground py-10 text-center text-sm">
                No communication events found for this record.
              </div>
            ) : (
              <div className="relative pt-4 pb-2">
                <div className="bg-border/80 absolute top-4 bottom-0 left-[13px] w-px" />
                {payload?.items.map((item) => {
                  const details = Object.entries(item.details || {}).filter(
                    ([, value]) => isPresent(value),
                  );
                  const hasDetails = details.length > 0;
                  const isExpanded = Boolean(expandedItems[item.id]);
                  const meta = TYPE_META[item.type];
                  const ItemIcon = meta.Icon;

                  return (
                    <div key={item.id} className="relative mb-4 pl-8 last:mb-0">
                      <div
                        className={`absolute top-4 left-0 flex h-7 w-7 items-center justify-center rounded-full border ${meta.dotClass}`}
                      >
                        <ItemIcon className="h-3.5 w-3.5" />
                      </div>

                      <div
                        className={`relative rounded-xl border p-4 shadow-sm ${meta.cardClass}`}
                      >
                        <div className="border-border bg-background absolute top-5 -left-1.5 h-3 w-3 rotate-45 border-t border-l" />

                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                            <Badge
                              variant="outline"
                              className={`font-medium ${meta.badgeClass}`}
                            >
                              {meta.label}
                            </Badge>
                            <span className="text-muted-foreground text-xs">
                              {formatCommunicationDateTimeLocal(item.timestamp)}
                            </span>
                          </div>
                          {item.followUpDate && (
                            <Badge
                              variant="outline"
                              className="border-primary/40 bg-primary/10 text-primary"
                            >
                              Follow-up:{" "}
                              {formatCommunicationDateTimeLocal(
                                item.followUpDate,
                              )}
                            </Badge>
                          )}
                        </div>

                        <p className="mt-2 text-base font-semibold">
                          {item.summary}
                        </p>
                        {item.actor && (
                          <p className="text-muted-foreground mt-1 text-xs">
                            By: {item.actor}
                          </p>
                        )}

                        {hasDetails && (
                          <div className="mt-3">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleDetails(item.id)}
                              className="h-7 px-2 text-xs"
                            >
                              <FileText className="mr-2 h-3.5 w-3.5" />
                              {isExpanded ? "Hide details" : "Show details"}
                            </Button>
                            {isExpanded && (
                              <div className="bg-muted/40 mt-2 space-y-1 rounded-md border p-2">
                                {details.map(([key, value]) => (
                                  <p
                                    key={`${item.id}-${key}`}
                                    className="text-xs"
                                  >
                                    <span className="font-medium">
                                      {formatDetailKey(key)}:
                                    </span>{" "}
                                    {Array.isArray(value)
                                      ? value.join(", ")
                                      : String(value)}
                                  </p>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {callLogContext && (
        <CallLogModal
          open={isCallLogOpen}
          onClose={() => {
            setIsCallLogOpen(false);
          }}
          onLogged={async () => {
            await loadData();
            router.refresh();
          }}
          context={callLogContext}
        />
      )}

      {resolvedContextType === "invoice" && invoiceMongoId && (
        <ReminderConfigModal
          isOpen={isReminderConfigOpen}
          onClose={() => {
            setIsReminderConfigOpen(false);
          }}
          invoiceId={invoiceMongoId}
          onSettingsUpdate={async () => {
            await loadData();
            router.refresh();
          }}
        />
      )}

      <SendCleaningReminderDialog
        isOpen={isCleaningReminderOpen}
        onClose={() => {
          setIsCleaningReminderOpen(false);
        }}
        onSend={handleSendCleaningReminder}
        jobTitle={payload?.jobsDueSoon?.jobTitle || payload?.title || "Job"}
        isSending={isSendingCleaningReminder}
        emailAlreadySent={Boolean(payload?.jobsDueSoon?.emailSent)}
        emailHistory={payload?.jobsDueSoon?.emailHistory || []}
      />
    </>
  );
}
