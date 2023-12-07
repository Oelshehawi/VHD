import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import Axios from 'axios';
import { Offcanvas, Form, Button, Row, Col } from 'react-bootstrap';
import editModal from './styles/editModal.module.css';
import { ToastContainer, Toast } from 'react-bootstrap';

const EditModal = ({ open, onClose, client, onUpdate }) => {
  const [isLoading, setIsLoading] = useState(false);

  const [showToast, setShowToast] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  useEffect(() => {
    reset({
      clientName: client.clientName,
      email: client.email,
      phoneNumber: client.phoneNumber,
      notes: client.notes,
    });
  }, [client, reset]);

  const handleUpdate = async (data) => {
    setIsLoading(true);
    try {
      await Axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/clients/${client._id}`,
        data
      );
      setShowToast(true);
      onUpdate();
      reset();
    } catch (error) {
      console.error('Error updating client:', error);
    } finally {
      setIsLoading(false);
      onClose();
    }
  };

  return (
    <>
      <Offcanvas show={open} onHide={onClose} placement="end">
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>Edit Client</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          <Form onSubmit={handleSubmit(handleUpdate)}>
            <Form.Group className="mb-3">
              <Form.Label>Client's Name</Form.Label>
              <Form.Control
                {...register('clientName')}
                type="text"
                isInvalid={!!errors.clientName}
              />
              <Form.Control.Feedback type="invalid">
                Client name is required.
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                {...register('email')}
                type="email"
                isInvalid={!!errors.email}
              />
              <Form.Control.Feedback type="invalid">
                Email is required.
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Phone Number</Form.Label>
              <Form.Control
                {...register('phoneNumber')}
                type="tel"
                isInvalid={!!errors.phoneNumber}
              />
              <Form.Control.Feedback type="invalid">
                Phone number is required.
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Notes</Form.Label>
              <Form.Control {...register('notes')} as="textarea" rows={3} />
            </Form.Group>

            <Row>
              <Col className="d-flex justify-content-center">
                <Button
                  variant="primary"
                  type="submit"
                  disabled={isLoading}
                  className={`${editModal.submitButton}`}
                >
                  {isLoading ? 'Updating...' : 'Save Changes'}
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
            <strong className="me-auto">Client Updated</strong>
          </Toast.Header>
          <Toast.Body>
            Client details have been successfully updated.
          </Toast.Body>
        </Toast>
      </ToastContainer>
    </>
  );
};

export default EditModal;
