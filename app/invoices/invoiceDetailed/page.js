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

const InvoiceDetailed = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const [invoice, setInvoiceData] = useState([]);
  const [openModal, setopenModal] = useState(false);
  const [onUpdate, setOnUpdate] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/invoices/${id}`
        );
        setInvoiceData(response.data);
      } catch (error) {
        console.error(error);
      }
    };

    fetchData();
  }, [onUpdate]);

  // Fallback behavior if id is not available or invoiceData is empty
  if (!id || invoice.length === 0) {
    return (
      <div className={invoiceDetailed.loadingContainer}>
        <div className={invoiceDetailed.loader}></div>
      </div>
    ); // You can replace this with appropriate loading or error message
  }

  const handleDelete = async () => {
    try {
      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL}/invoices/${invoice._id}`
      );
      console.log('Record deleted successfully');
      router.push('/database');
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

  const handleBack = () => {
    router.push('/invoices');
  };

  return (
    <>
      <EditModal
        open={openModal}
        invoice={invoice}
        onClose={() => {
          setopenModal(false);
        }}
        onUpdate={() => setOnUpdate(!onUpdate)}
      />
      <div className={invoiceDetailed.dataContainer}>
        <div className={invoiceDetailed.invoiceHeader}>
          <div className={invoiceDetailed.invoiceTitle}>
            <FaArrowLeft
              className={invoiceDetailed.invoiceBackArrow}
              onClick={handleBack}
            />
            {'invoice NAME'}
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
        <div className={invoiceDetailed.invoiceTransactionHistory}>
          <div className={invoiceDetailed.invoiceTransactionHistoryHeader}>
            {'Transaction History'}
          </div>
        </div>
      </div>
    </>
  );
};

export default InvoiceDetailed;
