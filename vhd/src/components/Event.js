import React, { useState, useEffect } from "react";
import ClickEvent from "./ClickEvent";

const Event = ({ events, onUpdate, showDeleteEventToast, eventSchedule }) => {
  const [open, setOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const handleClick = (event) => {
    setSelectedEvent(event);
    console.log(event);
  };

  const dateTimeToLocalTime = (datetime) => {
    const date = new Date(datetime);
    const options = { hour: 'numeric', minute: 'numeric', hour12: true };
    const timeString = date.toLocaleTimeString('en-US', options);
    
    // Extracting the hour and AM/PM indicator
    const [time, period] = timeString.split(' ');
    
    // Removing leading zeros from the hour (e.g., "09" -> "9")
    const formattedTime = time.replace(/^0+/, '');
    
    return formattedTime + period.toLowerCase();
  };

  console.log(events)

  return (
    <>
      <div className={ !eventSchedule ? "event-container" : "event-container2"}>
        {events.map(({ jobTitle, time, location, _id, number }) => (
          <div
            className={ !eventSchedule ? "event" : "event2"}
            key={time}
            onClick={() => {
              handleClick({ jobTitle, time, location, _id, number });
              setOpen(true);
            }}
          >
            {jobTitle}
            <p>{dateTimeToLocalTime(time)}</p>
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
          showDeleteEventToast={showDeleteEventToast}
          convertTime={dateTimeToLocalTime}
        />
      )}
    </>
  );
};

export default Event;
