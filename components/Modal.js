import { useState } from 'react';
import { useForm } from 'react-hook-form';
import Axios from 'axios';
import modal from './styles/modal.module.css';

const Modal = ({ open, onClose, showToast, onUpdate }) => {
  //Setting variables for displaying file name in Attach invoice button
  const [file, setfile] = useState('Attach Invoice');

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

  //Function that handles form submit
  const handleSave = (values) => {
    // Print out form values
    console.log({ values });

    //Send data using Axios
    Axios.post(
      `${process.env.NEXT_PUBLIC_API_URL}/clients/`,
      {
        clientName: values.clientName,
        jobTitle: values.jobTitle,
        email: values.email,
        phoneNumber: values.phoneNumber,
        date: values.date,
        price: values.price,
        frequency: values.frequency,
        location: values.location,
        notes: values.notes,
        invoice: values.invoice[0],
      },
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    ).then((response) => {
      //Close Modal
      onUpdate();
      onClose();
      showToast();
      //Empty form input
      reset({ ...emptyInput });
      setfile('Attach Invoice');
    });
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
            {...register('invoice', {
              onChange: (e) => {
                setfile(e.target.files[0].name);
              },
            })}
            id="invoice"
            className={modal.invoice}
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
