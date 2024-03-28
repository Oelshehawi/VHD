'use client';
import { useState } from 'react';
import { FaPenSquare, FaArrowLeft } from 'react-icons/fa';
import InlineEditInvoice from './EditInvoiceModal';
import ClientDetails from './ClientDetails';
import { useRouter } from 'next/navigation';
import PriceBreakdown from './PriceBreakdown';

const InvoiceDetailsContainer = ({ invoice, client }) => {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const toggleEdit = () => {
    setIsEditing(!isEditing);
  };

  return (
    <>
      <div className='flex mb-4 justify-between'>
        <button
          className='bg-gray-200 text-gray-600 py-2 px-4 rounded inline-flex items-center'
          onClick={() => router.push('/invoices')}
        >
          <FaArrowLeft />
          <span>Back</span>
        </button>
        <button
          className='bg-darkGreen text-white py-2 px-4 rounded inline-flex items-center mr-2'
          onClick={toggleEdit}
        >
          <FaPenSquare />
          <span>Edit</span>
        </button>
      </div>
      <div className='flex flex-wrap lg:flex-nowrap text-sm lg:text-[1rem] -mx-2'>
        <InlineEditInvoice
          invoice={invoice}
          isEditing={isEditing}
          toggleEdit={toggleEdit}
        />
        <ClientDetails client={client} />
      </div>
      <PriceBreakdown
        invoice={invoice}
      />
    </>
  );
};

export default InvoiceDetailsContainer;
