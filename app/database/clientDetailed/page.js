'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios';
import {
  Container,
  Row,
  Col,
  Button,
  Card,
  Spinner,
  ListGroup,
} from 'react-bootstrap';
import { FaTrashAlt, FaPenSquare, FaArrowLeft } from 'react-icons/fa';
import EditModal from '../../../components/EditClientModal';
import DeleteModal from '../../../components/DeleteModal';

const ClientDetailed = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const clientId = searchParams.get('id');
  const [client, setClient] = useState({});
  const [invoices, setInvoices] = useState([]);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [onUpdate, setOnUpdate] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const clientRes = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/clients/${clientId}`
        );
        setClient(clientRes.data);

        const invoicesRes = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/invoices/clientInvoices?prefix=${clientRes.data.prefix}`
        );
        setInvoices(invoicesRes.data);

        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, [onUpdate]);

  const handleBack = () => {
    router.push('/database');
  };

  const redirectToInvoiceDetails = (invoiceId) => {
    router.push(`/invoices/invoiceDetailed?id=${invoiceId}`);
  };

  const handleDeleteClient = async () => {
    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/clients/${clientId}`);
      router.push('/database');
    } catch (error) {
      console.error('Error deleting client:', error);
    }
  };

  const handleEdit = () => setOpenEditModal(true);
  const handleDelete = () => setOpenDeleteModal(true);

  if (isLoading) {
    return (
      <Container
        fluid
        className="d-flex justify-content-center align-items-center mt-5"
      >
        <Spinner
          animation="border"
          size="lg"
          role="status"
          aria-hidden="true"
        />
      </Container>
    );
  }
  return (
    <>
      <Container className="mt-4">
        <Row className="mb-4">
          <Col>
            <Button variant="secondary" onClick={handleBack}>
              <FaArrowLeft /> Back
            </Button>
          </Col>
          <Col className="d-flex justify-content-end">
            <Button variant="info" onClick={handleEdit} className="me-2">
              <FaPenSquare /> Edit
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              <FaTrashAlt /> Delete
            </Button>
          </Col>
        </Row>
        <Row>
          <Col md={6} className="mb-4">
            <Card>
              <Card.Header>Client Information</Card.Header>
              <Card.Body>
                <ListGroup>
                  <ListGroup.Item>
                    <strong>Name:</strong> {client.clientName}
                  </ListGroup.Item>
                  <ListGroup.Item>
                    <strong>Email:</strong> {client.email}
                  </ListGroup.Item>
                  <ListGroup.Item>
                    <strong>Phone:</strong> {client.phoneNumber}
                  </ListGroup.Item>
                  <ListGroup.Item>
                    <strong>Notes:</strong> {client.notes}
                  </ListGroup.Item>
                </ListGroup>
              </Card.Body>
            </Card>
          </Col>
          <Col md={6}>
            <Card>
              <Card.Header>Transaction History</Card.Header>
              <Card.Body>
                <ListGroup>
                  {invoices.length != 0 ? (
                    invoices.map((invoice) => (
                      <ListGroup.Item
                        key={invoice._id}
                        onClick={() => redirectToInvoiceDetails(invoice._id)}
                        action
                      >
                        #{invoice.invoiceId} - {invoice.jobTitle}
                      </ListGroup.Item>
                    ))
                  ) : (
                    <Row className="p-2">No invoices for this client</Row>
                  )}
                </ListGroup>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
      <EditModal
        open={openEditModal}
        onClose={() => setOpenEditModal(false)}
        client={client}
        onUpdate={() => setOnUpdate(!onUpdate)}
      />
      <DeleteModal
        showModal={openDeleteModal}
        hideModal={() => setOpenDeleteModal(false)}
        confirmModal={handleDeleteClient}
      />
    </>
  );
};

export default ClientDetailed;
