'use client';
import { useState } from 'react';
import InvoiceTable from '../../components/invoices/InvoiceTable';
import AddInvoice from '../../components/AddInvoice';

const InvoiceContainer = ({ invoiceData, clients }) => {
  const [openModal, setopenModal] = useState(false);

  return (
    <div className='bg-white rounded-lg shadow-lg w-[90%] lg:w-4/5 p-4 min-h-[90vh] my-5 lg:my-0'>
      <AddInvoice clients={clients} show={openModal} onHide={() => setopenModal(false)} />
      <div className='flex flex-row items-center justify-between my-2'>
        <div className='text-xl fw-bold'>Invoices</div>
        <button
          onClick={() => setopenModal(true)}
          className='hover:bg-darkBlue bg-darkGreen text-white font-bold h-full py-2 px-4 rounded shadow-sm'
        >
          {'Add Invoice'}
        </button>
      </div>
      <div className=''>
        {invoiceData && <InvoiceTable invoiceData={invoiceData} />}
      </div>
    </div>
  );
};

export default InvoiceContainer;
