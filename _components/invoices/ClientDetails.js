import Link from 'next/link';
import { FaPhone, FaEnvelope, FaUser } from 'react-icons/fa';

const ClientDetails = ({ client }) => {
  return (
    <div className='w-full lg:w-[40%] mb-4 px-2'>
      <div className='border rounded shadow'>
        <div className='px-4 py-2 border-b text-xl'>Client Information</div>
        <div className='p-4'>
          <ul className='flex flex-col space-y-2 w-full p-1'>
            <li className='flex flex-row w-full items-center py-2'>
              <Link
                href={`/database/${client._id}`}
                className=' text-blue-600 hover:underline'
              >
                <div className=' flex items-center font-bold'>
                  <FaUser className='mr-2 text-darkGreen size-6' />
                  {client.clientName}
                </div>
              </Link>
            </li>
            <li className='flex flex-row w-full items-center py-2 font-bold'>
              <div className=' flex items-center'>
                <FaEnvelope className='mr-2 text-darkGreen size-6' />
                {client.email}
              </div>
            </li>
            <li className='flex flex-row w-full items-center py-2 font-bold'>
              <div className=' flex items-center'>
                <FaPhone className='mr-2 text-darkGreen size-6' />
                {client.phoneNumber}
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ClientDetails;
