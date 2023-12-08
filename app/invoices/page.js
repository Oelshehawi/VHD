'use client';
import { useState } from 'react';
import InvoiceTable from '../../components/InvoiceTable';
import { FaSearch } from 'react-icons/fa';
import AddInvoice from '../../components/AddInvoice';
import invoice from './invoice.module.css';
import { Container, Row, Col, Button, Form, InputGroup } from 'react-bootstrap';

const Invoice = () => {
  const [openModal, setopenModal] = useState(false);

  const [filter, setfilter] = useState('');

  const [onUpdate, setOnUpdate] = useState(false);

  return (
    <div className={`${invoice.verticalCenter}`}>
      <Container className={` ${invoice.tableContainer}`}>
        <AddInvoice
          open={openModal}
          onClose={() => {
            setopenModal(false);
          }}
          onUpdate={() => setOnUpdate(!onUpdate)}
        />
        <Row>
          <Col className="p-2 m-3 ms-4 mb-0">
            <div className="fs-4 fw-bolder">Invoices</div>
          </Col>
          <Col className="d-flex p-2 m-3 me-4 mb-0 justify-content-end">
            <Button
              className={` ${invoice.invoiceButton}`}
              onClick={() => setopenModal(true)}
            >
              {'Add invoice'}
            </Button>
          </Col>
        </Row>
        <Row className="mt-3 mx-3">
          <Col className="ps-0">
            <InputGroup className="p-0">
              <InputGroup.Text>
                <FaSearch />
              </InputGroup.Text>
              <Form.Control
                type="search"
                placeholder="Search For Invoice..."
                onChange={(e) => setfilter(e.target.value)}
              />
            </InputGroup>
          </Col>
          <Col className="pe-0">
            <Form.Select onChange={(e) => setfilter(e.target.value)}>
              <option value="Sort By"> Sort By</option>
              <option value="Paid"> Paid</option>
              <option value="Overdue">Overdue</option>
              <option value="Pending">Pending</option>
            </Form.Select>
          </Col>
        </Row>
        <Row className="mx-3 mt-3">
          <Container>
            <InvoiceTable filter={filter} onUpdate={onUpdate} />
          </Container>
        </Row>
      </Container>
    </div>
  );
};

export default Invoice;

export const Head = () => <title>VHD</title>;
