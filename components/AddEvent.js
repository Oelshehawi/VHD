import { useState, useEffect } from 'react';
import axios from 'axios';
import eventStyles from './styles/event.module.css';

const AddEvent = ({ open, onClose, onUpdate, showAddEventToast }) => {
  const [jobTitle, setJobTitle] = useState('');
  const [location, setLocation] = useState('');
  const [time, setTime] = useState('');
  const [number, setNumber] = useState('');
  const [animationClass, setAnimationClass] = useState('growin2');
  const [formattedDate, setFormattedDate] = useState('');

  const inputs = [
    {
      type: 'text',
      placeholder: 'Job Title',
      setter: setJobTitle,
    },
    {
      type: 'text',
      placeholder: 'Location',
      setter: setLocation,
    },
    {
      type: 'datetime-local',
      placeholder: 'Time',
      setter: setTime,
    },
    {
      type: 'tel',
      placeholder: 'Phone Number',
      setter: setNumber,
    },
  ];

  const resetForm = () => {
    setJobTitle('');
    setLocation('');
    setTime('');
    setNumber('');
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (jobTitle) {
      const eventData = {
        jobTitle: jobTitle,
        location: location,
        time: time, // Use the formatted date in PST
        number: number,
      };
      axios
        .post(`${process.env.NEXT_PUBLIC_API_URL}/events/`, eventData)
        .then((response) => {
          onUpdate();
          resetForm();
        })
        .catch((error) => {
          console.error(error);
        });
    }
    showAddEventToast();
  };

  const handleClose = () => {
    setAnimationClass('growout2');
    setTimeout(() => {
      setAnimationClass('growin2');
      onClose();
    }, 400);
  };

  if (!open) return null;
  return (
    <div className={eventStyles.overlay2} onClick={handleClose}>
      <div
        className={`${eventStyles.eventModalContainer} ${eventStyles[animationClass]}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={eventStyles.eventModalHeader}>Add Event</div>
        <form
          className={eventStyles.eventModalContent}
          onSubmit={(e) => {
            handleSave(e);
            handleClose();
          }}
        >
          {inputs.map(({ type, placeholder, setter }) => (
            <div
              className={eventStyles.eventContentInputContainer}
              key={placeholder}
            >
              <input
                type={type}
                className={eventStyles.eventContentInput}
                placeholder={placeholder}
                onChange={(e) => setter(e.target.value)}
                required
              />
              <span className={eventStyles.eventContentInputFocus}></span>
            </div>
          ))}
          <div className={eventStyles.eventModalFooter}>
            <button id={eventStyles.eventSave} type="submit" value="submit">
              SAVE
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEvent;
