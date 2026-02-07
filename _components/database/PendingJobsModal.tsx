"use client";

import {
  useState,
  useTransition,
  useOptimistic,
  useMemo,
  useCallback,
} from "react";
import { useUser } from "@clerk/nextjs";
import {
  PendingInvoiceType,
  PaymentInfo,
  PaymentReminderSettings,
} from "../../app/lib/typeDefinitions";
import { FaSearch, FaComments } from "react-icons/fa";
import { CgUnavailable } from "react-icons/cg";
import { updateInvoice } from "../../app/lib/actions/actions";
import { toast } from "sonner";
import { formatAmount, formatDateStringUTC } from "../../app/lib/utils";
import Link from "next/link";
import PaymentModal from "../payments/PaymentModal";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { ScrollArea } from "../ui/scroll-area";
import { Badge } from "../ui/badge";
import UnifiedCommunicationsModal from "../communications/UnifiedCommunicationsModal";

interface ExtendedPendingInvoiceType extends PendingInvoiceType {
  emailExists?: boolean;
  paymentReminders?: PaymentReminderSettings;
}

interface PendingJobsModalProps {
  pendingInvoices: ExtendedPendingInvoiceType[];
  isOpen: boolean;
  onClose: () => void;
}

const PendingJobsModalContent = ({
  pendingInvoices,
  isOpen,
  onClose,
}: PendingJobsModalProps) => {
  const { user } = useUser();
  const [isPending, startTransition] = useTransition();
  const [showPaymentModal, setShowPaymentModal] = useState<string | null>(null);
  const [communicationsContext, setCommunicationsContext] = useState<{
    invoiceId: string;
    title: string;
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [optimisticInvoices, setOptimisticInvoice] = useOptimistic(
    pendingInvoices,
    (
      state,
      {
        id,
        status,
        paymentReminders,
      }: {
        id: string;
        status?: string;
        paymentReminders?: PaymentReminderSettings;
      },
    ) => {
      return state.map((invoice) => {
        if (invoice._id === id) {
          const updates: any = {};
          if (status) updates.status = status;
          if (paymentReminders) updates.paymentReminders = paymentReminders;
          return { ...invoice, ...updates };
        }
        return invoice;
      });
    },
  );

  const handleStatusChange = (invoiceId: string, newStatus: string) => {
    if (newStatus === "paid") {
      // Show payment tracking modal
      setShowPaymentModal(invoiceId);
    } else {
      // Direct status update for non-paid statuses
      updateStatus(invoiceId, newStatus);
    }
  };

  const updateStatus = (
    invoiceId: string,
    newStatus: string,
    paymentInfo?: PaymentInfo,
  ) => {
    startTransition(async () => {
      // Optimistic update
      setOptimisticInvoice({ id: invoiceId, status: newStatus });

      try {
        const performedBy =
          user?.fullName ||
          user?.firstName ||
          user?.primaryEmailAddress?.emailAddress ||
          user?.id ||
          "user";
        const updateData: any = { status: newStatus };

        // Add payment info if provided
        if (paymentInfo && newStatus === "paid") {
          updateData.paymentInfo = {
            method: paymentInfo.method,
            datePaid: paymentInfo.datePaid,
            notes: paymentInfo.notes,
          };
        }

        await updateInvoice(invoiceId, updateData, performedBy);

        toast.success("Status updated successfully!");
        setShowPaymentModal(null);
      } catch (error) {
        console.error("Error updating status:", error);
        toast.error("Error updating status!");
        // Note: useOptimistic automatically reverts if we don't return new state from server,
        // but here we depend on revalidatePath in the action to update 'pendingInvoices' prop.
        // If action fails, the prop won't change, and optimistic state will vanish next render?
        // No, optimistic state persists until a new "real" state comes in or we move away?
        // Actually, optimistic state is for the duration of the transition.
        // If the transition fails/ends, providing we get new props or just reset, it should be fine.
      }
    });
  };

  const handlePaymentSubmit = (paymentData: PaymentInfo) => {
    if (showPaymentModal) {
      updateStatus(showPaymentModal, "paid", paymentData);
    }
  };

  const getReminderStatusBadge = (invoice: ExtendedPendingInvoiceType) => {
    const reminders = invoice.paymentReminders;

    if (!invoice.emailExists) {
      return (
        <Badge
          variant="destructive"
          className="flex items-center gap-1 rounded-lg px-2 py-1"
        >
          <CgUnavailable className="h-3 w-3" />
          <span className="text-xs font-medium">No Email</span>
        </Badge>
      );
    }

    if (!reminders || !reminders.enabled || reminders.frequency === "none") {
      return (
        <Badge
          variant="secondary"
          className="flex items-center gap-1 rounded-lg px-2 py-1"
        >
          <span className="text-xs font-medium">No Auto Reminders</span>
        </Badge>
      );
    }

    const nextReminder = reminders.nextReminderDate
      ? new Date(reminders.nextReminderDate)
      : null;
    const now = new Date();
    const isOverdue = nextReminder && nextReminder < now;

    let badgeClass = "bg-primary/10 text-primary border-primary/30";
    let statusText = `Every ${reminders.frequency.replace("days", "")} days`;

    if (isOverdue) {
      badgeClass = "bg-destructive/10 text-destructive border-destructive/30";
      statusText = "Due for reminder";
    }

    return (
      <Badge
        variant="outline"
        className={`flex items-center gap-1 rounded-lg border px-2 py-1 ${badgeClass}`}
      >
        <span className="text-xs font-medium">{statusText}</span>
        {nextReminder && !isOverdue && (
          <span className="text-xs opacity-75">
            ({formatDateStringUTC(nextReminder.toISOString())})
          </span>
        )}
      </Badge>
    );
  };

  // Filter invoices based on search query
  const filteredInvoices = useMemo(() => {
    if (!searchQuery.trim()) return optimisticInvoices;
    const query = searchQuery.toLowerCase();
    return optimisticInvoices.filter(
      (invoice) =>
        invoice.jobTitle?.toLowerCase().includes(query) ||
        invoice.invoiceId?.toLowerCase().includes(query),
    );
  }, [optimisticInvoices, searchQuery]);

  // Handle modal close properly to allow animation to complete
  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        onClose();
      }
    },
    [onClose],
  );

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="max-h-[90vh] w-full max-w-7xl! overflow-hidden p-0">
          <DialogHeader className="space-y-4 p-6 pb-4">
            <DialogTitle className="text-xl font-bold">
              Pending Payments
            </DialogTitle>
            <div className="relative">
              <FaSearch className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
              <Input
                type="text"
                placeholder="Search by job title or invoice ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </DialogHeader>

          <ScrollArea className="max-h-[calc(90vh-140px)] p-6 pt-2">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredInvoices.length === 0 ? (
                <p className="text-muted-foreground col-span-full py-8 text-center">
                  {searchQuery
                    ? "No invoices match your search."
                    : "No pending payments."}
                </p>
              ) : (
                filteredInvoices.map((invoice) => {
                  const communicationsCount = Number(
                    invoice.communicationsCount || 0,
                  );
                  return (
                    <div
                      key={invoice._id as string}
                      className="bg-card h-full rounded-lg border p-5 shadow-sm transition-shadow hover:shadow-md"
                    >
                      <div className="flex flex-col gap-4">
                        <div className="flex-1 space-y-3">
                          <Link href={`/invoices/${invoice._id}`}>
                            <h3 className="text-foreground hover:text-primary line-clamp-2 text-lg font-semibold underline-offset-4 hover:underline">
                              {invoice.jobTitle}
                            </h3>
                          </Link>

                          <div className="text-foreground/80 space-y-2 text-sm">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium">Invoice ID:</span>
                              <Badge
                                variant="outline"
                                className="font-mono font-normal"
                              >
                                {invoice.invoiceId}
                              </Badge>
                            </div>
                            <p className="flex items-center space-x-2">
                              <span className="font-medium">Date:</span>
                              <span>
                                {formatDateStringUTC(invoice.dateIssued)}
                              </span>
                            </p>
                            <p className="flex items-center space-x-2">
                              <span className="font-medium">Amount:</span>
                              <span className="text-foreground font-semibold">
                                {formatAmount(
                                  invoice.amount + invoice.amount * 0.05,
                                )}
                              </span>
                            </p>
                          </div>
                        </div>

                        <div className="flex w-full flex-col space-y-3">
                          <Select
                            value={invoice.status}
                            onValueChange={(val) =>
                              handleStatusChange(invoice._id as string, val)
                            }
                            disabled={isPending}
                          >
                            <SelectTrigger
                              className={`w-full ${
                                invoice.status === "paid"
                                  ? "border-primary/30 bg-primary/10 text-primary"
                                  : invoice.status === "overdue"
                                    ? "border-destructive/30 bg-destructive/10 text-destructive"
                                    : "border-muted-foreground/30 bg-muted text-muted-foreground"
                              }`}
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="paid">Paid</SelectItem>
                              <SelectItem value="overdue">Overdue</SelectItem>
                            </SelectContent>
                          </Select>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setCommunicationsContext({
                                invoiceId: invoice._id as string,
                                title: invoice.jobTitle,
                              })
                            }
                          >
                            <FaComments className="mr-2 h-3 w-3" />
                            <span className="flex items-center gap-2">
                              Communications
                              {communicationsCount > 0 && (
                                <Badge
                                  variant="secondary"
                                  className="px-2 text-[10px]"
                                >
                                  {communicationsCount}
                                </Badge>
                              )}
                            </span>
                          </Button>

                          {/* Reminder Status Badge */}
                          <div className="flex justify-center">
                            {getReminderStatusBadge(invoice)}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={!!showPaymentModal}
        onClose={() => setShowPaymentModal(null)}
        onSubmit={handlePaymentSubmit}
        isLoading={isPending}
      />

      <UnifiedCommunicationsModal
        open={Boolean(communicationsContext)}
        onClose={() => setCommunicationsContext(null)}
        hideSendInvoice={true}
        context={
          communicationsContext
            ? {
                type: "invoice",
                invoiceId: communicationsContext.invoiceId,
                title: communicationsContext.title,
              }
            : null
        }
      />
    </>
  );
};

const PendingJobsModal = ({
  pendingInvoices,
  isOpen,
  onClose,
}: PendingJobsModalProps) => {
  return (
    <PendingJobsModalContent
      pendingInvoices={pendingInvoices}
      isOpen={isOpen}
      onClose={onClose}
    />
  );
};

export default PendingJobsModal;
