'use client';
import { useState } from 'react';
import InvoiceTable from '../../components/InvoiceTable';
import { FaSearch } from 'react-icons/fa';
import { FaPlus } from 'react-icons/fa';
import AddInvoice from '../../components/AddInvoice';
import invoice from './invoice.module.css';
import { Container, Row, Col, Button, Form, InputGroup } from 'react-bootstrap';

const Invoice = () => {
  const [openModal, setopenModal] = useState(false);

  const [filter, setfilter] = useState('');

  const [onUpdate, setOnUpdate] = useState(false);

  return (
    <div className={`${invoice.verticalCenter}`}>
      <Container className={`mx-auto ${invoice.tableContainer}`}>
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
            <Button className={` ${invoice.invoiceButton}`}>
              {'Add invoice'}
            </Button>
          </Col>
        </Row>
        <Row className="mt-3 mx-3">
          <InputGroup className='p-0'>
            <InputGroup.Text>
              <FaSearch />
            </InputGroup.Text>
            <Form.Control
              type="search"
              placeholder="Search For Invoice..."
              onChange={(e) => setfilter(e.target.value)}
            />
          </InputGroup>
        </Row>
        <Row className="mx-3 mt-3">
          <InvoiceTable
            filter={filter}
            onUpdate={() => setOnUpdate(!onUpdate)}
          />
        </Row>
      </Container>
    </div>
  );
};

export default Invoice;

export const Head = () => <title>VHD</title>;
