'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { createClient } from '../../app/lib/actions';
import toast from 'react-hot-toast';
import { isTextKey, isNumberKey } from '../../app/lib/utils';

const AddClient = ({ show, onHide }) => {
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  const inputFields = [
    {
      name: 'clientName',
      type: 'text',
      placeholder: "Client's Name",
      isRequired: true,
      minLength: false,
    },
    {
      name: 'prefix',
      type: 'text',
      placeholder: 'Invoice Prefix',
      isRequired: true,
      minLength: 3,
      maxLength: 3,
      onKeyDown: isTextKey,
    },
    { name: 'email', type: 'email', placeholder: 'Email', isRequired: true },
    {
      name: 'phoneNumber',
      type: 'tel',
      placeholder: 'Phone Number',
      isRequired: true,
      onKeyDown: isNumberKey,
    },
    {
      name: 'notes',
      type: 'textarea',
      placeholder: 'Notes',
      isRequired: false,
    },
  ];

  const handleSave = async (values) => {
    setIsLoading(true);
    try {
      await createClient(values);
      onHide();
      reset();
      toast.success('New client has been successfully added.');
    } catch (error) {
      console.error('Error saving client:', error);
      toast.error('Error saving client. Please Check Input Fields');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Offcanvas Background Overlay */}
      <div
        className={` fixed inset-0 z-10 transition-opacity duration-300 bg-[#1f293799] ${
          show ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onHide}
      ></div>

      {/* Offcanvas Content */}
      <div
        className={`fixed top-0 right-0 z-30 flex h-screen max-w-full transition-transform duration-300 w-1/3 ${
          show ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className='flex w-full flex-col bg-white shadow-lg'>
          <div className='flex flex-row w-full items-center justify-between bg-darkGreen p-2'>
            <h2 className='text-lg font-medium text-white'>Add New Client</h2>
            <button
              onClick={onHide}
              className='rounded-md p-2 text-white hover:text-gray-500'
            >
              <span className='sr-only'>Close</span>X
            </button>
          </div>

          {/* Form */}
          <form
            onSubmit={handleSubmit(handleSave)}
            className='mt-4 space-y-6 p-4'
          >
            {inputFields.map(
              ({
                name,
                type,
                placeholder,
                isRequired,
                maxLength,
                minLength,
                onKeyDown,
              }) => (
                <div key={name} className='field'>
                  {type === 'textarea' ? (
                    <textarea
                      {...register(name, { required: isRequired })}
                      placeholder={placeholder}
                      className=' w-full h-24 text-gray-700 outline-none focus:ring-2 focus:ring-darkGreen border-2 focus:border-darkGreen border-gray-400 rounded p-2'
                    />
                  ) : (
                    <input
                      {...register(name, {
                        required: isRequired,
                        minLength: minLength,
                        maxLength: maxLength,
                      })}
                      type={type}
                      placeholder={placeholder}
                      onKeyDown={onKeyDown}
                      className={
                        name === 'prefix'
                          ? 'w-full uppercase text-black outline-none focus:ring-2 focus:ring-darkGreen border-2 focus:border-darkGreen border-gray-400 rounded p-2'
                          : 'w-full text-black outline-none focus:ring-2 focus:ring-darkGreen border-2 focus:border-darkGreen border-gray-400 rounded p-2'
                      }
                    />
                  )}
                  {errors[name] && errors[name].type === 'required' && (
                    <p className='text-red-500 text-xs mt-1'>
                      {name} is required
                    </p>
                  )}
                  {errors[name] && errors[name].type === 'minLength' && (
                    <p className='text-red-500 text-xs mt-1'>
                      {name} must be at least 3 characters
                    </p>
                  )}
                  {errors[name] && errors[name].type === 'maxLength' && (
                    <p className='text-red-500 text-xs mt-1'>
                      {name} Cannot be more than 3 characters
                    </p>
                  )}
                </div>
              )
            )}
            <div className='flex justify-center'>
              <button
                type='submit'
                className={`btn ${
                  isLoading ? 'loading' : ''
                } bg-darkGreen text-white hover:bg-darkBlue w-full`}
              >
                {isLoading ? 'Adding...' : 'Add Client'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default AddClient;
