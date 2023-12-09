import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
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
import editInvoice from './styles/editInvoice.module.css';

const EditInvoiceModal = ({ open, onClose, onUpdate, invoice }) => {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm();

  const dateIssued = watch('dateIssued');
  const frequency = watch('frequency');

  useEffect(() => {
    const updatedDateDue = calculateDueDate(dateIssued, frequency);
    setValue('dateDue', updatedDateDue);
  }, [dateIssued, frequency, setValue]);

  useEffect(() => {
    if (invoice && Object.keys(invoice).length !== 1) {
      Object.entries(invoice).forEach(([key, value]) => {
        if (key === 'dateIssued' || key === 'dateDue') {
          setValue(key, new Date(value).toISOString().split('T')[0]);
        } else {
          setValue(key, value, { shouldValidate: true });
        }
      });
      setItems(invoice.items || []);
    }
  }, [invoice, setValue]);

  const calculateDueDate = (issuedDate, freq) => {
    if (issuedDate && freq) {
      const dueDate = new Date(issuedDate);
      const monthsToAdd = Math.floor(12 / parseInt(freq));
      dueDate.setUTCMonth(dueDate.getUTCMonth() + monthsToAdd);
  

      return dueDate.toISOString().split('T')[0];
    }
    return '';
  };
  const addItem = () => {
    const newItems = [...items, { description: '', price: '' }];
    setItems(newItems);
  };

  const deleteItem = (index) => {
    if (items.length > 1) {
      const updatedItems = items.filter((_, i) => i !== index);
      setItems(updatedItems);
    }
  };

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const updatedData = { ...data, items };
      console.log(updatedData)
      await Axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/invoices/${invoice._id}`,
        updatedData
      );
      setShowToast(true);
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error updating invoice:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Offcanvas
        show={open}
        onHide={onClose}
        placement="end"
        className={editInvoice.offCanvas}
      >
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>Edit Invoice</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          <Form onSubmit={handleSubmit(onSubmit)}>
            <Form.Group className="mb-3">
              <Form.Label>Job Title</Form.Label>
              <Form.Control
                type="text"
                placeholder="Job Title"
                {...register('jobTitle', { required: true })}
              />
              {errors.jobTitle && (
                <p className="text-danger">Job title is required</p>
              )}
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Frequency</Form.Label>
              <Form.Control
                type="number"
                placeholder="Frequency"
                {...register('frequency', { required: true })}
              />
              {errors.frequency && (
                <p className="text-danger">Frequency is required</p>
              )}
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Location</Form.Label>
              <Form.Control
                type="text"
                placeholder="Location"
                {...register('location', { required: true })}
              />
              {errors.location && (
                <p className="text-danger">Location is required</p>
              )}
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Date Issued</Form.Label>
              <Form.Control
                type="date"
                {...register('dateIssued', { required: true })}
              />
              {errors.dateIssued && (
                <p className="text-danger">Date issued is required</p>
              )}
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Date Due</Form.Label>
              <Form.Control type="text" {...register('dateDue')} disabled />
            </Form.Group>
            {items.map((item, index) => (
              <Row key={index} className="align-items-center mb-3">
                <Col>
                  <Form.Control
                    type="text"
                    placeholder="Item Description"
                    value={item.description}
                    onChange={(e) => {
                      const newItems = [...items];
                      newItems[index].description = e.target.value;
                      setItems(newItems);
                    }}
                  />
                </Col>
                <Col>
                  <Form.Control
                    type="number"
                    placeholder="Item Price"
                    value={item.price}
                    onChange={(e) => {
                      const newItems = [...items];
                      newItems[index].price = e.target.value;
                      setItems(newItems);
                    }}
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
            <Form.Group className="mb-3 mt-3">
              <Form.Label>Additional Notes</Form.Label>
              <Form.Control as="textarea" rows={3} {...register('notes')} />
            </Form.Group>
            <Row>
              <Col className="d-flex justify-content-center">
                <Button
                  variant="primary"
                  type="submit"
                  disabled={isLoading}
                  className={editInvoice.submitButton}
                >
                  {isLoading ? 'Updating...' : 'Save Changes'}
                </Button>
              </Col>
            </Row>
          </Form>
        </Offcanvas.Body>
      </Offcanvas>
      <ToastContainer position="top-center" className="p-3">
        <Toast
          onClose={() => setShowToast(false)}
          show={showToast}
          delay={3000}
          autohide
        >
          <Toast.Header>
            <strong className="me-auto">Invoice Updated</strong>
          </Toast.Header>
          <Toast.Body>Invoice has been successfully updated!</Toast.Body>
        </Toast>
      </ToastContainer>
    </>
  );
};

export default EditInvoiceModal;
