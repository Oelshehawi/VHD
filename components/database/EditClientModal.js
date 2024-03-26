'use client';
import toast from 'react-hot-toast';
import { updateClient } from '../../app/lib/actions';
import { useForm } from 'react-hook-form';

const InlineEditClient = ({ client, isEditing, toggleEdit }) => {
  const updateClientWithId = updateClient.bind(null, client._id);
  const { register, handleSubmit } = useForm();

  const onSubmit = async (formData) => {
    try {
      await updateClientWithId(formData);
      toast.success('Client updated successfully');
      toggleEdit(); 
    } catch (error) {
      console.error('Error updating client:', error);
      toast.error('Failed to update client');
    }
  };


  return (
    <div className='w-full md:w-1/2 px-2 mb-4'>
      <div className='border rounded shadow'>
        <div className='px-4 py-2 border-b text-xl'>Client Information</div>
        <form onSubmit={handleSubmit(onSubmit)} className='p-4'>
          <ul className='flex flex-col justify-between space-y-2 w-full'>
            <li className='flex flex-row  w-full lg:w-3/4'>
              <strong className={isEditing ? 'w-[30%] lg:w-1/6': 'lg:w-[10%]'}>Name:</strong>
              {isEditing ? (
                <input
                  type='text'
                  className='ml-2 w-full text-black outline-none focus:ring-2 focus:ring-darkGreen border-2 focus:border-darkGreen border-gray-400 rounded p-2'
                  defaultValue={client.clientName}
                  {...register('clientName')}
                />
              ) : (
                <div className='ml-2'>{client.clientName}</div>
              )}
            </li>
            <li className='flex flex-row  w-full lg:w-3/4'>
              <strong className={isEditing ? 'w-[30%] lg:w-1/6': 'lg:w-[10%]'}>Email:</strong>
              {isEditing ? (
                <input
                  type='email'
                  className='ml-2 w-full text-black outline-none focus:ring-2 focus:ring-darkGreen border-2 focus:border-darkGreen border-gray-400 rounded p-2'
                  defaultValue={client.email}
                  {...register('email')}
                />
              ) : (
                <div className='ml-2'>{client.email}</div>
              )}
            </li>
            <li className='flex flex-row w-full lg:w-3/4'>
              <strong className={isEditing ? 'w-[30%] lg:w-1/6': 'lg:w-[10%]'}>Phone:</strong>
              {isEditing ? (
                <input
                  type='tel'
                  className='ml-2 w-full text-black outline-none focus:ring-2 focus:ring-darkGreen border-2 focus:border-darkGreen border-gray-400 rounded p-2'
                  defaultValue={client.phoneNumber}
                  {...register('phoneNumber')}
                />
              ) : (
                <div className='ml-2'>{client.phoneNumber}</div>
              )}
            </li>
            <li className='flex flex-row w-full lg:w-3/4'>
              <strong className={isEditing ? 'w-[30%] lg:w-1/6': 'lg:w-[10%]'}>Notes:</strong>
              {isEditing ? (
                <textarea
                  className='ml-2 w-full h-24 text-gray-700 outline-none focus:ring-2 focus:ring-darkGreen border-2 focus:border-darkGreen border-gray-400 rounded p-2'
                  defaultValue={client.notes}
                  {...register('notes')}
                />
              ) : (
                <div className='ml-2'>{client.notes}</div>
              )}
            </li>
          </ul>
          {isEditing && (
            <div className='flex justify-end mt-4 space-x-2'>
              <button
                type='button'
                onClick={toggleEdit}
                className='px-4 py-2 bg-gray-200 rounded text-gray-600'
              >
                Cancel
              </button>
              <button
                type='submit'
                className='px-4 py-2 bg-darkGreen rounded text-white'
              >
                Save
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default InlineEditClient;
