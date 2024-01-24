'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
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
import JobsDueContainer from '../../components/JobsDueContainer';

const DashboardPage = () => {
  const [overdueCounter, setOverdueCounter] = useState();
  const [clients, setClients] = useState();
  const [isLoading, setIsLoading] = useState(true);

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
  }, []);

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
        <JobsDueContainer />
      </Row>
    </Container>
  );
};

export default DashboardPage;

export const Head = () => <title>VHD</title>;
