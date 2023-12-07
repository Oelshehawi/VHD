'use client';
import React, { useState } from 'react';
import ClientTable from '../../components/ClientTable';
import { FaSearch, FaPlus } from 'react-icons/fa';
import AddClient from '../../components/AddClient';
import database from './database.module.css';
import { Container, Row, Col, Button, Form, InputGroup } from 'react-bootstrap';

const Database = () => {
  const [openModal, setopenModal] = useState(false);
  const [filter, setfilter] = useState('');

  return (
    <div className={database.verticalCenter}>
      <Container className={database.tableContainer}>
        <AddClient open={openModal} onClose={() => setopenModal(false)} />
        <Row>
          <Col className="p-2 m-3 ms-4 mb-0">
            <div className="fs-4 fw-bolder">Clients</div>
          </Col>
          <Col className="d-flex p-2 m-3 me-4 mb-0 justify-content-end">
            <Button
              onClick={() => setopenModal(true)}
              className={database.clientButton}
            >
              {'Add Client'}
            </Button>
          </Col>
        </Row>
        <Row className="mt-3 mx-3">
          <InputGroup className="p-0">
            <InputGroup.Text>
              <FaSearch />
            </InputGroup.Text>
            <Form.Control
              type="search"
              placeholder="Search For Client..."
              onChange={(e) => setfilter(e.target.value)}
            />
          </InputGroup>
        </Row>
        <Row className="mx-3 mt-3">
          <ClientTable filter={filter} />
        </Row>
      </Container>
    </div>
  );
};

export default Database;
export const Head = () => <title>Clients</title>;
