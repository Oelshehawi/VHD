'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FaTrashAlt } from 'react-icons/fa';
import { FaPenSquare } from 'react-icons/fa';
import { FaArrowLeft } from 'react-icons/fa';
import { FaUser } from 'react-icons/fa';
import { FaRegEnvelope } from 'react-icons/fa';
import { FaPhoneAlt } from 'react-icons/fa';
import axios from 'axios';
import { ToastContainer, toast, Slide } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import invoiceDetailed from './invoiceDetailed.module.css';
import EditModal from '../../../components/EditInvoiceModal';
import Select from 'react-select';
import DeleteModal from '../../../components/DeleteModal';

const InvoiceDetailed = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const [client, setClientData] = useState([]);
  const [invoice, setInvoiceData] = useState([]);
  const [openModal, setopenModal] = useState(false);
  const [onUpdate, setOnUpdate] = useState(false);
  const [open, setOpen] = useState(false);

  const handleCloseModal = () => {
    setOpen(false);
  };

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
          `${process.env.NEXT_PUBLIC_API_URL}/clients?prefix=${
            invoiceResponse.data.invoiceId.split('-')[0]
          }`
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
      setOpen(false);
      showDeleteEventToast();
      router.push('/invoices');
    } catch (error) {
      console.log('Error deleting record:', error);
    }
  };

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

  const redirectToClientDetails = (clientId) => {
    router.push(`/database/clientDetailed?id=${clientId}`);
  };

  const issuedDate = new Date(invoice.dateIssued).toLocaleString('en-US', {
    timeZone: 'UTC',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const dueDate = new Date(invoice.dateDue).toLocaleString('en-US', {
    timeZone: 'UTC',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const formattedDates = `Issued on ${issuedDate} - Due on ${dueDate}`;

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
        showToast={showUpdateToast}
      />
      <div className={invoiceDetailed.dataContainer}>
        <div className={invoiceDetailed.invoiceHeader}>
          <div className={invoiceDetailed.invoiceTitleContainer}>
            <FaArrowLeft
              className={invoiceDetailed.invoiceBackArrow}
              onClick={handleBack}
            />
            <div className={invoiceDetailed.invoiceTitle}>
              Invoice #{invoice.invoiceId}
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
              onClick={() => setOpen(true)}
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
            <div className={invoiceDetailed.invoiceInformationTitle}>
              {'Invoice #' + invoice.invoiceId}
            </div>
            <div className={invoiceDetailed.invoiceInformationSubtitle}>
              <span>{formattedDates}</span>
              <span>Address : {invoice.location}</span>
              <span>Frequency : {invoice.frequency} Cleanings per Year</span>
            </div>
          </div>
          <div className={invoiceDetailed.invoiceInformationContent}>
            <div className={invoiceDetailed.invoiceCostBreakdown}>
              <div className={invoiceDetailed.invoiceCostHeader}>
                {'Cost Breakdown'}
              </div>
              <div className={invoiceDetailed.invoiceCostContent}>
                {invoice.items.map((item, index) => (
                  <div key={index} className={invoiceDetailed.invoiceCostItem}>
                    <p className={invoiceDetailed.fullHeight}>
                      {item.description} :
                    </p>
                    <p>${item.price}</p>
                  </div>
                ))}
                <p className={invoiceDetailed.invoiceCostTax}>
                  <span>GST (5%) :</span>$
                  {(
                    invoice.items.reduce(
                      (acc, item) => acc + parseFloat(item.price),
                      0
                    ) * 0.05
                  ).toFixed(2)}
                </p>
                <div className={invoiceDetailed.invoiceCostTotal}>
                  <p>Amount Due :</p>
                  <p>${Total + Total * 0.05}</p>
                </div>
              </div>
            </div>
            <div className={invoiceDetailed.invoiceInformationFooter}>
              {'Additional Notes :'}
              <p className={invoiceDetailed.lighterText}> {invoice.notes}</p>
            </div>
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
          <div className={invoiceDetailed.invoiceClient}>
            <div className={invoiceDetailed.invoiceClientTitle}>
              {'Client Details'}
            </div>
            <div className={invoiceDetailed.invoiceClientInfo}>
              {client[0] && (
                <>
                  <p
                    className={invoiceDetailed.invoiceClientPara}
                    onClick={() => redirectToClientDetails(client[0]._id)}
                  >
                    <FaUser />
                    {client[0].clientName}
                  </p>
                  <p className={invoiceDetailed.invoiceClientPara}>
                    <FaRegEnvelope />
                    {client[0].email}
                  </p>
                  <p className={invoiceDetailed.invoiceClientPara}>
                    <FaPhoneAlt />
                    {client[0].phoneNumber}
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      <DeleteModal
        showModal={open}
        hideModal={handleCloseModal}
        confirmModal={handleDelete}
      >
      </DeleteModal>
    </>
  );
};

export default InvoiceDetailed;
