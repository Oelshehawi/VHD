import React, { useState } from "react";

const AddEvent = ({ open, onClose, setEvents }) => {
  const [jobTitle, setJobTitle] = useState("");
  const [location, setLocation] = useState("");
  const [eventDay, setEventDay] = useState("");
  const [time, setTime] = useState("");
  const [number, setNumber] = useState("");

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
      type: "time",
      placeholder: "Time",
      setter: setTime,
    },
    {
      type: "tel",
      placeholder: "Phone Number",
      setter: setNumber,
    },
  ];

  const event = {
    jobTitle: jobTitle,
    location: location,
    eventDay: eventDay,
    time: time,
    number: number,
  };

  const updateEventObject = () => {
    setEvents((prevEvents) => [...prevEvents, event]);
    onClose();
  };

  if (!open) return null;
  return (
    <div className="overlay2" onClick={onClose}>
      <div
        className="event-modal-container"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="event-modal-header">Add Event</div>
        {inputs.map(({ type, placeholder, setter }) => (
          <div className="event-content-input-container" key={placeholder}>
            <input
              type={type}
              className="event-content-input"
              placeholder={placeholder}
              onChange={(e) => setter(e.target.value)}
            />
            <span className="event-content-input-focus"></span>
          </div>
        ))}
        <div className="event-content-input-container">
          <select
            className="event-content-input"
            onChange={(e) => setEventDay(e.target.value)}
          >
            <option>-Please choose a day-</option>
            <option value="Sun">Sun</option>
            <option value="Mon">Mon</option>
            <option value="Tue">Tue</option>
            <option value="Wed">Wed</option>
            <option value="Thu">Thu</option>
            <option value="Fri">Fri</option>
          </select>
          <span className="event-content-input-focus"></span>
        </div>
        <div className="event-modal-footer">
          <button id="event-delete" className="event-buttons" onClick={onClose}>
            DELETE
          </button>
          <button
            id="event-save"
            className="event-buttons"
            onClick={updateEventObject}
          >
            SAVE
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddEvent;
