"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { Separator } from "../ui/separator";
import { Badge } from "../ui/badge";
import { ScrollArea } from "../ui/scroll-area";
import { Skeleton } from "../ui/skeleton";
import {
  InvoiceType,
  ClientType,
  RequestedTime,
} from "../../app/lib/typeDefinitions";
import {
  formatDateWithWeekdayUTC,
  formatDateStringUTC,
  formatAmount,
} from "../../app/lib/utils";
import { getClientInvoicesForScheduling } from "../../app/lib/actions/autoScheduling.actions";
import { getTechnicians } from "../../app/lib/actions/scheduleJobs.actions";
import {
  CalendarIcon,
  DocumentTextIcon,
  ClockIcon,
  CheckCircleIcon,
  MapPinIcon,
  CurrencyDollarIcon,
} from "@heroicons/react/24/outline";
import TechnicianSelect from "../schedule/TechnicianSelect";

interface SchedulingConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (
    sourceInvoiceId: string,
    assignedTechnicians: string[],
  ) => Promise<void>;
  clientId: string;
  client: ClientType;
  confirmedDate: string | Date;
  confirmedTime: RequestedTime;
  isSubmitting: boolean;
  // Pre-selected invoice from the scheduling request
  defaultInvoice?: InvoiceType;
}

// Format exact time for display
const formatTime = (time: RequestedTime): string => {
  const period = time.hour >= 12 ? "PM" : "AM";
  const displayHour = time.hour % 12 || 12;
  return `${displayHour}:${time.minute.toString().padStart(2, "0")} ${period}`;
};

export default function SchedulingConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  clientId,
  client,
  confirmedDate,
  confirmedTime,
  isSubmitting,
  defaultInvoice,
}: SchedulingConfirmDialogProps) {
  const [invoices, setInvoices] = useState<InvoiceType[]>([]);
  const [technicians, setTechnicians] = useState<
    { id: string; name: string }[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(
    defaultInvoice?._id?.toString() || null,
  );
  const {
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<{ assignedTechnicians: string[] }>({
    defaultValues: {
      assignedTechnicians: [],
    },
    mode: "onChange",
  });
  const selectedTechnicians = watch("assignedTechnicians") || [];

  // Fetch client invoices when dialog opens
  useEffect(() => {
    let isCancelled = false;

    const fetchInvoices = async () => {
      if (!isOpen || !clientId) return;
      setIsLoading(true);
      try {
        const [invoiceResult, technicianResult] = await Promise.all([
          getClientInvoicesForScheduling(clientId),
          getTechnicians(),
        ]);
        if (isCancelled) return;

        if (invoiceResult.success && invoiceResult.invoices) {
          setInvoices(invoiceResult.invoices);
          // Auto-select the first invoice if none selected
          if (invoiceResult.invoices.length > 0) {
            const firstInvoice = invoiceResult.invoices[0];
            if (firstInvoice) {
              setSelectedInvoiceId((current) =>
                current ? current : firstInvoice._id?.toString() || null,
              );
            }
          }
        } else {
          setInvoices([]);
          toast.error(invoiceResult.error || "Failed to load invoices");
        }

        if (Array.isArray(technicianResult)) {
          const normalizedTechnicians = technicianResult.map((technician) => ({
            id: technician.id,
            name: technician.name || "Unknown",
          }));
          setTechnicians(normalizedTechnicians);

          if (normalizedTechnicians.length === 1 && normalizedTechnicians[0]) {
            setValue("assignedTechnicians", [normalizedTechnicians[0].id]);
          }
        }
      } catch (error) {
        if (!isCancelled) {
          setInvoices([]);
          setTechnicians([]);
          console.error("Error fetching invoices:", error);
          toast.error("Failed to load invoice setup data");
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchInvoices();

    return () => {
      isCancelled = true;
    };
  }, [isOpen, clientId, setValue]);

  const selectedInvoice = invoices.find(
    (inv) => inv._id?.toString() === selectedInvoiceId,
  );

  // Calculate new invoice preview data
  const calculateTotal = (items: InvoiceType["items"]) => {
    const subtotal =
      items?.reduce((sum, item) => sum + (item.price || 0), 0) || 0;
    const gst = subtotal * 0.05;
    return { subtotal, gst, total: subtotal + gst };
  };

  const handleConfirm = async () => {
    if (!selectedInvoiceId) {
      toast.error("Please select an invoice to copy from");
      return;
    }
    await onConfirm(selectedInvoiceId, selectedTechnicians);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex max-h-[90vh] !max-w-7xl flex-col overflow-hidden">
        <DialogHeader className="shrink-0 pb-4">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <DocumentTextIcon className="h-6 w-6" />
            Confirm Scheduling & Create Invoice
          </DialogTitle>
          <DialogDescription className="text-base">
            Select an invoice to copy. A new invoice will be created with the
            same details for the scheduled service date.
          </DialogDescription>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 gap-6">
          {/* Left side: Invoice Selection */}
          <div className="flex min-h-0 w-1/2 flex-col">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-muted-foreground text-sm font-semibold tracking-wide uppercase">
                Select Invoice to Copy
              </h3>
              <Badge variant="secondary">{invoices.length} invoices</Badge>
            </div>

            <ScrollArea className="bg-muted/30 max-h-[60vh] min-h-0 flex-1 rounded-lg border p-2">
              {isLoading ? (
                <div className="space-y-3 p-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-20 w-full rounded-lg" />
                  ))}
                </div>
              ) : invoices.length === 0 ? (
                <div className="text-muted-foreground flex h-40 items-center justify-center">
                  No invoices found for this client
                </div>
              ) : (
                <div className="space-y-2 p-1">
                  {invoices.map((invoice) => {
                    const isSelected =
                      invoice._id?.toString() === selectedInvoiceId;
                    const totals = calculateTotal(invoice.items);

                    return (
                      <motion.div
                        key={invoice._id?.toString()}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Card
                          className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                            isSelected
                              ? "border-primary bg-primary/5 ring-primary ring-2"
                              : "hover:border-primary/50"
                          }`}
                          onClick={() =>
                            setSelectedInvoiceId(
                              invoice._id?.toString() || null,
                            )
                          }
                        >
                          <CardContent className="flex items-start gap-4 p-4">
                            <div
                              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                                isSelected
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted"
                              }`}
                            >
                              {isSelected ? (
                                <CheckCircleIcon className="h-5 w-5" />
                              ) : (
                                <DocumentTextIcon className="h-5 w-5" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <p className="text-foreground font-semibold">
                                    {invoice.invoiceId}
                                  </p>
                                  <p className="text-muted-foreground line-clamp-1 text-sm">
                                    {invoice.jobTitle}
                                  </p>
                                </div>
                                <Badge
                                  variant={
                                    invoice.status === "paid"
                                      ? "default"
                                      : invoice.status === "overdue"
                                        ? "destructive"
                                        : "secondary"
                                  }
                                  className="shrink-0"
                                >
                                  {invoice.status}
                                </Badge>
                              </div>
                              <div className="text-muted-foreground mt-2 flex items-center gap-3 text-xs">
                                <span className="flex items-center gap-1">
                                  <CalendarIcon className="h-3 w-3" />
                                  {formatDateStringUTC(
                                    new Date(invoice.dateIssued),
                                  )}
                                </span>
                                <span className="text-foreground font-medium">
                                  {formatAmount(totals.total)}
                                </span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Right side: Preview */}
          <div className="flex min-h-0 w-1/2 flex-col">
            {/* Schedule summary card */}
            <Card className="border-primary/30 from-primary/5 to-primary/10 mb-4 shrink-0 bg-gradient-to-br">
              <CardContent className="p-4">
                <h4 className="text-primary mb-3 text-xs font-semibold tracking-wide uppercase">
                  New Schedule
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="text-primary h-5 w-5" />
                    <div>
                      <p className="text-muted-foreground text-xs">Date</p>
                      <p className="font-medium">
                        {formatDateWithWeekdayUTC(confirmedDate)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <ClockIcon className="text-primary h-5 w-5" />
                    <div>
                      <p className="text-muted-foreground text-xs">Time</p>
                      <p className="font-medium">{formatTime(confirmedTime)}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="mb-4 shrink-0">
              <CardContent className="p-4">
                <h4 className="text-muted-foreground mb-3 text-xs font-semibold tracking-wide uppercase">
                  Assign Technicians (Optional)
                </h4>
                {technicians.length === 0 ? (
                  <p className="text-muted-foreground text-sm">
                    No technicians found. You can assign later from Schedule.
                  </p>
                ) : (
                  <TechnicianSelect
                    control={control}
                    name="assignedTechnicians"
                    technicians={technicians}
                    placeholder="Select technicians..."
                    error={errors.assignedTechnicians}
                    required={false}
                  />
                )}
              </CardContent>
            </Card>

            {/* New invoice preview */}
            <div className="mb-3">
              <h3 className="text-muted-foreground text-sm font-semibold tracking-wide uppercase">
                New Invoice Preview
              </h3>
            </div>

            <AnimatePresence mode="wait">
              {selectedInvoice ? (
                <motion.div
                  key={selectedInvoice._id?.toString()}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex-1 space-y-4 overflow-y-auto"
                >
                  <Card>
                    <CardContent className="space-y-4 p-4">
                      {/* Job details */}
                      <div className="space-y-3">
                        <div>
                          <p className="text-muted-foreground text-xs">
                            Job Title
                          </p>
                          <p className="font-medium">
                            {selectedInvoice.jobTitle}
                          </p>
                        </div>
                        <div className="flex items-start gap-2">
                          <MapPinIcon className="text-muted-foreground h-4 w-4 shrink-0" />
                          <div>
                            <p className="text-muted-foreground text-xs">
                              Location
                            </p>
                            <p className="text-sm">
                              {selectedInvoice.location}
                            </p>
                          </div>
                        </div>
                      </div>

                      <Separator />

                      {/* Line items */}
                      <div>
                        <p className="text-muted-foreground mb-2 text-xs font-medium">
                          Line Items
                        </p>
                        <div className="space-y-2">
                          {selectedInvoice.items?.map((item, idx) => (
                            <div
                              key={idx}
                              className="bg-muted/50 flex justify-between rounded px-3 py-2 text-sm"
                            >
                              <span className="flex-1">{item.description}</span>
                              <span className="font-medium">
                                {formatAmount(item.price)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <Separator />

                      {/* Totals */}
                      {(() => {
                        const totals = calculateTotal(selectedInvoice.items);
                        return (
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">
                                Subtotal
                              </span>
                              <span>{formatAmount(totals.subtotal)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">
                                GST (5%)
                              </span>
                              <span>{formatAmount(totals.gst)}</span>
                            </div>
                            <div className="flex items-center justify-between border-t pt-2 font-semibold">
                              <span className="flex items-center gap-1">
                                <CurrencyDollarIcon className="h-4 w-4" />
                                Total
                              </span>
                              <span className="text-lg">
                                {formatAmount(totals.total)}
                              </span>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Payment reminders badge */}
                      {selectedInvoice.paymentReminders?.enabled && (
                        <div className="flex items-center gap-2 rounded-lg bg-green-50 p-2 text-sm dark:bg-green-950/30">
                          <CheckCircleIcon className="h-4 w-4 text-green-600" />
                          <span className="text-green-700 dark:text-green-400">
                            Payment reminders will be copied (
                            {selectedInvoice.paymentReminders.frequency})
                          </span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-muted-foreground flex flex-1 items-center justify-center"
                >
                  Select an invoice to see preview
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <Separator className="my-4" />

        <DialogFooter className="shrink-0 gap-2 sm:gap-4">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isSubmitting || !selectedInvoiceId}
            className="min-w-[180px] bg-green-600 hover:bg-green-700"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Creating...
              </span>
            ) : (
              "Confirm & Create Invoice"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
