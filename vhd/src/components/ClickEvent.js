import React, { useState } from "react";
import { FaTrash } from "react-icons/fa";
import { FaRegWindowClose } from "react-icons/fa";
import { FaCalendarAlt } from "react-icons/fa";
import { FaPhoneAlt } from "react-icons/fa";
import { FaMapMarkerAlt } from "react-icons/fa";
import axios from "axios";

const ClickEvent = ({ open, onClose, event, onUpdate }) => {
  const [animationClass, setAnimationClass] = useState("growin");

  const handleClose = () => {
    setAnimationClass("growout");
    setTimeout(() => {
      setAnimationClass("growin");
      onClose();
    }, 400); // Wait for the animation duration
  };

  console.log(event);

  const handleDelete = () => {
    axios
      .delete(`http://127.0.0.1:4000/api/events/${event._id}`)
      .then((res) => {
        onUpdate();
        handleClose();
        console.log("event deleted successfully");
      })
      .catch((error) => {
        console.log("unable to delete event", error);
      });
  };

  if (!open) return null;
  return (
    <div className="overlay2" onClick={handleClose}>
      <div
        className={`click-modal-container ${animationClass}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="click-modal-header">
          <div className="click-modal-icons">
            <div className="trash-container" onClick={handleDelete}>
              <FaTrash id="click-modal-trash" />
            </div>
            <div className="close-container" onClick={handleClose}>
              <div id="click-modal-close">X</div>
            </div>
          </div>
          <div className="click-modal-title">{event.jobTitle}</div>
        </div>
        <div className="click-modal-footer">
          {event.time && (
            <div className="click-modal-time">
              <FaCalendarAlt id="click-calendar" />
              {event.time}
            </div>
          )}
          {event.number && (
            <div className="click-modal-number">
              <FaPhoneAlt id="click-number" />
              {event.number}
            </div>
          )}
          {event.location && (
            <div className="click-modal-location">
              <FaMapMarkerAlt id="click-location" />
              {event.location}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClickEvent;
