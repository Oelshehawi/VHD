import { useState } from 'react';
import { useForm } from 'react-hook-form';
import Axios from 'axios';
import modal from './styles/modal.module.css';

const Modal = ({ open, onClose, showToast, onUpdate }) => {
  const [file, setFile] = useState('Attach Invoice');
  const [invoiceData, setInvoiceData] = useState(null);
  const [invoiceType, setInvoiceType] = useState(null);
  const [invoiceName, setInvoiceName] = useState(null);

  const emptyInput = {};

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
      isRequired: false,
    },
    {
      name: 'jobTitle',
      type: 'text',
      placeholder: 'Job Title',
      isRequired: true,
    },
    { name: 'email', type: 'email', placeholder: 'Email', isRequired: true },
    {
      name: 'phoneNumber',
      type: 'tel',
      placeholder: 'Phone Number',
      isRequired: true,
    },
    { name: 'date', type: 'date', placeholder: 'Date', isRequired: false },
    {
      name: 'location',
      type: 'text',
      placeholder: 'Location',
      isRequired: true,
    },
    {
      name: 'price',
      type: 'number',
      placeholder: 'Price',
      step: 'any',
      min: '1',
      isRequired: false,
    },
    {
      name: 'frequency',
      type: 'number',
      placeholder: 'Frequency per Year',
      isRequired: false,
    },
    {
      name: 'notes',
      type: 'textarea',
      placeholder: 'Notes',
      isRequired: false,
    },
  ];

  const handleSave = async (values) => {
    try {
      const formData = new FormData();
      formData.append('clientName', values.clientName);
      formData.append('jobTitle', values.jobTitle);
      formData.append('email', values.email);
      formData.append('phoneNumber', values.phoneNumber);
      formData.append('date', values.date);
      formData.append('price', values.price);
      formData.append('frequency', values.frequency);
      formData.append('location', values.location);
      formData.append('notes', values.notes);

      if (invoiceData) {
        formData.append('invoice', invoiceData); // Pass the invoice data
        formData.append('invoiceType', invoiceType); // Pass the invoice type
        formData.append('invoiceName', invoiceName); // Pass the invoice name
      } else {
        formData.append('invoice', null); // Pass null if no invoice data is available
        formData.append('invoiceType', null); // Pass null if no invoice type is available
        formData.append('invoiceName', null); // Pass null if no invoice name is available
      }
      // Send data using Axios
      await Axios.post(`${process.env.NEXT_PUBLIC_API_URL}/clients/`, formData);

      onUpdate();
      onClose();
      showToast();
      reset({ ...emptyInput });
      setFile('Attach Invoice');
      setInvoiceData(null);
      setInvoiceType(null);
    } catch (error) {
      // Handle the error
      console.log(error);
    }
  };

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      setFile(selectedFile.name);
      setInvoiceType(selectedFile.type);
      setInvoiceName(selectedFile.name);

      const fileReader = new FileReader();

      fileReader.onload = (e) => {
        const base64Data = e.target.result.split(',')[1]; // Extract base64 data from the result
        setInvoiceData(base64Data);
      };

      fileReader.readAsDataURL(selectedFile);
    }
  };

  if (!open) return null;
  return (
    <div
      onClick={onClose}
      className={modal.overlay}
      role="button"
      tabIndex={0}
      onKeyDown={onClose}
    >
      <div
        onClick={(e) => {
          e.stopPropagation();
        }}
        className={modal.modalContainer}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          e.stopPropagation();
        }}
      >
        <div className={modal.modalHeader}>
          Add New Client
          <button className={modal.closeBtn} onClick={onClose}>
            X
          </button>
        </div>
        <form
          id="addClientForm"
          className={modal.modalContent}
          onSubmit={handleSubmit(handleSave)}
        >
          {inputFields.map(
            ({ name, type, placeholder, isRequired, ...rest }) => (
              <div className={modal.modalContentInputContainer} key={name}>
                {type === 'textarea' ? (
                  <textarea
                    {...register(name)}
                    className={modal.modalContentInput}
                    placeholder={placeholder}
                    {...rest}
                  />
                ) : (
                  <input
                    {...register(name, { required: isRequired })}
                    className={modal.modalContentInput}
                    type={type}
                    placeholder={placeholder}
                    {...rest}
                  />
                )}
                {errors[name] && (
                  <p style={{ color: 'red', padding: '3px' }}>
                    {name} is required
                  </p>
                )}
                <span className={modal.modalContentInputFocus}></span>
              </div>
            )
          )}
          <label className={modal.attach} htmlFor="invoice">
            {file}
          </label>
          <input
            type="file"
            name="invoice"
            {...register('invoice')}
            id="invoice"
            className={modal.invoice}
            onChange={(e) => {
              handleFileChange(e);
              setFile(e.target.files[0].name);
            }}
          />
        </form>
        <div className={modal.modalFooter}>
          <button
            id={modal.submitButtonForm}
            type="submit"
            value="submit"
            form="addClientForm"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
};

export default Modal;
