import { useState } from 'react';
import { useForm } from 'react-hook-form';
import Axios from 'axios';
import editModal from './styles/editModal.module.css';
import { ToastContainer, toast, Slide } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const EditModal = ({ open, onClose, client, onUpdate }) => {
  const [animationClass, setAnimationClass] = useState('slideIn');
  const [animationClass2, setAnimationClass2] = useState('fadeIn');
  const [isLoading, setIsLoading] = useState(false);

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
      value: client.clientName,
    },
    { name: 'email', type: 'email', placeholder: 'Email', value: client.email },
    {
      name: 'phoneNumber',
      type: 'tel',
      placeholder: 'Phone Number',
      value: client.phoneNumber,
    },
    {
      name: 'location',
      type: 'text',
      placeholder: 'Location',
      value: client.location,
    },
    {
      name: 'frequency',
      type: 'number',
      placeholder: 'Frequency per Year',
      value: client.frequency,
    },
    {
      name: 'notes',
      type: 'textarea',
      placeholder: 'Notes',
      value: client.notes,
    },
  ];

  const handleClose = () => {
    setAnimationClass('slideOut');
    setAnimationClass2('fadeOut');
    setTimeout(() => {
      setAnimationClass('slideIn');
      setAnimationClass2('fadeIn');
      onClose();
    }, 500);
  };

  const handleUpdate = async (data) => {
    try {
      await Axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/clients/${client._id}`,
        data
      );
      console.log('Record Updated successfully');
      showUpdateToast();
      onUpdate();
      handleClose();
    } catch (error) {
      console.log('Error Updating record:', error);
    }
  };

  const showUpdateToast = () => {
    toast.success('Client Updated Successfully!', {
      transition: Slide,
      position: 'bottom-right',
    });
  };

  if (!open) return null;
  return (
    <div
      onClick={handleClose}
      className={`${editModal.overlay} ${editModal[animationClass2]}`}
      role="button"
      tabIndex={0}
      onKeyDown={handleClose}
    >
      <div
        onClick={(e) => {
          e.stopPropagation();
        }}
        className={`${editModal.modalContainer} ${editModal[animationClass]}`}
        onKeyDown={(e) => {
          e.stopPropagation();
        }}
      >
        <div className={editModal.modalHeader}>Edit Client</div>
        <form
          id="addClientForm"
          className={editModal.modalContent}
          onSubmit={handleSubmit(handleUpdate)}
        >
          {inputFields.map(({ name, type, placeholder, value, ...rest }) => (
            <div className={editModal.modalContentInputContainer} key={name}>
              {type === 'textarea' ? (
                <textarea
                  {...register(name)}
                  className={editModal.modalContentInput}
                  placeholder={placeholder}
                  defaultValue={value}
                />
              ) : (
                <input
                  {...register(name)}
                  className={editModal.modalContentInput}
                  type={type}
                  placeholder={placeholder}
                  defaultValue={value}
                />
              )}
              <span className={editModal.modalContentInputFocus}></span>
            </div>
          ))}
        </form>
        <div className={editModal.modalFooter}>
          <button
            id={editModal.submitButtonForm}
            type="submit"
            value="submit"
            form="addClientForm"
            disabled={isLoading}
          >
     
            {isLoading ? 'Loading...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditModal;
