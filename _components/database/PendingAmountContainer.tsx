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
        className="border-primary/30 bg-primary/10 hover:bg-primary/20 cursor-pointer shadow-lg transition-colors"
        onClick={() => setOpen(true)}
      >
        <CardContent className="p-1.5 sm:p-2">
          <div className="flex min-w-0 flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-1.5">
              <div className="border-primary/20 bg-primary/20 shrink-0 rounded-lg border p-1">
                <FaDollarSign className="text-primary h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </div>
              <div className="min-w-0">
                <h2 className="text-primary-foreground truncate text-sm font-bold sm:text-base">
                  Pending Amount
                </h2>
                <p className="text-primary-foreground/70 truncate text-[10px] sm:text-xs">
                  Outstanding invoices
                </p>
              </div>
            </div>
            <div className="shrink-0 text-center sm:text-right">
              <div className="border-primary/20 bg-primary/20 rounded-md border p-1.5 text-center">
                <div className="text-primary truncate text-lg font-bold sm:text-xl">
                  {formatAmount(amount)}
                </div>
              </div>
              <div className="mt-1 flex items-center justify-center gap-1 sm:justify-end">
                <FaClock className="text-primary-foreground/70 h-3 w-3 shrink-0" />
                <span className="text-primary-foreground/70 truncate text-[10px] sm:text-xs">
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
