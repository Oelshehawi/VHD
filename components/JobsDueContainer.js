'use client'
import { useState, useEffect } from 'react';
import { Col, Row, Table, Form, Toast, ToastContainer } from 'react-bootstrap';
import styles from './styles/jobsDue.module.css';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { SendReminder } from './Email/Button';

const JobsDueContainer = () => {
  const router = useRouter();

  const [dueInvoices, setDueInvoices] = useState([]);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const fetchDueInvoices = async () => {
    try {
      const invoicesRes = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/invoices/checkDue`
      );
      const updatedInvoices = invoicesRes.data.map((inv) => ({
        ...inv,
        isChecked: inv.isScheduled,
      }));
      setDueInvoices(updatedInvoices);
    } catch (error) {
      console.error('Error fetching due invoices:', error);
    }
  };

  useEffect(() => {
    fetchDueInvoices();
  }, []);

  const redirectToInvoiceDetails = (invoiceId) => {
    router.push(`/invoices/invoiceDetailed?id=${invoiceId}`);
  };

  const handleCheckInvoice = async (invoiceId, isScheduled) => {
    const updatedInvoices = dueInvoices.map((invoice) =>
      invoice.invoiceId === invoiceId
        ? { ...invoice, isChecked: isScheduled }
        : invoice
    );

    setDueInvoices(updatedInvoices);
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/invoices/checkDue`, {
        invoiceId,
        isScheduled,
      });

      fetchDueInvoices();
    } catch (error) {
      console.error('Error updating invoice:', error);
    } finally {
      setShowToast(true);
      setToastMessage('Job Has Been Scheduled!')
    }
  };

  return (
    <>
      <div className="mt-4">
        <h4 className="ml-4 mt-4">Jobs Due Soon</h4>
        <div className="ml-4 mt-4 overflow-x-auto">
          <table className="table-auto border-collapse border border-slate-400 w-full">
            <thead>
              <tr>
                <th className="border border-slate-300">Job Name</th>
                <th className="border border-slate-300">Due Date</th>
                <th className="border border-slate-300">Scheduled?</th>
                <th className="border border-slate-300">Send Email?</th>
              </tr>
            </thead>
            <tbody>
              {dueInvoices.map((invoice) => (
                <tr key={invoice.invoiceId} className="hover:bg-slate-100">
                  <td className="border border-slate-300 p-2 cursor-pointer" onClick={() => redirectToInvoiceDetails(invoice.invoiceId)}>
                    {invoice.jobTitle}
                  </td>
                  <td className="border border-slate-300 p-2">
                    {new Date(invoice.dateDue).toLocaleDateString('en-US')}
                  </td>
                  <td className="border border-slate-300 p-2">
                    <input type="checkbox" checked={invoice.isChecked} onChange={(e) => handleCheckInvoice(invoice.invoiceId, e.target.checked)} />
                  </td>
                  <td className="border border-slate-300 p-2">
                    <SendReminder {...{setToastMessage, setShowToast, emailRecipient: invoice.jobTitle, emailSent: invoice.emailSent, invoiceId: invoice.invoiceId}} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <ToastContainer className="p-3" position="top-center">
        <Toast
          onClose={() => setShowToast(false)}
          show={showToast}
          delay={3000}
          autohide
        >
          <Toast.Header>
            <strong className="me-auto">Notification</strong>
          </Toast.Header>
          <Toast.Body className=" fw-bolder "> {toastMessage}</Toast.Body>
        </Toast>
      </ToastContainer>
    </>
  );
};

export default JobsDueContainer;
