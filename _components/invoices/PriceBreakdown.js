'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { updateInvoice } from '../../app/lib/actions';
import { FaPen, FaPlus, FaTrash } from 'react-icons/fa';

const PriceBreakdown = ({ invoice }) => {
  const updateInvoiceWithId = updateInvoice.bind(null, invoice._id);
  const { register, handleSubmit, setValue } = useForm();
  const [isEditingAmount, setIsEditingAmount] = useState(false);
  const toggleEdit = () => {
    setIsEditingAmount(!isEditingAmount);
  };
  const [items, setItems] = useState(invoice.items);

  const addItem = () => {
    setItems([...items, { description: '', price: 0 }]);
  };

  const deleteItem = (index) => {
    if (items.length > 1) {
      const updatedItems = items.filter((_, i) => i !== index);
      setItems(updatedItems);
      setValue('items', updatedItems);
    }
  };

  const onSubmit = async (formData) => {
    try {
      await updateInvoiceWithId(formData);
      toast.success('Invoice status updated successfully');
      toggleEdit();
      setItems(formData.items);
    } catch (error) {
      console.error('Error updating invoice status:', error);
      toast.error('Failed to update invoice status');
    }
  };

  const calculateTotal = (items) => {
    const subtotal = items.reduce((acc, item) => acc + Number(item.price), 0);
    const gst = subtotal * 0.05;
    return (subtotal + gst).toFixed(2);
  };

  return (
    <div className='w-full lg:w-[60%] mb-4'>
      <div className='border rounded shadow overflow-auto'>
        <div className='flex flex-row justify-between items-center px-4 py-2 border-b text-xl'>
          <div>Price Breakdown</div>
          <FaPen
            className='cursor-pointer size-6 p-1 text-white bg-darkGreen rounded'
            onClick={toggleEdit}
          />
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className='p-4'>
          <ul className='flex flex-col space-y-2 w-full p-1'>
            {items.map((item, index) => (
              <li
                key={index}
                className='flex items-center justify-between py-2'
              >
                {isEditingAmount ? (
                  <>
                    <input
                      {...register(`items[${index}].description`)}
                      defaultValue={item.description}
                      placeholder='Description'
                      className=' w-1/3 text-black outline-none focus:ring-2 focus:ring-darkGreen border-2 focus:border-darkGreen border-gray-400 rounded p-2'
                    />
                    <input
                      {...register(`items[${index}].price`)}
                      defaultValue={item.price}
                      placeholder='Price'
                      type='number'
                      className=' w-1/3 text-black outline-none focus:ring-2 focus:ring-darkGreen border-2 focus:border-darkGreen border-gray-400 rounded p-2'
                    />
                    <FaTrash
                      className='cursor-pointer text-red-500 bg-darkGray rounded size-8 p-1'
                      onClick={() => deleteItem(index)}
                    />
                  </>
                ) : (
                  <div className='flex justify-between w-full'>
                    <span>{item.description}</span>
                    <span>${parseFloat(item.price).toFixed(2)}</span>
                  </div>
                )}
              </li>
            ))}
            {isEditingAmount && (
              <li>
                <button
                  type='button'
                  onClick={addItem}
                  className='hover:bg-darkGreen flex items-center space-x-2 justify-center flex-row bg-darkBlue text-white font-bold h-full py-2 px-4 rounded shadow-sm'
                >
                  <div>Add Item</div> <FaPlus />
                </button>
              </li>
            )}
            <li className='flex justify-between items-center py-2 font-bold'>
              <span>Total (incl. 5% GST)</span>
              <span>${calculateTotal(items)}</span>
            </li>
          </ul>
          {isEditingAmount && (
            <div className='flex flex-col space-y-4 mt-4'>
              <button
                type='submit'
                className='bg-darkGreen text-white py-2 px-4 rounded'
              >
                Update
              </button>
              <button
                type='button'
                onClick={toggleEdit}
                className='bg-gray-200 text-gray-600 py-2 px-4 rounded'
              >
                Cancel
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default PriceBreakdown;
