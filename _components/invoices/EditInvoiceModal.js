'use client';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { updateInvoice } from '../../app/lib/actions';
import { formatDateToString } from '../../app/lib/utils';
import { toast } from 'react-hot-toast';
import { calculateDueDate } from '../../app/lib/utils';

const InlineEditInvoice = ({ invoice, isEditing, toggleEdit }) => {
  const updateInvoiceWithId = updateInvoice.bind(null, invoice._id);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm();

  const dateIssued = watch('dateIssued');
  const frequency = watch('frequency');

  useEffect(() => {
    const updatedDateDue = calculateDueDate(dateIssued, frequency);
    setValue('dateDue', updatedDateDue);
  }, [dateIssued, frequency, setValue]);

  const onSubmit = async (formData) => {
    try {
      await updateInvoiceWithId(formData);
      toast.success('Invoice updated successfully');
      if (!formData.status) {
        toggleEdit();
      }
    } catch (error) {
      console.error('Error updating Invoice', error);
      toast.error('Failed to update invoice');
    }
  };

  const inputFields = [
    {
      name: 'invoiceId',
      type: 'text',
      placeholder: 'Invoice ID',
      isRequired: true,
      readOnly: true,
    },
    {
      name: 'jobTitle',
      type: 'text',
      placeholder: 'Job Title',
      isRequired: false,
    },
    {
      name: 'dateIssued',
      type: 'date',
      placeholder: 'Date Issued',
      isRequired: true,
    },
    {
      name: 'dateDue',
      type: 'text',
      placeholder: 'Date Due',
      isRequired: true,
      readOnly: true,
    },
    {
      name: 'frequency',
      type: 'number',
      placeholder: 'Frequency',
      isRequired: true,
      minLength: 1,
      maxLength: 1,
    },
    {
      name: 'location',
      type: 'text',
      placeholder: 'Location',
      isRequired: false,
    },
    {
      name: 'notes',
      type: 'textarea',
      placeholder: 'Additional Notes',
      isRequired: false,
    },
  ];

  return (
    <div className='w-full lg:w-[60%] pl-2 mb-4'>
      <div className='border rounded shadow'>
        <div className='flex flex-row items-center justify-between px-4 py-2 border-b text-xl'>
          <div>Invoice Information</div>
          <InvoiceStatusUpdate
            onSubmit={onSubmit}
            invoiceStatus={invoice.status}
          />
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className='p-4'>
          <ul className='flex flex-col space-y-2 w-full'>
            {inputFields.map(
              ({ name, type, isRequired, readOnly, minLength, maxLength }) => (
                <li key={name} className='flex flex-col lg:flex-row w-full'>
                  <strong className={isEditing ? 'w-[15%]' : 'w-[11%]'}>
                    {name.charAt(0).toUpperCase() + name.slice(1)}:
                  </strong>
                  {isEditing ? (
                    <>
                      {type === 'textarea' ? (
                        <>
                          <textarea
                            {...register(name, { required: isRequired })}
                            className=' w-full text-black outline-none focus:ring-2 focus:ring-darkGreen border-2 focus:border-darkGreen border-gray-400 rounded p-2'
                            defaultValue={invoice[name]}
                          />
                          {errors[name] && (
                            <p className='text-red-500 text-xs mt-1'>
                              {errors[name].message || `${name} is required`}
                            </p>
                          )}
                        </>
                      ) : (
                        <div className='flex flex-col w-full '>
                          <input
                            type={type}
                            {...register(name, {
                              required: isRequired,
                              minLength: minLength,
                              maxLength: maxLength,
                            })}
                            className=' w-full text-black outline-none focus:ring-2 focus:ring-darkGreen border-2 focus:border-darkGreen border-gray-400 rounded p-2'
                            readOnly={readOnly}
                            defaultValue={invoice[name]}
                          />
                          {errors[name] && (
                            <p className='text-red-500 text-xs mt-1'>
                              {errors[name].message ||
                                `${name} is ${isRequired ? 'required' : ''}${
                                  minLength
                                    ? `must have at most ${minLength} characters`
                                    : ''
                                }`}
                            </p>
                          )}
                        </div>
                      )}
                    </>
                  ) : (
                    <div
                      className='w-full lg:w-auto overflow-auto'
                      style={{ maxWidth: '500px', wordWrap: 'break-word' }}
                    >
                      {name === 'dateDue' || name === 'dateIssued'
                        ? formatDateToString(invoice[name])
                        : invoice[name]}
                    </div>
                  )}
                </li>
              )
            )}
          </ul>
          {isEditing && (
            <div className='flex justify-end space-x-2 mt-4'>
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
                Save Changes
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

const InvoiceStatusUpdate = ({ onSubmit, invoiceStatus }) => {
  const { register, handleSubmit, setValue } = useForm();
  const [status, setStatus] = useState(invoiceStatus);

  const handleChange = (e) => {
    const selectedStatus = e.target.value;
    setStatus(selectedStatus);
    setValue('status', selectedStatus);
    handleSubmit(onSubmit)({ status: selectedStatus });
  };

  return (
    <form className='flex h-full items-center justify-end w-1/2'>
      <div className=''>
        <select
          id='status'
          {...register('status')}
          onChange={handleChange}
          className={`text-center appearance-none w-full border hover:cursor-pointer border-gray-400 hover:border-gray-500 px-4 py-2 rounded shadow leading-tight focus:outline-none focus:shadow-outline ${
            status === 'paid'
              ? 'bg-green-500'
              : status === 'overdue'
              ? 'bg-red-500'
              : 'bg-yellow-500'
          }`}
          defaultValue={invoiceStatus}
        >
          <option className='bg-green-500 text-center' value='paid'>
            Paid
          </option>
          <option className='bg-red-500' value='overdue'>
            Overdue
          </option>
          <option className='bg-yellow-500' value='pending'>
            Pending
          </option>
        </select>
      </div>
    </form>
  );
};

export default InlineEditInvoice;
