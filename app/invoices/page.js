'use client';
import { useState } from 'react';
import InvoiceTable from '../../components/InvoiceTable';
import { FaSearch } from 'react-icons/fa';
import { FaPlus } from 'react-icons/fa';
import { FaFilter } from 'react-icons/fa';
import AddInvoice from '../../components/AddInvoice';
import { ToastContainer, toast, Slide } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import invoice from './invoice.module.css';

const Invoice = () => {
  const [openModal, setopenModal] = useState(false);

  const [filter, setfilter] = useState('');

  const [onUpdate, setOnUpdate] = useState(false);

  const showToast = () => {
    toast.success('Invoice Added Successfully!', {
      position: 'bottom-right',
      transition: Slide,
    });
  };

  return (
    <>
      <AddInvoice
        open={openModal}
        onClose={() => {
          setopenModal(false);
        }}
        showToast={showToast}
        onUpdate={() => setOnUpdate(!onUpdate)}
      />
      <ToastContainer />
      <div className={invoice.dataContainer}>
        <div className={invoice.dataTitle}>{'Invoices'}</div>
        <div className={invoice.interactContainer}>
          <div className={invoice.filterContainer}>
            <div className={invoice.searchContainer}>
              <FaSearch />
              <input
                type="search"
                placeholder="Search..."
                className={invoice.searchBar}
                value={filter ?? ''}
                onChange={(e) => setfilter(e.target.value)}
              />
            </div>
            <div
              className={invoice.invoiceFilterButtonContainer}
              onClick={() => setopenModal(true)}
            >
              <FaFilter />
              <button className={invoice.invoiceFilterButton}>
                {'Filter'}
              </button>
            </div>
          </div>
          <div
            className={invoice.invoiceButtonContainer}
            onClick={() => setopenModal(true)}
          >
            <FaPlus />
            <button className={invoice.invoiceButton}> {'Add invoice'} </button>
          </div>
        </div>
      </div>
      <div className={invoice.jobTableContainer}>
        <InvoiceTable filter={filter} onUpdate={() => setOnUpdate(!onUpdate)} />
      </div>
    </>
  );
};

export default Invoice;

export const Head = () => <title>VHD</title>;
