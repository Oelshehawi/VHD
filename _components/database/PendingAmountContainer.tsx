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
        className="h-full cursor-pointer space-y-2 rounded bg-darkGreen p-2 text-white shadow"
        onClick={() => setOpen(true)}
      >
        <div className="flex flex-row items-center justify-center md:justify-start">
          <FaMoneyBill className="h-6 w-6" />
          <div className="hidden p-2 text-center text-xl md:block">
            Pending Amount
          </div>
        </div>
        <div className="text-md rounded bg-darkGray p-2 text-center md:text-3xl">
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
