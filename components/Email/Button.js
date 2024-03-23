'use client';
import { useState } from 'react';
import axios from 'axios';
import { FaPaperPlane } from 'react-icons/fa';
import {toast} from 'react-hot-toast'

export function SendReminder({
  emailRecipient,
  emailSent,
  invoiceId,
}) {
  const [emailError, setEmailError] = useState(false);
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
        setEmailError(true);
        toast.error(error.response.data.error);
      } else {
        console.error('Error sending email:', error);
        toast.error('Error sending email');
      }
    }
  };

  if (emailSent || emailAlreadySent) {
    return (
      <div className='alert alert-success p-0 m-0 fw-bolder' role='alert'>
        Sent!
      </div>
    );
  }

  if (emailError) {
    return (
      <div className='alert alert-danger p-0 m-0 fw-bolder' role='alert'>
        No Email!
      </div>
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
