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
    }
  };

  return (
    <>
      <Col className={``}>
        <Row className={`ms-4 ${styles.jobsDueContainer}`}>
          <h4>Jobs Due Soon</h4>
        </Row>
        <Row className={`ms-4 mt-4`}>
          <div className={styles.scrollableTable}>
            <Table bordered hover>
              <thead>
                <tr>
                  <th> Job Name</th>
                  <th> Due Date</th>
                  <th> Scheduled?</th>
                  <th>Send Email?</th>
                </tr>
              </thead>
              <tbody>
                {dueInvoices.map((invoice) => (
                  <tr key={invoice.invoiceId}>
                    <td
                      onClick={() =>
                        redirectToInvoiceDetails(invoice.invoiceId)
                      }
                      style={{ cursor: 'pointer' }}
                      className={`fs-6 fw-bolder text-start ${styles.verticalCenter}`}
                    >
                      {invoice.jobTitle}
                    </td>
                    <td className={`fs-6 fw-bolder`}>
                      {new Date(invoice.dateDue).toLocaleDateString('en-US', {
                        timeZone: 'UTC',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </td>
                    <td className={` ${styles.verticalCenter}`}>
                      <Form.Check
                        type="checkbox"
                        checked={invoice.isChecked}
                        onChange={(e) =>
                          handleCheckInvoice(
                            invoice.invoiceId,
                            e.target.checked
                          )
                        }
                      />
                    </td>
                    <td className={` ${styles.verticalCenter}`}>
                      <SendReminder
                        setToastMessage={setToastMessage}
                        setShowToast={setShowToast}
                        emailRecipient={invoice.jobTitle}
                        emailSent={invoice.emailSent}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </Row>
      </Col>
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
          <Toast.Body className=' fw-bolder '> {toastMessage}</Toast.Body>
        </Toast>
      </ToastContainer>
    </>
  );
};

export default JobsDueContainer;
