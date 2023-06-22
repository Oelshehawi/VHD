import { useState } from 'react';
import { useForm } from 'react-hook-form';
import Axios from 'axios';
import modal from './styles/modal.module.css';

const Modal = ({ open, onClose, showToast, onUpdate }) => {
  const [animationClass, setAnimationClass] = useState('slideIn');
  const [animationClass2, setAnimationClass2] = useState('fadeIn');

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
    { name: 'email', type: 'email', placeholder: 'Email', isRequired: true },
    {
      name: 'phoneNumber',
      type: 'tel',
      placeholder: 'Phone Number',
      isRequired: true,
    },
    {
      name: 'location',
      type: 'text',
      placeholder: 'Location',
      isRequired: true,
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
      formData.append('email', values.email);
      formData.append('phoneNumber', values.phoneNumber);
      formData.append('frequency', values.frequency);
      formData.append('location', values.location);
      formData.append('notes', values.notes);

      await Axios.post(`${process.env.NEXT_PUBLIC_API_URL}/clients/`, formData);

      onUpdate();
      handleClose();
      showToast();
      reset({ ...emptyInput });
    } catch (error) {
      // Handle the error
      console.log(error);
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
      className={`${modal.overlay} ${modal[animationClass2]}`}
      role="button"
      tabIndex={0}
      onKeyDown={handleClose}
    >
      <div
        onClick={(e) => {
          e.stopPropagation();
        }}
        className={`${modal.modalContainer} ${modal[animationClass]}`}
        onKeyDown={(e) => {
          e.stopPropagation();
        }}
      >
        <div className={modal.modalHeader}>
          Add New Client
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
