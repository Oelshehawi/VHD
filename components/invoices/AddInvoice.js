'use client';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { FaTrash, FaPlus } from 'react-icons/fa';
import { calculateDueDate } from '../../app/lib/utils';
import { createInvoice } from '../../app/lib/actions';

const AddInvoice = ({ clients, show, onHide }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [items, setItems] = useState([{ description: '', price: '' }]);

  const {
    register,
    handleSubmit,
    reset,
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

  const addItem = () => {
    setItems([...items, { description: '', price: 0 }]);
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...items];
    updatedItems[index][field] = value;
    setItems(updatedItems);
  };

  const deleteItem = (index) => {
    if (items.length > 1) {
      console.log(items);
      const updatedItems = items.filter((_, i) => i !== index);
      setItems(updatedItems);
      setValue('items', updatedItems);
    }
  };

  const handleSave = async (data) => {
    setIsLoading(true);
    try {
      await createInvoice(data);
      toast.success('Invoice has been successfully added.');
      onHide();
      reset();
    } catch (error) {
      console.error('Error saving invoice:', error);
      toast.error('Error saving invoice. Please check input fields');
    } finally {
      setIsLoading(false);
    }
  };

  const inputFields = [
    {
      name: 'clientId',
      type: 'select',
      placeholder: 'Select Client',
      isRequired: true,
    },
    {
      name: 'jobTitle',
      type: 'text',
      placeholder: 'Job Title',
      isRequired: true,
    },
    {
      name: 'frequency',
      type: 'number',
      placeholder: 'Frequency (per year)',
      isRequired: true,
      minLength: 1,
      maxLength: 1,
    },
    {
      name: 'location',
      type: 'text',
      placeholder: 'Location',
      isRequired: true,
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
      name: 'notes',
      type: 'textarea',
      placeholder: 'Additional Notes',
      isRequired: false,
    },
  ];

  const handleClientChange = (e) => {
    const selectedClientId = e.target.value;
    const selectedClient = clients.find(
      (client) => client._id === selectedClientId
    );

    setValue('clientId', selectedClientId);
    if (selectedClient) {
      setValue('prefix', selectedClient.prefix);
    }
  };

  return (
    <>
      <div
        className={`fixed inset-0 z-10 transition-opacity duration-300 bg-[#1f293799] ${
          show ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onHide}
      ></div>
      <div
        className={`fixed top-0 right-0 z-30 flex h-screen max-w-full transition-transform duration-300 w-3/4 lg:w-1/3 ${
          show ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className='flex w-full flex-col bg-white shadow-lg'>
          <div className='flex flex-row w-full items-center justify-between bg-darkGreen p-2'>
            <h2 className='text-lg font-medium text-white'>Add New Invoice</h2>
            <button
              onClick={onHide}
              className='rounded-md p-2 text-white hover:text-gray-500'
            >
              X
            </button>
          </div>
          <form
            onSubmit={handleSubmit(handleSave)}
            className='mt-4 space-y-6 p-4 overflow-auto'
          >
            {inputFields.map(
              ({
                name,
                type,
                placeholder,
                isRequired,
                minLength,
                maxLength,
                readOnly
              }) => (
                <div key={name} className='field'>
                  {type === 'textarea' ? (
                    <textarea
                      {...register(name, { required: isRequired })}
                      placeholder={placeholder}
                      className='w-full h-24 text-gray-700 outline-none focus:ring-2 focus:ring-darkGreen border-2 focus:border-darkGreen border-gray-400 rounded p-2'
                    />
                  ) : type === 'select' ? (
                    <div className='field'>
                      <select
                        {...register('clientId', { required: true })}
                        onChange={handleClientChange}
                        className='w-full text-gray-700 outline-none focus:ring-2 focus:ring-darkGreen border-2 focus:border-darkGreen border-gray-400 rounded p-2'
                      >
                        <option value=''>Select Client</option>
                        {clients.map((client) => (
                          <option key={client._id} value={client._id}>
                            {client.clientName} - {client.email}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <input
                      {...register(name, {
                        required: isRequired,
                        minLength: minLength,
                        maxLength: maxLength,
                      })}
                      type={type}
                      placeholder={placeholder}
                      readOnly={readOnly}
                      className='w-full text-black outline-none focus:ring-2 focus:ring-darkGreen border-2 focus:border-darkGreen border-gray-400 rounded p-2'
                    />
                  )}
                  {errors[name] && errors[name].type === 'required' && (
                    <p className='text-red-500 text-xs mt-1'>
                      {name} is required
                    </p>
                  )}
                  {errors[name] && errors[name].type === 'minLength' && (
                    <p className='text-red-500 text-xs mt-1'>
                      {name} must be at least 1 characters
                    </p>
                  )}
                  {errors[name] && errors[name].type === 'maxLength' && (
                    <p className='text-red-500 text-xs mt-1'>
                      {name} Cannot be more than 1 characters
                    </p>
                  )}
                </div>
              )
            )}

            {/* Dynamically add item fields here */}

            {items.map((item, index) => (
              <div key={index} className='flex items-center justify-between w-full space-x-2'>
                <input
                  {...register(`items[${index}].description`, {
                    required: 'Item description is required',
                    onChange: (e) =>
                      handleItemChange(index, 'description', e.target.value),
                  })}
                  defaultValue={item.description}
                  placeholder='Item Description'
                  className='text-black outline-none w-3/5 focus:ring-2 focus:ring-darkGreen border-2 focus:border-darkGreen border-gray-400 rounded p-2'
                />
                {errors.items?.[index]?.description && (
                  <p className='text-red-500 text-xs'>
                    {errors.items[index].description.message}
                  </p>
                )}
                <input
                  {...register(`items[${index}].price`, {
                    required: 'Price is required',
                    valueAsNumber: true,
                    onChange: (e) =>
                      handleItemChange(index, 'price', e.target.value),
                  })}
                  defaultValue={item.price}
                  placeholder='Price'
                  type='number'
                  className='text-black w-1/5 outline-none focus:ring-2 focus:ring-darkGreen border-2 focus:border-darkGreen border-gray-400 rounded p-2'
                />
                {errors.items?.[index]?.price && (
                  <p className='text-red-500 text-xs'>
                    {errors.items[index].price.message}
                  </p>
                )}
                <FaTrash
                  className='cursor-pointer text-red-500 bg-darkGray rounded size-8 p-1'
                  onClick={() => deleteItem(index)}
                />
              </div>
            ))}
            <button
              type='button'
              onClick={addItem}
              className='hover:bg-darkGreen flex items-center justify-center flex-row bg-darkBlue text-white font-bold py-2 px-4 rounded shadow-sm'
            >
              <div>Add Item</div> <FaPlus />
            </button>
            <div className='flex justify-center'>
              <button
                type='submit'
                className={`btn ${
                  isLoading ? 'loading' : ''
                } bg-darkGreen text-white hover:bg-darkBlue w-full rounded p-2`}
              >
                {isLoading ? 'Saving...' : 'Save Invoice'}
              </button>
            </div>
          </form>
          <div className='flex justify-between items-center p-4'></div>
        </div>
      </div>
    </>
  );
};

export default AddInvoice;
