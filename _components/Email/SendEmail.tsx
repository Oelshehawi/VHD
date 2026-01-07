"use client";
import { useState } from "react";
import { FaPaperPlane, FaCheckCircle } from "react-icons/fa";
import { toast } from "sonner";
import { CgUnavailable } from "react-icons/cg";
import { DueInvoiceType } from "../../app/lib/typeDefinitions";
import { sendCleaningReminderEmail } from "../../app/lib/actions/email.actions";
import { useDebounceSubmit } from "../../app/hooks/useDebounceSubmit";

export function SendReminder({
  emailRecipient,
  emailSent,
  dueInvoiceData,
  emailExists,
}: {
  emailRecipient: string;
  emailSent: boolean;
  dueInvoiceData: DueInvoiceType;
  emailExists: boolean;
}) {
  const [emailAlreadySent, setEmailAlreadySent] = useState(false);

  const { isProcessing, debouncedSubmit } = useDebounceSubmit({
    onSubmit: async () => {
      const response = await sendCleaningReminderEmail(dueInvoiceData);
      if (!response.success) {
        throw new Error(response.error || "Failed to send email");
      }
      setEmailAlreadySent(true);
    },
    successMessage: `Email has been sent successfully to ${emailRecipient}`,
    delay: 500,
  });

  if (emailSent || emailAlreadySent) {
    return (
      <>
        <FaCheckCircle className="block h-10 w-10 text-green-600 md:hidden" />
        <div
          className="m-0 hidden rounded bg-green-500 p-0 font-bold md:block"
          role="alert"
        >
          Sent!
        </div>
      </>
    );
  }

  if (!emailExists) {
    return (
      <>
        <CgUnavailable className="block h-10 w-10 text-red-700 md:hidden" />
        <div
          className="m-0 hidden rounded bg-red-500 p-0 font-bold md:block"
          role="alert"
        >
          No Email!
        </div>
      </>
    );
  }

  return (
    <div className="flex justify-center">
      {!isProcessing ? (
        <FaPaperPlane
          className={`h-10 w-10 rounded border-2 border-gray-500 p-1 hover:animate-pulse hover:cursor-pointer`}
          onClick={() => debouncedSubmit(null)}
        />
      ) : (
        <FaPaperPlane
          className={`h-10 w-10 animate-spin rounded border-2 border-gray-500 p-1`}
        />
      )}
    </div>
  );
}
