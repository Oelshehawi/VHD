"use client";
import { useRouter } from "next/navigation";
import { SendReminder } from "../Email/Button";
import { toast } from "react-hot-toast";
import { updateInvoiceScheduleStatus } from "../../app/lib/actions/actions";
import { formatDate } from "../../app/lib/utils";
import { DueInvoiceType } from "../../app/lib/typeDefinitions";

const InvoiceRow = ({ invoiceData }: { invoiceData: DueInvoiceType }) => {
  const router = useRouter();

  const handleCheckInvoice: React.ChangeEventHandler<HTMLInputElement> = async (
    e,
  ) => {
    try {
      e.currentTarget.form?.requestSubmit();
      toast.success("Invoice Schedule Status updated successfully");
    } catch (error) {
      console.error("Error updating invoice:", error);
      toast.error("Failed to update invoice status due to an error");
    }
  };

  return (
    <>
      <tr className="hover:bg-gray-100">
        <td
          className=" cursor-pointer border-b border-gray-200 px-3 py-4 hover:bg-darkGreen hover:text-white"
          onClick={() => router.push(`/invoices/${invoiceData.invoiceId}`)}
        >
          {invoiceData.notesExists ? (
            <div className="relative left-0 top-0 size-3 animate-pulse rounded-full bg-blue-400 "></div>
          ) : (
            ""
          )}
          {invoiceData.jobTitle}
        </td>
        <td className="border-b border-gray-200 px-3 py-4">
          {formatDate(invoiceData.dateDue.toString().split("T")[0])}
        </td>
        <td className="hidden border-b border-gray-200 px-3 py-4 text-center md:table-cell">
          <form
            action={updateInvoiceScheduleStatus.bind(
              null,
              invoiceData.invoiceId,
            )}
          >
            <input
              type="checkbox"
              name="isScheduled"
              onChange={handleCheckInvoice}
              className="h-6 w-6 hover:cursor-pointer"
            />
          </form>
        </td>
        <td className="border-b border-gray-200 px-3 py-4 text-center align-middle">
          <SendReminder
            emailRecipient={invoiceData.jobTitle}
            emailSent={invoiceData.emailSent}
            dueInvoiceData={invoiceData}
            emailExists={invoiceData.emailExists}
          />
        </td>
      </tr>
    </>
  );
};

export default InvoiceRow;
