'use client';
import { useState } from 'react';
import AddClient from './AddClient';
import ClientTable from './ClientTable';

const ClientContainer = ({ clientData }) => {
  const [openModal, setopenModal] = useState(false);

  return (
    <div className='bg-white rounded-lg shadow-lg w-[90%] lg:w-4/5 p-4 min-h-[90vh] my-5 lg:my-0'>
      <AddClient
        show={openModal}
        onHide={() => setopenModal(false)}
      />
      <div className='flex flex-row items-center justify-between my-2'>
        <div className='text-xl fw-bold'>Clients</div>
        <button
          onClick={() => setopenModal(true)}
          className='hover:bg-darkBlue bg-darkGreen text-white font-bold h-full py-2 px-4 rounded shadow-sm'
        >
          {'Add Client'}
        </button>
      </div>
      <div className=''>
        <ClientTable clientData={clientData} />
      </div>
    </div>
  );
};

export default ClientContainer;
