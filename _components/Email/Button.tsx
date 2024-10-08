'use client';
import { useState } from 'react';
import axios from 'axios';
import { FaPaperPlane, FaCheckCircle } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { CgUnavailable } from 'react-icons/cg';
import { ObjectId } from 'mongodb';
import { DueInvoiceType } from '../../app/lib/typeDefinitions';

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
  const [isLoading, setIsLoading] = useState(false);

  const sendEmail = async () => {
    try {
      setIsLoading(true);
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/invoices/sendEmail`,
        dueInvoiceData
      );
      toast.success(`Email has been sent successfully to ${emailRecipient}`);
      setEmailAlreadySent(true);
      setIsLoading(false);
    } catch (error) {
      // @ts-ignore
      if (error.response && error.response.data && error.response.data.error) {
        // @ts-ignore
        toast.error(error.response.data.error);
      } else {
        console.error('Error sending email:', error);
        toast.error('Error sending email');
      }
    }
  };

  if (emailSent || emailAlreadySent) {
    return (
      <>
        <FaCheckCircle className='h-10 w-10 block md:hidden text-green-600' />
        <div
          className='bg-green-500 rounded p-0 m-0 font-bold hidden md:block'
          role='alert'
        >
          Sent!
        </div>
      </>
    );
  }

  if (!emailExists) {
    return (
      <>
        <CgUnavailable className='h-10 w-10 block md:hidden text-red-700' />
        <div
          className='bg-red-500 rounded p-0 m-0 font-bold hidden md:block'
          role='alert'
        >
          No Email!
        </div>
      </>
    );
  }

  return (
    <div className='flex justify-center'>
      {!isLoading ? (
        <FaPaperPlane
          className={`p-1 h-10 w-10 rounded border-gray-500 border-2 hover:animate-pulse hover:cursor-pointer`}
          onClick={sendEmail}
        />
      ) : (
        <FaPaperPlane
          className={`p-1 h-10 w-10 animate-spin rounded border-gray-500 border-2`}
        />
      )}
    </div>
  );
}
