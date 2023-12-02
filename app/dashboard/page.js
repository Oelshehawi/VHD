'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import dashboard from './dashboard.module.css';
import { Container, Row, Col, Stack, Spinner } from 'react-bootstrap';

const DashboardPage = () => {
  const router = useRouter();

  const [invoices, setInvoices] = useState([]);
  const [clients, setClients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const invoicesRes = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/invoices`
        );
        const clientsRes = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/clients`
        );

        setInvoices(invoicesRes.data);
        setClients(clientsRes.data);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);
  const totalClients = clients?.length;

  const totalOverdueInvoices = invoices?.filter(
    (invoice) => invoice.status === 'overdue'
  );

  const groupedLatestInvoices = invoices?.data?.reduce((group, invoice) => {
    const prefix = invoice.invoiceId.split('-')[0];
    if (!group[prefix] || group[prefix].dateIssued < invoice.dateIssued) {
      group[prefix] = invoice;
    }
    return group;
  }, []);

  const latestInvoices = Object.values(groupedLatestInvoices ?? []);

  const today = new Date();

  const groupedDueInvoices = latestInvoices.reduce((group, invoice) => {
    const dueDate = new Date(invoice.dateDue);
    const daysRemaining = Math.floor((dueDate - today) / (24 * 60 * 60 * 1000));

    if (daysRemaining >= 0 && daysRemaining <= 7 && invoice.isDue !== true) {
      group.push(invoice);
    }
    return group;
  }, []);

  const redirectToInvoiceDetails = (invoiceId) => {
    router.push(`/invoices/invoiceDetailed?id=${invoiceId}`);
  };

  const dueInvoices = Object.values(groupedDueInvoices ?? []);

  const handleCheckInvoice = async (invoiceId) => {
    try {
      await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/invoices/${invoiceId}`,
        {
          isDue: true,
        }
      );
      onUpdate();
    } catch (error) {
      console.log(error);
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
                <div className="p-2 text-center fs-3">{totalClients}</div>
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
                  {totalOverdueInvoices.length}
                </div>
              )}
            </Stack>
          </div>
        </Col>
        <Col>words</Col>
      </Row>
    </Container>
  );
};

export default DashboardPage;

export const Head = () => <title>VHD</title>;
