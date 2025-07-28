"use client";
import { FaDollarSign, FaClock, FaExclamationTriangle } from "react-icons/fa";
import { PendingInvoiceType } from "../../app/lib/typeDefinitions";
import { useState } from "react";
import PendingJobsModal from "./PendingJobsModal";

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
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <>
      <div
        className="rounded-xl bg-darkBlue p-4 text-white shadow-lg border border-borderGreen transition-all hover:scale-[1.02] hover:shadow-xl cursor-pointer"
        onClick={() => setOpen(true)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-darkGreen/50 p-2 border border-borderGreen">
              <FaDollarSign className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Pending Amount</h2>
              <p className="text-lightGray text-sm">Outstanding invoices</p>
            </div>
          </div>
          <div className="text-right">
            <div className="rounded-lg bg-darkGray p-3 text-center border border-borderGreen">
              <div className="text-2xl font-bold">{formatAmount(amount)}</div>
            </div>
            <div className="flex items-center justify-end gap-2 mt-2">
              <FaClock className="h-3 w-3 text-lightGray" />
              <span className="text-sm text-lightGray">{pendingInvoices.length} invoices</span>
            </div>
          </div>
        </div>
      </div>

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
