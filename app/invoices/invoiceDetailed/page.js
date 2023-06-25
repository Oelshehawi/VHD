'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FaTrashAlt } from 'react-icons/fa';
import { FaPenSquare } from 'react-icons/fa';
import { FaArrowLeft } from 'react-icons/fa';
import axios from 'axios';
import { ToastContainer, toast, Slide } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import invoiceDetailed from './invoiceDetailed.module.css';
import EditModal from '../../../components/EditInvoiceModal';
import Select from 'react-select';

const InvoiceDetailed = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const [client, setClientData] = useState([]);
  const [invoice, setInvoiceData] = useState([]);
  const [openModal, setopenModal] = useState(false);
  const [onUpdate, setOnUpdate] = useState(false);

  const showUpdateToast = () => {
    toast.success('Client Updated Successfully!', {
      transition: Slide,
      position: 'bottom-right',
    });
  };

  const showDeleteEventToast = () => {
    toast.success('Event Deleted Successfully!', {
      position: 'bottom-right',
      transition: Slide,
    });
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const invoiceResponse = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/invoices/${id}`
        );

        setInvoiceData(invoiceResponse.data);

        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/clients?prefix=${invoiceResponse.data.invoiceId.split('-')[0]}`
        );
        setClientData(response.data);
      } catch (error) {
        console.error(error);
      }
    };
    fetchData();
  }, [onUpdate]);

  if (!id || invoice.length === 0) {
    return (
      <div className={invoiceDetailed.loadingContainer}>
        <div className={invoiceDetailed.loader}></div>
      </div>
    );
  }

  const handleDelete = async () => {
    try {
      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL}/invoices/${invoice._id}`
      );
      console.log('Record deleted successfully');
      router.push('/invoices');
      showDeleteEventToast();
    } catch (error) {
      console.log('Error deleting record:', error);
    }
  };

  const details = [
    {
      name: 'Invoice ID',
      value: invoice.invoiceId,
    },
    {
      name: 'Job Title',
      value: invoice.jobTitle,
    },
    {
      name: 'Date Issued',
      value: invoice.dateIssued,
    },
    {
      name: 'Date Due',
      value: invoice.dateDue,
    },
    {
      name: 'Status',
      value: invoice.status,
    },
    {
      name: 'Amount',
      value: invoice.price,
    },
  ];

  let Total = 0;
  for (let i = 0; i < invoice.items.length; i++) {
    Total += invoice.items[i].price;
  }

  const statusOptions = [
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
      ':hover': {
        backgroundColor: state.data.color,
        color: state.data.color === 'yellow' ? 'black' : 'white',
      },
    }),
    control: (provided, state) => ({
      ...provided,
      backgroundColor: state.selectProps.value?.color || 'white',
      borderRadius: '4px',
      width: '150px',
      textAlign: 'center',
    }),
    singleValue: (provided, state) => ({
      ...provided,
      color: state.selectProps.value?.color === 'yellow' ? 'black' : 'white',
    }),
  };

  const handleStatusChange = async (e) => {
    const updatedStatus = e.value;

    try {
      const response = await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/invoices/${invoice._id}`,
        { status: updatedStatus }
      );
      console.log('Invoice status updated successfully!');
      setOnUpdate(!onUpdate);
      showUpdateToast();
    } catch (error) {
      console.log('Error updating invoice status:', error);
    }
  };

  const handleBack = () => {
    router.push('/invoices');
  };

  return (
    <>
      <ToastContainer />
      <EditModal
        open={openModal}
        invoice={invoice}
        client={client}
        onClose={() => {
          setopenModal(false);
        }}
        onUpdate={() => setOnUpdate(!onUpdate)}
      />
      <div className={invoiceDetailed.dataContainer}>
        <div className={invoiceDetailed.invoiceHeader}>
          <div className={invoiceDetailed.invoiceTitleContainer}>
            <FaArrowLeft
              className={invoiceDetailed.invoiceBackArrow}
              onClick={handleBack}
            />
            <div className={invoiceDetailed.invoiceTitle}>
              Invoice {invoice.invoiceId}
            </div>
          </div>
          <div className={invoiceDetailed.invoiceButtons}>
            <div
              className={invoiceDetailed.invoiceButtonContainer}
              onClick={() => setopenModal(true)}
            >
              <FaPenSquare />
              <button className={invoiceDetailed.invoiceButton}>
                {'Edit'}
              </button>
            </div>
            <div
              className={invoiceDetailed.invoiceButtonContainer}
              onClick={handleDelete}
            >
              <FaTrashAlt />
              <button className={invoiceDetailed.invoiceButton}>
                {'Delete'}
              </button>
            </div>
          </div>
        </div>
        <ToastContainer />
      </div>
      <div className={invoiceDetailed.invoiceDetailsContainer}>
        <div className={invoiceDetailed.invoiceInformation}>
          <div className={invoiceDetailed.invoiceInformationHeader}>
            {'invoice Information'}
          </div>
          <div className={invoiceDetailed.invoiceInformationContent}>
            {details.map(({ name, value }) => (
              <div
                className={invoiceDetailed.invoiceInformationOrder}
                key={name}
              >
                <p className={invoiceDetailed.invoiceDetailTitle}>{name}</p>
                <p className={invoiceDetailed.invoiceDetailMain}>{value}</p>
              </div>
            ))}
          </div>
        </div>
        <div className={invoiceDetailed.invoiceContainer}>
          <div className={invoiceDetailed.invoiceStatusContainer}>
            <div className={invoiceDetailed.invoiceTotal}>
              $ {Total + Total * 0.05}
            </div>
            <div className={invoiceDetailed.invoiceStatus}>
              <Select
                options={statusOptions}
                defaultValue={statusOptions.find(
                  (option) => option.value === invoice.status
                )}
                styles={customStyles}
                onChange={handleStatusChange}
                isSearchable={false}
              />
            </div>
          </div>
          <div className={invoiceDetailed.invoiceClient}></div>
        </div>
      </div>
    </>
  );
};

export default InvoiceDetailed;
