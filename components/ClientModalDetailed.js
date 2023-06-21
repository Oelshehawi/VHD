import { useState, useEffect } from 'react';
import DownloadInvoice from './DownloadInvoice';
import { FaTrashAlt } from 'react-icons/fa';
import { FaPenSquare } from 'react-icons/fa';
import { Buffer } from 'buffer';
import axios from 'axios';
import Image from 'next/image';
import { ToastContainer, toast, Slide } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import modalDetailed from './styles/modalDetailed.module.css';

const ClientModalDetailed = ({
  open,
  onClose,
  rowId,
  clientData,
  onUpdate,
}) => {
  const client = clientData.find((obj) => obj._id === rowId);

  const [disabled, setDisabled] = useState(true);
  const [name, setName] = useState('');
  const [jobtitle, setJobtitle] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [frequency, setFrequency] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');

  const showDeleteToast = () => {
    toast.success('Client Deleted Successfully!', {
      transition: Slide,
      position: 'bottom-right',
    });
  };

  const showUpdateToast = () => {
    toast.success('Client Updated Successfully!', {
      transition: Slide,
      position: 'bottom-right',
    });
  };

  const updateAll = () => {
    setName(client.clientName);
    setJobtitle(client.jobTitle);
    setEmail(client.email);
    setPhoneNumber(client.phoneNumber);
    setDate(client.date);
    setPrice(client.price);
    setFrequency(client.frequency);
    setLocation(client.location);
    setNotes(client.notes);
  };

  const handleChange = (e) => {
    e.target.setAttribute('type', 'date');
  };

  const handleDelete = () => {
    axios
      .delete(`${process.env.NEXT_PUBLIC_API_URL}/clients/${client._id}`)
      .then((response) => {
        console.log('Record deleted successfully');
        onUpdate();
        onClose();
        showDeleteToast();
      })
      .catch((error) => {
        console.log('Error deleting record:', error);
      });
  };

  const handleUpdate = () => {
    axios
      .put(`${process.env.NEXT_PUBLIC_API_URL}/clients/${client._id}`, {
        clientName: name,
        jobTitle: jobtitle,
        email: email,
        phoneNumber: phoneNumber,
        date: date,
        price: price,
        frequency: frequency,
        location: location,
        notes: notes,
      })
      .then((response) => {
        console.log('Record Updated successfully');
        onClose();
        showUpdateToast();
        onUpdate();
      })
      .catch((error) => {
        console.log('Error Updating record:', error);
      });
  };

  const inputFields = [
    {
      name: "Client's Name",
      type: 'text',
      placeholder: client.clientName,
      setter: setName,
    },
    {
      name: 'jobTitle',
      type: 'text',
      placeholder: client.jobTitle,
      setter: setJobtitle,
    },
    {
      name: 'email',
      type: 'email',
      placeholder: client.email,
      setter: setEmail,
    },
    {
      name: 'phoneNumber',
      type: 'tel',
      placeholder: client.phoneNumber,
      setter: setPhoneNumber,
    },
    {
      name: 'location',
      type: 'text',
      placeholder: client.location,
      setter: setLocation,
    },
    {
      name: 'frequency',
      type: 'number',
      placeholder: client.frequency,
      setter: setFrequency,
    },
    {
      name: 'notes',
      type: 'textarea',
      placeholder: client.notes,
      setter: setNotes,
    },
  ];

  if (!open) return null;
  return (
    <div
      onClick={onClose}
      className={modalDetailed.overlay}
      role="button"
      tabIndex={0}
      onKeyDown={onClose}
    >
      <div
        onClick={(e) => {
          e.stopPropagation();
        }}
        className={modalDetailed.modal}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          e.stopPropagation();
        }}
      >
        <div className={modalDetailed.modalHeader}>
          {client.jobTitle}
          <button className={modalDetailed.closeBtn} onClick={onClose}>
            X
          </button>
        </div>
        <div className={modalDetailed.modalContent}>
          <div className={modalDetailed.modalContentInvoice}>
            <Image
              src={
                base64Image
                  ? `data:image/png;base64,${base64Image}`
                  : '/images.png'
              }
              alt=""
              width={500}
              height={500}
              className={modalDetailed.fullWidthHeight}
            />
          </div>
          <div className={modalDetailed.modalContentDetails}>
            {inputFields.map(({ name, placeholder, type, setter }) => (
              <div
                className={modalDetailed.modalContentInputContainer}
                key={name}
              >
                {type === 'textarea' ? (
                  <textarea
                    className={modalDetailed.modalContentInput}
                    name={name}
                    type={type}
                    placeholder={
                      placeholder !== '' && placeholder !== null
                        ? placeholder
                        : name
                    }
                    disabled={disabled}
                    onChange={(e) => setter(e.target.value)}
                  />
                ) : (
                  <input
                    className={modalDetailed.modalContentInput}
                    name={name}
                    type={type}
                    placeholder={
                      placeholder !== '' && placeholder !== null
                        ? placeholder
                        : name
                    }
                    disabled={disabled}
                    onChange={(e) => setter(e.target.value)}
                  />
                )}

                <span className={modalDetailed.modalContentInputFocus}></span>
              </div>
            ))}
          </div>
        </div>
        <div className={modalDetailed.modalFooter}>
          <div>
            <FaTrashAlt
              className={modalDetailed.iconHover}
              onClick={handleDelete}
            />
            <FaPenSquare
              className={modalDetailed.iconHover}
              onClick={() => {
                setDisabled(false);
                updateAll();
              }}
            />
          </div>
          <button
            id={modalDetailed.modalFooterUpdate}
            value="Update"
            onClick={handleUpdate}
            disabled={disabled}
          >
            Update entry{' '}
          </button>
          <DownloadInvoice fileId={client._id} />
        </div>
      </div>
      <ToastContainer />
    </div>
  );
};

export default ClientModalDetailed;
