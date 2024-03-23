'use client';
import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
  Container,
  Row,
  Col,
  Button,
  Card,
  Spinner,
  ListGroup,
  ToastContainer,
  Toast,
  Form,
} from 'react-bootstrap';
import {
  FaTrashAlt,
  FaPenSquare,
  FaArrowLeft,
  FaUser,
  FaRegEnvelope,
  FaPhoneAlt,
} from 'react-icons/fa';
import axios from 'axios';
import EditInvoiceModal from '../../../components/EditInvoiceModal';
import DeleteModal from '../../../components/DeleteModal';
import { useRouter } from 'next/navigation';

const InvoiceDetailed = () => {
  const router = useRouter();
  const params = useParams();
  const id = params.id;
  const [client, setClient] = useState({});
  const [invoice, setInvoice] = useState({ items: [] });
  const [openEditModal, setOpenEditModal] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [onUpdate, setOnUpdate] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const invoiceResponse = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/invoices/${id}`
        );
        setInvoice(invoiceResponse.data);

        const clientResponse = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/clients?prefix=${
            invoiceResponse.data.invoiceId.split('-')[0]
          }`
        );
        setClient(clientResponse.data[0]);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchData();
  }, [onUpdate]);

  const handleDelete = async () => {
    try {
      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL}/invoices/${invoice._id}`
      );
      setToastMessage('Invoice deleted successfully');
      setShowToast(true);
      router.push('/invoices');
    } catch (error) {
      console.error('Error deleting invoice:', error);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/invoices/updateState`,
        {
          invoiceId: invoice._id,
          status: newStatus,
        }
      );
      setInvoice({ ...invoice, status: newStatus });
      setToastMessage('Invoice status updated successfully');
      setShowToast(true);
    } catch (error) {
      console.error('Error updating invoice status:', error);
    }
  };

  const handleBack = () => router.push('/invoices');
  const handleEdit = () => setOpenEditModal(true);
  const handleDeleteConfirm = () => setOpenDeleteModal(true);

  if (!id || !invoice || !client) {
    return (
      <Container
        fluid
        className='d-flex justify-content-center align-items-center'
      >
        <Spinner
          animation='border'
          size='lg'
          role='status'
          aria-hidden='true'
        />
      </Container>
    );
  }

  const formatDateToLocale = (dateString) => {
    const date = new Date(dateString);
    const utcDate = new Date(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate()
    );
    return utcDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const issuedDate = formatDateToLocale(invoice.dateIssued);
  const dueDate = formatDateToLocale(invoice.dateDue);
  const calculateTotal = (items) => {
    const sum = items.reduce((acc, item) => acc + item.price, 0);
    return sum + sum * 0.05;
  };

  const calculateGST = (items) => {
    const sum = items.reduce((acc, item) => acc + item.price, 0);
    return sum * 0.05;
  };

  return (
    <>
      <Container className='mt-4'>
        <Row className='mb-4'>
          <Col>
            <Button variant='secondary' onClick={handleBack}>
              <FaArrowLeft /> Back
            </Button>
          </Col>
          <Col className='d-flex justify-content-end'>
            <Button variant='info' onClick={handleEdit} className='me-2'>
              <FaPenSquare /> Edit
            </Button>
            <Button variant='danger' onClick={handleDeleteConfirm}>
              <FaTrashAlt /> Delete
            </Button>
          </Col>
        </Row>
        <Row>
          <Col md={6} className='mb-4'>
            <Card>
              <Card.Header>Invoice Information</Card.Header>
              <Card.Body>
                <ListGroup variant='flush'>
                  <ListGroup.Item>
                    <strong>Invoice ID:</strong> {invoice.invoiceId}
                  </ListGroup.Item>
                  <ListGroup.Item>
                    <strong>Job Title:</strong> {invoice.jobTitle}
                  </ListGroup.Item>
                  <ListGroup.Item>
                    <strong>Date Issued:</strong> {issuedDate}
                  </ListGroup.Item>
                  <ListGroup.Item>
                    <strong>Date Due:</strong> {dueDate}
                  </ListGroup.Item>
                  <ListGroup.Item>
                    <strong>Frequency:</strong> {invoice.frequency}
                  </ListGroup.Item>
                  <ListGroup.Item>
                    <strong>Location:</strong> {invoice.location}
                  </ListGroup.Item>
                  <ListGroup.Item>
                    <strong>Notes:</strong> {invoice.notes}
                  </ListGroup.Item>
                </ListGroup>
              </Card.Body>
            </Card>
          </Col>
          <Col md={6}>
            <Card>
              <Card.Header>Client Information</Card.Header>
              <Card.Body>
                <ListGroup variant='flush'>
                  <ListGroup.Item
                    action
                    onClick={() => router.push(`/database/${client._id}`)}
                  >
                    <FaUser /> {client.clientName}
                  </ListGroup.Item>
                  <ListGroup.Item>
                    <FaRegEnvelope /> {client.email}
                  </ListGroup.Item>
                  <ListGroup.Item>
                    <FaPhoneAlt /> {client.phoneNumber}
                  </ListGroup.Item>
                </ListGroup>
              </Card.Body>
            </Card>
            <Card className='mt-3'>
              <Card.Header>Amount Due</Card.Header>
              <Card.Body>
                <ListGroup variant='flush'>
                  <ListGroup.Item>
                    <strong>Total:</strong> ${calculateTotal(invoice.items)}
                  </ListGroup.Item>
                  <Row>
                    <Col md={12}>
                      <Card className='mt-3'>
                        <Card.Header>Price Breakdown</Card.Header>
                        <Card.Body>
                          <ListGroup variant='flush'>
                            {invoice.items.map((item, index) => (
                              <ListGroup.Item key={index}>
                                {item.description}: ${item.price}
                              </ListGroup.Item>
                            ))}
                            <ListGroup.Item>
                              GST (5%): ${calculateGST(invoice.items)}
                            </ListGroup.Item>
                          </ListGroup>
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>
                  <ListGroup.Item>
                    <Form.Select
                      value={invoice.status}
                      onChange={(e) => handleStatusChange(e.target.value)}
                    >
                      <option value='pending'>Pending</option>
                      <option value='paid'>Paid</option>
                      <option value='overdue'>Overdue</option>
                    </Form.Select>
                  </ListGroup.Item>
                </ListGroup>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
      <EditInvoiceModal
        open={openEditModal}
        onClose={() => setOpenEditModal(false)}
        onUpdate={() => setOnUpdate(!onUpdate)}
        invoice={invoice}
      />
      <DeleteModal
        showModal={openDeleteModal}
        hideModal={() => setOpenDeleteModal(false)}
        confirmModal={handleDelete}
      />

      <ToastContainer className='p-3' position='top-center'>
        <Toast
          onClose={() => setShowToast(false)}
          show={showToast}
          delay={3000}
          autohide
        >
          <Toast.Header>
            <strong className='me-auto'>Notification</strong>
          </Toast.Header>
          <Toast.Body>{toastMessage}</Toast.Body>
        </Toast>
      </ToastContainer>
    </>
  );
};

export default InvoiceDetailed;
