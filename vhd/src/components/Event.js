import React, { useState, useEffect } from "react";
import ClickEvent from "./ClickEvent";

const Event = ({ events, onUpdate }) => {
  const [open, setOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const handleClick = (event) => {
    setSelectedEvent(event);
    console.log(event);
  };

  return (
    <>
      <div className="event-container">
        {events.map(({ jobTitle, time, location, _id, number }) => (
          <div
            className="event"
            key={time}
            onClick={() => {
              handleClick({ jobTitle, time, location, _id, number });
              setOpen(true);
            }}
          >
            {jobTitle}
            <p>{time}</p>
          </div>
        ))}
      </div>
      {selectedEvent && (
        <ClickEvent
          open={open}
          onClose={() => {
            setOpen(false);
            setSelectedEvent(null);
          }}
          event={selectedEvent}
          onUpdate={onUpdate}
        />
      )}
    </>
  );
};

export default Event;
