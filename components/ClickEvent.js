import { useState } from 'react';
import { FaTrash } from 'react-icons/fa';
import { FaRegWindowClose } from 'react-icons/fa';
import { FaCalendarAlt } from 'react-icons/fa';
import { FaPhoneAlt } from 'react-icons/fa';
import { FaMapMarkerAlt } from 'react-icons/fa';
import axios from 'axios';
import eventStyles from './styles/event.module.css';

const ClickEvent = ({
  open,
  onClose,
  event,
  onUpdate,
  showDeleteEventToast,
  convertTime,
}) => {
  const [animationClass, setAnimationClass] = useState('growin');

  const handleClose = () => {
    setAnimationClass('growout');
    setTimeout(() => {
      setAnimationClass('growin');
      onClose();
    }, 100); // Wait for the animation duration
  };

  const handleDelete = () => {
    axios
      .delete(`${process.env.NEXT_PUBLIC_API_URL}/events/${event._id}`)
      .then((res) => {
        onUpdate();
        handleClose();
        showDeleteEventToast();
        console.log('event deleted successfully');
      })
      .catch((error) => {
        console.log('unable to delete event', error);
      });
  };

  if (!open) return null;
  return (
    <div className={eventStyles.overlay2} onClick={handleClose}>
      <div
        className={`${eventStyles.clickModalContainer} ${eventStyles[animationClass]}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={eventStyles.clickModalHeader}>
          <div className={eventStyles.clickModalIcons}>
            <div className={eventStyles.trashContainer} onClick={handleDelete}>
              <FaTrash id={eventStyles.clickModalTrash} />
            </div>
            <div className={eventStyles.closeContainer} onClick={handleClose}>
              <div id={eventStyles.clickModalClose}>X</div>
            </div>
          </div>
          <div
            className={`${eventStyles.clickModalTitle} ${eventStyles[animationClass]}`}
          >
            {event.jobTitle}
          </div>
        </div>
        <div className={eventStyles.clickModalFooter}>
          {event.time && (
            <div className={'click-modal-time'}>
              <FaCalendarAlt id={eventStyles.clickCalendar} />
              {convertTime(event.time)}
            </div>
          )}
          {event.number && (
            <div className="click-modal-number">
              <FaPhoneAlt id={eventStyles.clickNumber} />
              {event.number}
            </div>
          )}
          {event.location && (
            <div className="click-modal-location">
              <FaMapMarkerAlt id={eventStyles.clickLocation} />
              {event.location}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClickEvent;
