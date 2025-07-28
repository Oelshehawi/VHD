"use client";
import { useRouter } from "next/navigation";
import { SendReminder } from "../Email/SendEmail";
import { toast } from "react-hot-toast";
import { updateInvoiceScheduleStatus } from "../../app/lib/actions/actions";
import { formatDateStringUTC } from "../../app/lib/utils";
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
      <tr className="group transition-all duration-200 hover:bg-gray-50">
        <td
          className="cursor-pointer px-4 py-4 transition-all duration-200 hover:bg-darkGreen hover:text-white group-hover:shadow-sm"
          onClick={() => router.push(`/invoices/${invoiceData.invoiceId}`)}
        >
          <div className="flex items-center gap-2">
            {invoiceData.notesExists && (
              <div className="h-2 w-2 animate-pulse rounded-full bg-blue-500 shadow-sm"></div>
            )}
            <span className="font-medium truncate">{invoiceData.jobTitle}</span>
          </div>
        </td>
        <td className="px-4 py-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">
              {formatDateStringUTC(invoiceData.dateDue)}
            </span>
          </div>
        </td>
        <td className="hidden px-4 py-4 text-center md:table-cell">
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
              className="h-5 w-5 rounded border-gray-300 text-darkGreen transition-colors duration-200 hover:cursor-pointer focus:ring-2 focus:ring-darkGreen focus:ring-offset-2"
            />
          </form>
        </td>
        <td className="px-4 py-4 text-center align-middle">
          <SendReminder
            emailRecipient={invoiceData.jobTitle}
            emailSent={invoiceData.emailSent}
            dueInvoiceData={invoiceData}
            emailExists={invoiceData.emailExists || false}
          />
        </td>
      </tr>
    </>
  );
};

export default InvoiceRow;
