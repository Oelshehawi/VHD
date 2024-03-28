'use client';
import { useState } from 'react';
import { FaPenSquare, FaArrowLeft, FaPrint } from 'react-icons/fa';
import InlineEditInvoice from './EditInvoiceModal';
import ClientDetails from './ClientDetails';
import { useRouter } from 'next/navigation';
import PriceBreakdown from './PriceBreakdown';
import GeneratePDF from './GeneratePDF';
import { formatDateToString } from '../../app/lib/utils';

const InvoiceDetailsContainer = ({ invoice, client }) => {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const toggleEdit = () => {
    setIsEditing(!isEditing);
  };

  const calculateSubtotal = (items) =>
    items.reduce((acc, item) => acc + item.price, 0);
  const calculateGST = (subtotal) => subtotal * 0.05;
  const invoiceData = {
    invoiceId: invoice.invoiceId,
    dateIssued: formatDateToString(invoice.dateIssued),
    jobTitle: invoice.jobTitle,
    location: invoice.location,
    clientName: client.clientName,
    email: client.email,
    phoneNumber: client.phoneNumber,
    items: invoice.items.map((item) => ({
      description: item.description,
      price: item.price,
      total: item.price,
    })),
    subtotal: calculateSubtotal(invoice.items),
    gst: calculateGST(calculateSubtotal(invoice.items)),
    totalAmount:
      calculateSubtotal(invoice.items) +
      calculateGST(calculateSubtotal(invoice.items)),
    cheque: '51-11020 Williams Rd',
    eTransfer: 'adam@vancouverventcleaning.ca',
    terms: 'Please report any and all cleaning inquiries within 30 days.',
    thankYou: 'Thank you for choosing Vancouver Hood Doctors!',
  };

  return (
    <>
      <div className='flex mb-4 justify-between'>
        <button
          className='bg-gray-700 hover:bg-gray-900 text-white py-2 px-4 rounded inline-flex items-center'
          onClick={() => router.push('/invoices')}
        >
          <FaArrowLeft className='lg:mr-2' />
          <span>Back</span>
        </button>
        <div className='space-x-2'>
          <GeneratePDF invoiceData={invoiceData} />
          <button
            className='bg-darkGreen hover:bg-green-700 text-white py-2 px-4 rounded inline-flex items-center mr-2'
            onClick={toggleEdit}
          >
            <FaPenSquare className='lg:mr-2' />
            <span>Edit</span>
          </button>
        </div>
      </div>
      <div className='flex flex-wrap lg:flex-nowrap text-sm lg:text-[1rem] -mx-2'>
        <InlineEditInvoice
          invoice={invoice}
          isEditing={isEditing}
          toggleEdit={toggleEdit}
        />
        <ClientDetails client={client} />
      </div>
      <PriceBreakdown invoice={invoice} />
    </>
  );
};

export default InvoiceDetailsContainer;
