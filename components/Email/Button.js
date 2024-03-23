'use client';
import { useState } from 'react';
import axios from 'axios';
import { FaPaperPlane, FaCheckCircle } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { CgUnavailable } from 'react-icons/cg';

export function SendReminder({
  emailRecipient,
  emailSent,
  invoiceId,
  emailExists,
}) {
  const [emailAlreadySent, setEmailAlreadySent] = useState(false);

  const sendEmail = async () => {
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/invoices/sendEmail`,
        { invoiceId }
      );

      toast.success(`Email has been sent successfully to ${emailRecipient}`);
      setEmailAlreadySent(true);
    } catch (error) {
      if (error.response && error.response.data && error.response.data.error) {
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
          className='alert alert-success p-0 m-0 fw-bolder hidden md:block'
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
          className='alert alert-danger p-0 m-0 fw-bolder hidden md:block'
          role='alert'
        >
          No Email!
        </div>
      </>
    );
  }

  return (
    <div className='flex justify-center'>
      <FaPaperPlane
        className={`p-1 h-10 w-10 rounded border-gray-500 border-2 hover:animate-pulse hover:cursor-pointer`}
        onClick={sendEmail}
      />
    </div>
  );
}
