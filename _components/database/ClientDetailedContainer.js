'use client';
import { useState } from 'react';
import { FaPenSquare, FaArrowLeft } from 'react-icons/fa';
import TransactionHistory from './TransactionHistory';
import InlineEditClient from './EditClientModal';
import { useRouter } from 'next/navigation';

const ClientDetailedContainer = ({ client, invoices }) => {
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
          onClick={() => router.replace('/database')}
        >
          <FaArrowLeft />
          <span>Back</span>
        </button>
        <button className='bg-darkGreen text-white py-2 px-4 rounded inline-flex items-center mr-2' onClick={toggleEdit}>
          <FaPenSquare />
          <span>Edit</span>
        </button>
      </div>
      <div className='flex flex-wrap -mx-2'>
        <InlineEditClient client={client} isEditing={isEditing} toggleEdit={toggleEdit} />
        <TransactionHistory invoices={invoices} />
      </div>
    </>
  );
};

export default ClientDetailedContainer;
