"use client";
import { FaDollarSign, FaClock } from "react-icons/fa";
import { PendingInvoiceType } from "../../app/lib/typeDefinitions";
import { useState } from "react";
import PendingJobsModal from "./PendingJobsModal";
import { Card, CardContent } from "../ui/card";

interface PendingAmountContainerProps {
  amount: number;
  pendingInvoices: PendingInvoiceType[];
}

const PendingAmountContainer = ({
  amount,
  pendingInvoices,
}: PendingAmountContainerProps) => {
  const [open, setOpen] = useState(false);

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <>
      <Card
        className="border-primary bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer shadow-lg transition-colors"
        onClick={() => setOpen(true)}
      >
        <CardContent className="p-2 sm:p-3">
          <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-2">
              <div className="border-primary-foreground/20 bg-primary-foreground/10 shrink-0 rounded-lg border p-1.5">
                <FaDollarSign className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <div className="min-w-0">
                <h2 className="truncate text-base font-bold sm:text-lg">
                  Pending Amount
                </h2>
                <p className="text-primary-foreground/70 truncate text-xs sm:text-sm">
                  Outstanding invoices
                </p>
              </div>
            </div>
            <div className="shrink-0 text-center sm:text-right">
              <div className="border-primary-foreground/20 bg-primary-foreground/10 rounded-lg border p-2 text-center">
                <div className="truncate text-xl font-bold sm:text-2xl">
                  {formatAmount(amount)}
                </div>
              </div>
              <div className="mt-1 flex items-center justify-center gap-1 sm:justify-end">
                <FaClock className="text-primary-foreground/70 h-3 w-3 shrink-0" />
                <span className="text-primary-foreground/70 truncate text-xs sm:text-sm">
                  {pendingInvoices.length} invoices
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {open && (
        <PendingJobsModal
          pendingInvoices={pendingInvoices}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
};

export default PendingAmountContainer;
