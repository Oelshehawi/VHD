"use client";
import { FaMoneyBill } from "react-icons/fa";
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
  return (
    <>
      <div
        className="h-full space-y-2 rounded-lg bg-darkGreen p-4 text-white shadow-lg transition-all hover:scale-[1.02]"
        onClick={() => setOpen(true)}
      >
        <div className="flex items-center gap-3">
          <FaMoneyBill className="h-8 w-8 lg:h-10 lg:w-10" />
          <div className="text-lg font-bold sm:text-xl lg:text-2xl">
            Pending Amount
          </div>
        </div>
        <div className="rounded-lg bg-darkGray p-3 text-center text-2xl font-bold sm:text-3xl lg:text-4xl">
          ${amount}
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
