import React from "react";

const Event = ({ events }) => {
  return (
    <div className="event-container">
      {events.map(({ jobTitle, time }, index) => (
        <div className="event" key={index}>
          {jobTitle}
          <p>{time}</p>
        </div>
      ))}
    </div>
  );
};

export default Event;
