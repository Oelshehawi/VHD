import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import Axios from 'axios';
import {
  Offcanvas,
  Form,
  Button,
  Row,
  Col,
  ToastContainer,
  Toast,
} from 'react-bootstrap';
import addInvoice from './styles/addInvoice.module.css';

const AddInvoice = ({ open, onClose, onUpdate }) => {
  const [clients, setClients] = useState([]);
  const [items, setItems] = useState([{ description: '', price: '' }]);
  const [isLoading, setIsLoading] = useState(false);
  const [frequency, setFrequency] = useState('');
  const [dateIssued, setDateIssued] = useState('');
  const [showToast, setShowToast] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm();

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await Axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/clients`
        );
        setClients(response.data);
      } catch (error) {
        console.log('Error fetching clients:', error);
      }
    };
    fetchClients();
  }, []);

  const addItem = () => {
    setItems([...items, { description: '', price: '' }]);
  };

  const deleteItem = (index) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
    reset({ items: newItems });
  };

  const handleSave = async (values) => {
    setIsLoading(true);

    try {
      const selectedClient = clients.find(
        (client) => client._id === values.clientId
      );
      const clientPrefix = selectedClient ? selectedClient.prefix : '';

      const invoicesResponse = await Axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/invoices/clientInvoices?prefix=${clientPrefix}`
      );

      const maxInvoiceNumber = invoicesResponse.data.reduce((max, invoice) => {
        const number = parseInt(invoice.invoiceId.split('-')[1]);
        return number > max ? number : max;
      }, -1);

      const nextInvoiceNumber = maxInvoiceNumber + 1;

      const invoiceId = `${clientPrefix}-${nextInvoiceNumber
        .toString()
        .padStart(4, '0')}`;

      const invoiceData = {
        invoiceId,
        jobTitle: values.jobTitle,
        dateIssued: values.dateIssued,
        dateDue: calculateDueDate(values.dateIssued, values.frequency),
        items: values.items.map((item) => ({
          description: item.description,
          price: parseFloat(item.price) || 0,
        })),
        frequency: values.frequency,
        location: values.location,
        notes: values.notes,
        status: 'pending',
      };

      await Axios.post(`${process.env.NEXT_PUBLIC_API_URL}/invoices`, invoiceData);

      setShowToast(true);
      onUpdate();
      onClose();
      reset();
    } catch (error) {
      console.error('Error saving invoice:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateDueDate = (issuedDate, freq) => {
    if (issuedDate && freq) {
      const dueDate = new Date(issuedDate);
      const monthsToAdd = Math.floor(12 / parseInt(freq));
      dueDate.setUTCMonth(dueDate.getUTCMonth() + monthsToAdd);
  

      return dueDate.toISOString().split('T')[0];
    }
    return '';
  };

  return (
    <>
      <Offcanvas
        show={open}
        onHide={onClose}
        placement="end"
        className={` ${addInvoice.offCanvas}`}
      >
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>Add New Invoice</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          <Form onSubmit={handleSubmit(handleSave)}>
            <Form.Group className="mb-3">
              <Form.Label>Recipient Client</Form.Label>
              <Controller
                name="clientId"
                control={control}
                rules={{ required: 'Client is required' }}
                render={({ field }) => (
                  <Form.Select {...field} aria-label="Recipient Client">
                    <option value="">Recipient</option>
                    {clients.map((client) => (
                      <option key={client._id} value={client._id}>
                        {`${client.clientName} - ${client.email}`}
                      </option>
                    ))}
                  </Form.Select>
                )}
              />
              {errors.clientId && (
                <span className="text-danger">{errors.clientId.message}</span>
              )}
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Job Title</Form.Label>
              <Form.Control
                {...register('jobTitle', { required: true })}
                type="text"
                placeholder="Job Title"
              />
              {errors.jobTitle && (
                <span className="text-danger">{errors.jobTitle.message}</span>
              )}
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Frequency</Form.Label>
              <Form.Control
                {...register('frequency', { required: true })}
                type="number"
                placeholder="Frequency"
                onChange={(e) => setFrequency(e.target.value)}
              />
              {errors.frequency && (
                <span className="text-danger">{errors.frequency.message}</span>
              )}
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Location</Form.Label>
              <Form.Control
                {...register('location', { required: true })}
                type="text"
                placeholder="Location"
              />
              {errors.location && (
                <span className="text-danger">{errors.location.message}</span>
              )}
            </Form.Group>
            <Row className="mb-3">
              <Col>
                <Form.Group>
                  <Form.Label>Date Issued</Form.Label>
                  <Form.Control
                    type="date"
                    {...register('dateIssued', { required: true })}
                    onChange={(e) => setDateIssued(e.target.value)}
                  />
                  {errors.dateIssued && (
                    <span className="text-danger">
                      Date Issued is required.
                    </span>
                  )}
                </Form.Group>
              </Col>
              <Col>
                <Form.Group>
                  <Form.Label>Date Due</Form.Label>
                  <Form.Control
                    type="text"
                    value={
                      frequency && dateIssued
                        ? calculateDueDate(dateIssued, frequency)
                        : 'Enter Issue Date and Frequency'
                    }
                    disabled
                  />
                </Form.Group>
              </Col>
            </Row>
            {items.map((item, index) => (
              <Row key={index} className="align-items-center mb-3">
                <Col>
                  <Form.Control
                    {...register(`items[${index}].description`, {
                      required: true,
                    })}
                    placeholder="Item Description"
                  />
                </Col>
                <Col>
                  <Form.Control
                    {...register(`items[${index}].price`, { required: true })}
                    type="number"
                    placeholder="Item Price"
                  />
                </Col>
                <Col xs="auto">
                  <Button
                    variant="danger"
                    onClick={() => deleteItem(index)}
                    disabled={items.length === 1}
                  >
                    Delete
                  </Button>
                </Col>
              </Row>
            ))}
            <Button variant="secondary" onClick={addItem}>
              + Add Item
            </Button>
            <Form.Group className="mb-3 mt-2">
              <Form.Label>Additional Notes</Form.Label>
              <Form.Control {...register('notes')} as="textarea" rows={3} />
            </Form.Group>
            <Row>
              <Col className="d-flex justify-content-center">
                <Button
                  variant="primary"
                  type="submit"
                  disabled={isLoading}
                  className={` ${addInvoice.submitButton}`}
                >
                  {isLoading ? 'Saving...' : 'Save Invoice'}
                </Button>
              </Col>
            </Row>
          </Form>
        </Offcanvas.Body>
      </Offcanvas>
      <ToastContainer className="p-3" position="top-center">
        <Toast
          onClose={() => setShowToast(false)}
          show={showToast}
          delay={3000}
          autohide
        >
          <Toast.Header>
            <strong className="me-auto">Invoice Saved</strong>
          </Toast.Header>
          <Toast.Body>Invoice has been successfully saved!</Toast.Body>
        </Toast>
      </ToastContainer>
    </>
  );
};

export default AddInvoice;
