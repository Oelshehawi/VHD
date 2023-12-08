import { useState } from 'react';
import { useForm } from 'react-hook-form';
import Axios from 'axios';
import { Offcanvas, Form, Button, Row, Col, Toast, ToastContainer } from 'react-bootstrap';
import addClient from './styles/addClient.module.css';

const AddClient = ({ show, onHide, onUpdate }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  const inputFields = [
    {
      name: 'clientName',
      type: 'text',
      placeholder: "Client's Name",
      isRequired: false,
    },
    {
      name: 'prefix',
      type: 'text',
      placeholder: 'Invoice Prefix',
      isRequired: true,
      maxLength: 3,
    },
    { name: 'email', type: 'email', placeholder: 'Email', isRequired: true },
    {
      name: 'phoneNumber',
      type: 'tel',
      placeholder: 'Phone Number',
      isRequired: true,
    },
    {
      name: 'notes',
      type: 'textarea',
      placeholder: 'Notes',
      isRequired: false,
    },
  ];

  const handleSave = async (values) => {
    setIsLoading(true);
    try {
      await Axios.post(`${process.env.NEXT_PUBLIC_API_URL}/clients/`, values);

      onHide();
      reset();
      setShowToast(true); 
      onUpdate();
    } catch (error) {
      console.error('Error saving client:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Offcanvas show={show} onHide={onHide} placement="end" className={` ${addClient.offCanvas}`}>
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>Add New Client</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          <Form onSubmit={handleSubmit(handleSave)}>
            {inputFields.map(
              ({ name, type, placeholder, isRequired, maxLength }) => (
                <Form.Group key={name} className="mb-3">
                  {type === 'textarea' ? (
                    <Form.Control
                      as="textarea"
                      {...register(name)}
                      placeholder={placeholder}
                      isInvalid={!!errors[name]}
                    />
                  ) : (
                    <Form.Control
                      {...register(name, { required: isRequired })}
                      type={type}
                      placeholder={placeholder}
                      maxLength={maxLength}
                      isInvalid={!!errors[name]}
                    />
                  )}
                  <Form.Control.Feedback type="invalid">
                    {name} is required
                  </Form.Control.Feedback>
                </Form.Group>
              )
            )}
            <Row>
              <Col className="d-flex justify-content-center">
                <Button
                  variant="primary"
                  type="submit"
                  className={` ${addClient.submitButton}`}
                >
                  {isLoading ? 'Adding Client...' : 'Add Client'}
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
            <strong className="me-auto">Client Added</strong>
          </Toast.Header>
          <Toast.Body>New client has been successfully added.</Toast.Body>
        </Toast>
      </ToastContainer>
    </>
  );
};

export default AddClient;
