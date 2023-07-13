'use client';
import { useState } from 'react';
import InvoiceTable from '../../components/InvoiceTable';
import { FaSearch } from 'react-icons/fa';
import { FaPlus } from 'react-icons/fa';
import AddInvoice from '../../components/AddInvoice';
import { ToastContainer, toast, Slide } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import invoice from './invoice.module.css';
import Select from 'react-select';

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

  const statusOptions = [
    { value: '', label: 'All', color: 'gray' },
    { value: 'pending', label: 'PENDING', color: 'yellow' },
    { value: 'overdue', label: 'OVERDUE', color: 'red' },
    { value: 'paid', label: 'PAID', color: 'green' },
  ];

  const customStyles = {
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.data.color,
      color: state.data.color === 'yellow' ? 'black' : 'white',
      borderRadius: '4px',
      cursor: 'pointer',
      marginBottom: '8px',
      width: '90%',
      marginLeft: '10px',
      textAlign: 'center',
      fontWeight: 'bolder',
      fontSize: '12px',
      ':hover': {
        backgroundColor: state.data.color,
        color: state.data.color === 'yellow' ? 'black' : 'white',
      },
    }),
    control: (provided, state) => ({
      ...provided,
      backgroundColor: state.selectProps.value?.color || 'white',
      borderRadius: '4px',
      marginLeft: '10px',
      textAlign: 'center',
      width: '120px',
      height: '40px',
      fontSize: '12px',
      fontWeight: 'bolder',
    }),
    singleValue: (provided, state) => ({
      ...provided,
      color: state.selectProps.value?.color === 'yellow' ? 'black' : 'white',
    }),
  };

  return (
    <>
      <ToastContainer />
      <AddInvoice
        open={openModal}
        onClose={() => {
          setopenModal(false);
        }}
        onUpdate={() => setOnUpdate(!onUpdate)}
        showToast={showToast}
      />
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
                onChange={(e) => setfilter(e.target.value)}
              />
            </div>
            <Select
              options={statusOptions}
              styles={customStyles}
              onChange={(e) => setfilter(e.value)}
              isSearchable={false}
            />
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
