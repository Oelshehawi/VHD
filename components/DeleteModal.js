import React from 'react';
import { Modal, Button } from 'react-bootstrap';

const DeleteModal = ({ showModal, hideModal, confirmModal }) => {
  return (
    <Modal show={showModal} onHide={hideModal} centered>
      <Modal.Header closeButton>
        <Modal.Title>Delete Confirmation</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="alert alert-danger">
          Are you sure you want to delete this client?
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={hideModal}>
          Cancel
        </Button>
        <Button variant="danger" onClick={confirmModal}>
          Delete
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default DeleteModal;