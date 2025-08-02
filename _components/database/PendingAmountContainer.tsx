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
        className="rounded-xl bg-darkBlue p-3 sm:p-4 text-white shadow-lg border border-borderGreen transition-all hover:scale-[1.02] hover:shadow-xl cursor-pointer"
        onClick={() => setOpen(true)}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="rounded-lg bg-darkGreen/50 p-1.5 sm:p-2 border border-borderGreen">
              <FaDollarSign className="h-4 w-4 sm:h-6 sm:w-6" />
            </div>
            <div>
              <h2 className="text-base font-bold sm:text-lg">Pending Amount</h2>
              <p className="text-lightGray text-xs sm:text-sm">Outstanding invoices</p>
            </div>
          </div>
          <div className="text-center sm:text-right">
            <div className="rounded-lg bg-darkGray p-2 sm:p-3 text-center border border-borderGreen">
              <div className="text-xl font-bold sm:text-2xl">{formatAmount(amount)}</div>
            </div>
            <div className="flex items-center justify-center sm:justify-end gap-1 sm:gap-2 mt-1 sm:mt-2">
              <FaClock className="h-3 w-3 text-lightGray" />
              <span className="text-xs sm:text-sm text-lightGray">{pendingInvoices.length} invoices</span>
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
