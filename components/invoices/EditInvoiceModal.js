'use client';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { updateInvoice } from '../../app/lib/actions';
import { formatDateToString } from '../../app/lib/utils';
import { toast } from 'react-hot-toast';

const InlineEditInvoice = ({ invoice, isEditing, toggleEdit }) => {
  const updateInvoiceWithId = updateInvoice.bind(null, invoice._id);
  const [items, setItems] = useState([]);

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

  // useEffect(() => {
  //   if (invoice && Object.keys(invoice).length !== 1) {
  //     Object.entries(invoice).forEach(([key, value]) => {
  //       if (key === 'dateIssued' || key === 'dateDue') {
  //         setValue(key, new Date(value).toISOString().split('T')[0]);
  //       } else {
  //         setValue(key, value, { shouldValidate: true });
  //       }
  //     });
  //     setItems(invoice.items || []);
  //   }
  // }, [invoice, setValue]);

  const calculateDueDate = (issuedDate, freq) => {
    if (issuedDate && freq) {
      const dueDate = new Date(issuedDate);
      const monthsToAdd = Math.floor(12 / parseInt(freq));
      dueDate.setUTCMonth(dueDate.getUTCMonth() + monthsToAdd);

      return dueDate.toISOString().split('T')[0];
    }
    return;
  };

  // const addItem = () => {
  //   const newItems = [...items, { description: '', price: '' }];
  //   setItems(newItems);
  // };

  // const deleteItem = (index) => {
  //   if (items.length > 1) {
  //     const updatedItems = items.filter((_, i) => i !== index);
  //     setItems(updatedItems);
  //   }
  // };

  const onSubmit = async (formData) => {
    try {
      await updateInvoiceWithId(formData);
      toast.success('Invoice updated successfully');
      toggleEdit();
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
    <div className='w-full md:w-[65%] px-2 mb-4'>
      <div className='border rounded shadow'>
        <div className='px-4 py-2 border-b text-xl'>Invoice Information</div>
        <form onSubmit={handleSubmit(onSubmit)} className='p-4'>
          <ul className='flex flex-col space-y-2 w-full'>
            {inputFields.map(
              ({ name, type, isRequired, readOnly, minLength, maxLength }) => (
                <li key={name} className='flex flex-row w-full'>
                  <strong className={isEditing ? 'w-[15%]' : 'w-[10%]'}>
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
                    <div className='ml-2'>
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

export default InlineEditInvoice;
