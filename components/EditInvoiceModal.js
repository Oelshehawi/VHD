import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import Axios from 'axios';
import editInvoice from './styles/editInvoice.module.css';
import Select from 'react-select';

const EditInvoiceModal = ({ open, onClose, showToast, onUpdate, invoice, client }) => {
  const [animationClass, setAnimationClass] = useState('slideIn');
  const [animationClass2, setAnimationClass2] = useState('fadeIn');
  const [items, setItems] = useState([]);
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

  const emptyInput = {};

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
    if (invoice) {
      const { jobTitle, dateIssued, dateDue, items, notes } = invoice;

      reset({
        jobTitle,
        dateIssued: new Date(dateIssued).toISOString().substr(0, 10),
        dateDue: new Date(dateDue).toISOString().substr(0, 10),
        items: items.map((item) => ({
          description: item.description,
          price: item.price,
        })),
        notes,
      });

      setItems(items);
    }
  }, [invoice, reset]);

  const handleEdit = async (data) => {
    setIsLoading(true);

    try {
      console.log('it ran');

      await Axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/invoices/${invoice._id}`,
        data
      );

      onUpdate();
      handleClose();
      showToast();
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
      className={`${editInvoice.overlay} ${editInvoice[animationClass2]}`}
      role="button"
      tabIndex={0}
      onKeyDown={handleClose}
    >
      <div
        onClick={(e) => {
          e.stopPropagation();
        }}
        className={`${editInvoice.editInvoiceContainer} ${editInvoice[animationClass]}`}
        onKeyDown={(e) => {
          e.stopPropagation();
        }}
      >
        <div className={editInvoice.editInvoiceHeader}>{'Edit Invoice'}</div>
        <form
          id="editInvoiceForm"
          className={editInvoice.editInvoiceContent}
          onSubmit={handleSubmit(handleEdit)}
        >
          <div className={editInvoice.inputContainer}>
            <div className={editInvoice.recipientInput}>
              <Controller
                name="clientId"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    className={editInvoice.selectContentInput}
                    placeholder={`${client[0].clientName} - ${client[0].email}`}
                    isDisabled={true}
                  />
                )}
              />
            </div>
            <div className={editInvoice.titleInputs}>
              <input
                {...register('jobTitle')}
                className={editInvoice.titleContentInput}
                type="text"
                placeholder="Job Title"
              />
            </div>

            <div className={editInvoice.dateInputs}>
              <input
                {...register('dateIssued')}
                className={editInvoice.dateContentInput}
                type="date"
              />
              <input
                {...register('dateDue')}
                className={editInvoice.dateContentInput}
                type="date"
              />
            </div>
            <div className={editInvoice.itemInputs}>
              {items.map((item, index) => (
                <div key={index} className={editInvoice.itemMain}>
                  <div className={editInvoice.itemMainInputs}>
                    <input
                      {...register(`items[${index}].description`)}
                      className={editInvoice.itemDescriptionInput}
                      type="text"
                      placeholder="Item Description"
                    />
                    <input
                      {...register(`items[${index}].price`)}
                      className={editInvoice.itemPriceInput}
                      type="number"
                      placeholder="Item Price"
                      onChange={(e) => handlePriceChange(index, e.target.value)}
                    />
                  </div>
                  <button
                    className={editInvoice.deleteButton}
                    type="button"
                    onClick={() => deleteItem(index)}
                  >
                    Delete
                  </button>
                </div>
              ))}
              <div className={editInvoice.itemFooter}>
                <button
                  className={editInvoice.addButton}
                  type="button"
                  onClick={addItem}
                >
                  {'+ Add Item'}
                </button>
                <div className={editInvoice.itemTaxBreakdown}>
                  <div className={editInvoice.itemTotal}>
                    Subtotal: ${subtotal.toFixed(2)}
                  </div>
                  <div className={editInvoice.itemTotal}>
                    Tax (0.5%): ${tax.toFixed(2)}
                  </div>
                  <div className={editInvoice.itemTotal}>
                    Total: ${total.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
            <div className={editInvoice.notesInputs}>
              <input
                {...register('notes')}
                className={editInvoice.notesContentInput}
                type="textarea"
                placeholder="Additional Notes"
              />
            </div>
          </div>
        </form>
        <div className={editInvoice.editInvoiceFooter}>
          <button
            id={editInvoice.updateButtonForm}
            type="submit"
            value="submit"
            form="editInvoiceForm"
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditInvoiceModal;
