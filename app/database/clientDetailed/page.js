'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FaTrashAlt } from 'react-icons/fa';
import { FaPenSquare } from 'react-icons/fa';
import { FaArrowLeft } from 'react-icons/fa';
import axios from 'axios';
import { ToastContainer, toast, Slide } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import clientDetailed from './clientDetailed.module.css';
import EditModal from '../../../components/EditClientModal';

const ClientDetailed = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const [client, setClientData] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [openModal, setopenModal] = useState(false);
  const [onUpdate, setOnUpdate] = useState(false);
  const [loadingInvoices, setLoadingInvoices] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const clientResponse = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/clients/${id}`
        );
        setClientData(clientResponse.data);

        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/invoices?prefix=${clientResponse.data.prefix}`
        );
        setInvoices(response.data);
        setLoadingInvoices(false);
      } catch (error) {
        console.error(error);
      }
    };
    fetchData();
  }, [onUpdate]);

  // Fallback behavior if id is not available or clientData is empty
  if (client.length === 0) {
    return (
      <div className={clientDetailed.loadingContainer}>
        <div className={clientDetailed.loader}></div>
      </div>
    );
  }

  const handleDelete = async () => {
    try {
      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL}/clients/${client._id}`
      );
      console.log('Record deleted successfully');
      router.push('/database');
    } catch (error) {
      console.log('Error deleting record:', error);
    }
  };

  const details = [
    {
      name: 'Client Name',
      value: client.clientName,
    },
    {
      name: 'Phone Number',
      value: client.phoneNumber,
    },
    {
      name: 'Email',
      value: client.email,
    },
    {
      name: 'Address',
      value: client.location,
    },
    {
      name: 'frequency',
      value: client.frequency,
    },
    {
      name: 'Notes',
      value: client.notes,
    },
  ];

  const handleBack = () => {
    router.push('/database');
  };

  const redirectToInvoiceDetails = (invoiceId) => {
    router.push(`/invoices/invoiceDetailed?id=${invoiceId}`);
  };

  return (
    <>
      <EditModal
        open={openModal}
        client={client}
        onClose={() => {
          setopenModal(false);
        }}
        onUpdate={() => setOnUpdate(!onUpdate)}
      />
      <div className={clientDetailed.dataContainer}>
        <div className={clientDetailed.clientHeader}>
          <div className={clientDetailed.clientTitleContainer}>
            <FaArrowLeft
              className={clientDetailed.clientBackArrow}
              onClick={handleBack}
            />
            <div className={clientDetailed.clientTitle}>
              {' '}
              {client.clientName}
            </div>
          </div>
          <div className={clientDetailed.clientButtons}>
            <div
              className={clientDetailed.clientButtonContainer}
              onClick={() => setopenModal(true)}
            >
              <FaPenSquare />
              <button className={clientDetailed.clientButton}>{'Edit'}</button>
            </div>
            <div
              className={clientDetailed.clientButtonContainer}
              onClick={handleDelete}
            >
              <FaTrashAlt />
              <button className={clientDetailed.clientButton}>
                {'Delete'}
              </button>
            </div>
          </div>
        </div>
        <ToastContainer />
      </div>
      <div className={clientDetailed.clientDetailsContainer}>
        <div className={clientDetailed.clientInformation}>
          <div className={clientDetailed.clientInformationHeader}>
            {'Client Information'}
          </div>
          <div className={clientDetailed.clientInformationContent}>
            {details.map(({ name, value }) => (
              <div className={clientDetailed.clientInformationOrder} key={name}>
                <p className={clientDetailed.clientDetailTitle}>{name}</p>
                <p className={clientDetailed.clientDetailMain}>{value}</p>
              </div>
            ))}
          </div>
        </div>
        <div className={clientDetailed.clientTransactionHistory}>
          <div className={clientDetailed.clientTransactionHistoryHeader}>
            {'Transaction History'}
          </div>
          {loadingInvoices ? (
            <div className={clientDetailed.loadingContainer}>
              <div className={clientDetailed.loader}></div>
            </div>
          ) : (
            <div className={clientDetailed.invoiceItemContainer}>
              {invoices.length === 0 ? (
                <p className={clientDetailed.notAvailable}>
                  No invoices available
                </p>
              ) : (
                invoices.map((invoice) => (
                  <p
                    key={invoice._id}
                    className={clientDetailed.invoiceItem}
                    onClick={() => redirectToInvoiceDetails(invoice._id)}
                  >
                    #{invoice.invoiceId} - {invoice.dateIssued.split('T')[0]} -{' '}
                    {invoice.jobTitle}
                  </p>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ClientDetailed;
