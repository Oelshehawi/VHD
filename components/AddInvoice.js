import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import Axios from 'axios';
import addInvoice from './styles/addInvoice.module.css';
import Select from 'react-select';

const AddInvoice = ({ open, onClose, onUpdate }) => {
  const [animationClass, setAnimationClass] = useState('slideIn');
  const [animationClass2, setAnimationClass2] = useState('fadeIn');
  const [clients, setClients] = useState([]);
  const [items, setItems] = useState([
    {
      description: '',
      price: '',
    },
  ]);
  const [subtotal, setSubtotal] = useState(0);
  const [tax, setTax] = useState(0);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const addItem = () => {
    setItems((prevItems) => [...prevItems, { description: '', price: 0 }]);
  };

  const deleteItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handlePriceChange = (index, value) => {
    setItems((prevItems) => {
      const updatedItems = [...prevItems];
      updatedItems[index] = {
        ...updatedItems[index],
        price: parseFloat(value),
      };
      return updatedItems;
    });
  };

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    control,
  } = useForm();

  useEffect(() => {
    const calculateTotals = () => {
      const itemsSubtotal = items.reduce(
        (acc, item) => acc + parseFloat(item.price || 0),
        0
      );
      const itemsTax = itemsSubtotal * 0.05;
      const itemsTotal = itemsSubtotal + itemsTax;

      setSubtotal(itemsSubtotal);
      setTax(itemsTax);
      setTotal(itemsTotal);
    };

    calculateTotals();
  }, [items]);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await Axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/clients`
        );
        setClients(response.data);
      } catch (error) {
        console.log('Error fetching clients:', error);
      }
    };

    fetchClients();
  }, []);

  const handleSave = async (values) => {
    setIsLoading(true);

    try {
      const {
        clientId,
        jobTitle,
        dateIssued,
        dateDue,
        items,
        frequency,
        location,
        notes,
      } = values;

      const client = clients.find((client) => client._id === clientId.value);

      if (client) {
        const response = await Axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/invoices?prefix=${client.prefix}`
        );

        const invoiceNumbers = response.data.map((invoice) => {
          const invoiceNumber = parseInt(invoice.invoiceId.split('-')[1]);
          return isNaN(invoiceNumber) ? 0 : invoiceNumber;
        });

        const maxInvoiceNumber = Math.max(...invoiceNumbers);
        const nextInvoiceNumber =
          maxInvoiceNumber === -Infinity ? 0 : maxInvoiceNumber + 1;

        const invoiceId = `${client.prefix}-${nextInvoiceNumber
          .toString()
          .padStart(4, '0')}`;

          console.log(location)
        const invoiceData = {
          invoiceId,
          jobTitle,
          dateIssued,
          dateDue,
          items: items.map((item) => ({
            description: item.description,
            price: item.price,
          })),
          frequency,
          location,
          notes,
        };

        await Axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/invoices`,
          invoiceData
        );

        onUpdate();
        handleClose();
        reset();
      }
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setAnimationClass('slideOut');
    setAnimationClass2('fadeOut');
    setTimeout(() => {
      setAnimationClass('slideIn');
      setAnimationClass2('fadeIn');
      onClose();
    }, 500);
  };

  if (!open) return null;
  return (
    <div
      onClick={handleClose}
      className={`${addInvoice.overlay} ${addInvoice[animationClass2]}`}
      role="button"
      tabIndex={0}
      onKeyDown={handleClose}
    >
      <div
        onClick={(e) => {
          e.stopPropagation();
        }}
        className={`${addInvoice.addInvoiceContainer} ${addInvoice[animationClass]}`}
        onKeyDown={(e) => {
          e.stopPropagation();
        }}
      >
        <div className={addInvoice.addInvoiceHeader}>{'Add New Invoice'}</div>
        <form
          id="addInvoiceForm"
          className={addInvoice.addInvoiceContent}
          onSubmit={handleSubmit(handleSave)}
        >
          <div className={addInvoice.inputContainer}>
            <div className={addInvoice.recipientInput}>
              <Controller
                name="clientId"
                control={control}
                rules={{ required: 'Client is required' }}
                render={({ field }) => (
                  <Select
                    {...field}
                    className={addInvoice.selectContentInput}
                    options={clients.map((client) => ({
                      value: client._id,
                      label: `${client.clientName} - ${client.email}`,
                    }))}
                    placeholder="Recipient Client"
                    isSearchable={true}
                  />
                )}
              />
            </div>
            <div className={addInvoice.titleInputs}>
              <input
                {...register('jobTitle', { required: 'Job Title is required' })} // Make jobTitle field required
                className={addInvoice.titleContentInput}
                type="text"
                placeholder="Job Title"
              />
            </div>
            <div className={addInvoice.detailInputs}>
            <input
                {...register('frequency', {
                  required: 'Frequency is required',
                })} 
                className={addInvoice.detailContentInput}
                type="number"
                placeholder="Frequency"
              />
              <input
                {...register('location', {
                  required: 'Location is required',
                })} 
                className={addInvoice.detailContentInput}
                type="text"
                placeholder="Address"
              />
            </div>
            
            <div className={addInvoice.dateInputs}>
              <input
                {...register('dateIssued', {
                  required: 'Date Issued is required',
                })}
                className={addInvoice.dateContentInput}
                type="date"
              />

              <input
                {...register('dateDue', { required: 'Date Due is required' })}
                className={addInvoice.dateContentInput}
                type="date"
              />
            </div>
            <div className={addInvoice.itemInputs}>
              {items.map((item, index) => (
                <div key={index} className={addInvoice.itemMain}>
                  <div className={addInvoice.itemMainInputs}>
                    <input
                      {...register(`items[${index}].description`, {
                        required: 'Item Description is required',
                      })}
                      className={addInvoice.itemDescriptionInput}
                      type="text"
                      placeholder="Item Description"
                    />

                    <input
                      {...register(`items[${index}].price`, {
                        required: 'Item Price is required',
                      })}
                      className={addInvoice.itemPriceInput}
                      type="number"
                      placeholder="Item Price"
                      onChange={(e) => handlePriceChange(index, e.target.value)}
                    />
                  </div>
                  <button
                    className={addInvoice.deleteButton}
                    type="button"
                    onClick={() => deleteItem(index)}
                  >
                    Delete
                  </button>
                </div>
              ))}
              <div className={addInvoice.itemFooter}>
                <button
                  className={addInvoice.addButton}
                  type="button"
                  onClick={addItem}
                >
                  {'+ Add Item'}
                </button>
                <div className={addInvoice.itemTaxBreakdown}>
                  <div className={addInvoice.itemTotal}>
                    Subtotal: ${subtotal.toFixed(2)}
                  </div>
                  <div className={addInvoice.itemTotal}>
                    Tax (0.5%): ${tax.toFixed(2)}
                  </div>
                  <div className={addInvoice.itemTotal}>
                    Total: ${total.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
            <div className={addInvoice.notesInputs}>
              <input
                {...register('notes')}
                className={addInvoice.notesContentInput}
                type="textarea"
                placeholder="Additional Notes"
              />
            </div>
          </div>
        </form>
        <div className={addInvoice.addInvoiceFooter}>
          <button
            id={addInvoice.submitButtonForm}
            type="submit"
            value="submit"
            form="addInvoiceForm"
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : 'Submit'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddInvoice;
