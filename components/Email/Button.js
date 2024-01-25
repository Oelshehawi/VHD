'use client';
import { useState } from 'react';
import axios from 'axios';
import styles from '../styles/buttonStyles.module.css';
import { FaPaperPlane } from 'react-icons/fa';

export function SendReminder({
  setToastMessage,
  setShowToast,
  emailRecipient,
  emailSent,
  invoiceId,
}) {
  const [emailError, setEmailError] = useState(false);
  const [emailAlreadySent, setEmailAlreadySent] = useState(false)

  const sendEmail = async () => {
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/invoices/sendEmail`,
        { invoiceId }
      );

      setToastMessage(`Email has been sent successfully to ${emailRecipient}`);
      setShowToast(true);
      setEmailAlreadySent(true)
    } catch (error) {
      if (error.response && error.response.data && error.response.data.error) {
        setEmailError(true);
        setToastMessage(error.response.data.error);
      } else {
        console.error('Error sending email:', error);
        setToastMessage('Error sending email');
      }
      setShowToast(true);
    }
  };

  if (emailSent || emailAlreadySent) {
    return (
      <div className="alert alert-success p-0 m-0 fw-bolder" role="alert">
        Sent!
      </div>
    );
  }

  if (emailError) {
    return (
      <div className="alert alert-danger p-0 m-0 fw-bolder" role="alert">
        No Email!
      </div>
    );
  }

  return (
    <FaPaperPlane className={`p-1 ${styles.emailButton}`} onClick={sendEmail} />
  );
}
