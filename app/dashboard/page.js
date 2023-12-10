'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import dashboard from './dashboard.module.css';
import {
  Container,
  Row,
  Col,
  Stack,
  Spinner,
  Table,
  Form,
} from 'react-bootstrap';

const DashboardPage = () => {
  const router = useRouter();

  const [dueInvoices, setDueInvoices] = useState([]);
  const [overdueCounter, setOverdueCounter] = useState();
  const [clients, setClients] = useState();
  const [isLoading, setIsLoading] = useState(true);

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
    const fetchData = async () => {
      try {
        const clientsRes = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/clients/count`
        );
        const overdueCounter = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/invoices/overDue`
        );

        setClients(clientsRes.data);
        setOverdueCounter(overdueCounter.data);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
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
    }
  };

  return (
    <Container className="mt-4">
      <Row>
        <Col md={2}>
          <div className={`p-2 ${dashboard.clientCounter}`}>
            <Stack gap={2}>
              <div className="p-2">Clients</div>
              {isLoading ? (
                <div className="p-2 text-center fs-3">
                  <Spinner
                    as="span"
                    animation="border"
                    size="md"
                    role="status"
                    aria-hidden="true"
                  />
                </div>
              ) : (
                <div className="p-2 text-center fs-3">{clients.total}</div>
              )}
            </Stack>
          </div>
        </Col>
        <Col md={2}>
          <div className={`p-2 ${dashboard.overdueCounter}`}>
            <Stack gap={2}>
              <div className="p-2">Overdue Invoices</div>
              {isLoading ? (
                <div className="p-2 text-center fs-3">
                  <Spinner
                    as="span"
                    animation="border"
                    size="md"
                    role="status"
                    aria-hidden="true"
                  />
                </div>
              ) : (
                <div className="p-2 text-center fs-3">
                  {overdueCounter.count}
                </div>
              )}
            </Stack>
          </div>
        </Col>
        <Col className={``}>
          <Row className={`ms-4 ${dashboard.jobsDueContainer}`}>
            <h4>Jobs Due Soon</h4>
          </Row>
          <Row className={`ms-4 mt-4`}>
            <div className={dashboard.scrollableTable}>
              <Table bordered hover>
                <tbody>
                  {dueInvoices.map((invoice) => (
                    <tr key={invoice.invoiceId}>
                      <td
                        onClick={() =>
                          redirectToInvoiceDetails(invoice.invoiceId)
                        }
                        style={{ cursor: 'pointer' }}
                        className={`fs-6 fw-bolder ${dashboard.tableCell}`}
                      >
                        {invoice.jobTitle} - Due:{' '}
                        {new Date(invoice.dateDue).toLocaleDateString('en-US', {
                          timeZone: 'UTC',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </td>
                      <td className="text-center">
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
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </Row>
        </Col>
      </Row>
    </Container>
  );
};

export default DashboardPage;

export const Head = () => <title>VHD</title>;
