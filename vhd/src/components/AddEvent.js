import React, { useState, useEffect } from "react";
import axios from "axios";
import { API_URL } from "../config";

const AddEvent = ({ open, onClose, onUpdate, showAddEventToast }) => {
  const [jobTitle, setJobTitle] = useState("");
  const [location, setLocation] = useState("");
  const [time, setTime] = useState("");
  const [number, setNumber] = useState("");
  const [animationClass, setAnimationClass] = useState("growin2");

  const inputs = [
    {
      type: "text",
      placeholder: "Job Title",
      setter: setJobTitle,
    },
    {
      type: "text",
      placeholder: "Location",
      setter: setLocation,
    },
    {
      type: "datetime-local",
      placeholder: "Time",
      setter: setTime,
    },
    {
      type: "tel",
      placeholder: "Phone Number",
      setter: setNumber,
    },
  ];

  const resetForm = () => {
    setJobTitle("");
    setLocation("");
    setTime("");
    setNumber("");
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (jobTitle) {
      const eventData = {
        jobTitle: jobTitle,
        location: location,
        time: time,
        number: number,
      };
      axios
        .post(`${API_URL}/events/`, eventData)
        .then((response) => {
          onUpdate();
          resetForm();
          console.log(response);
        })
        .catch((error) => {
          console.error(error);
        });
    }
    showAddEventToast();
  };

  const handleClose = () => {
    setAnimationClass("growout2");
    setTimeout(() => {
      setAnimationClass("growin2");
      onClose();
    }, 400);
  };

  if (!open) return null;
  return (
    <div className="overlay2" onClick={handleClose}>
      <div
        className={`event-modal-container ${animationClass}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="event-modal-header">Add Event</div>
        <form
          className="event-modal-content"
          onSubmit={(e) => {
            handleSave(e);
            handleClose();
          }}
        >
          {inputs.map(({ type, placeholder, setter }) => (
            <div className="event-content-input-container" key={placeholder}>
              <input
                type={type}
                className="event-content-input"
                placeholder={placeholder}
                onChange={(e) => setter(e.target.value)}
                required
              />
              <span className="event-content-input-focus"></span>
            </div>
          ))}
          <div className="event-modal-footer">
            <button id="event-save" type="submit" value="submit">
              SAVE
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEvent;
