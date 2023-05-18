import React, { useState, useEffect } from "react";
import Layout from "../components/Layout";
import { FaArrowLeft } from "react-icons/fa";
import { FaArrowRight } from "react-icons/fa";
import { FaPlus } from "react-icons/fa";
import Event from "../components/Event";
import AddEvent from "../components/AddEvent";
import axios from "axios"

const Schedule = () => {
  const date = new Date();
  const startOfWeek = new Date();

  // set to first day of the week
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

  const endOfWeek = new Date(startOfWeek);

  // set to last day of the week
  endOfWeek.setDate(endOfWeek.getDate() + 5);

  // options for displaying weekdate
  const options = {
    month: "long",
    day: "numeric",
  };

  // Formatting to display week in Header
  const formattedStart = startOfWeek.toLocaleString("en-US", options);
  const formattedEnd = endOfWeek.toLocaleString("en-US", options);
  const displayText = `${formattedStart} - ${formattedEnd}`;

  // Setting the month and end of month
  const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
  const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

  const days = [];
  const [events, setEvents] = useState([]);
  const [onUpdate, setOnUpdate] = useState(false)

  useEffect(() => {
    axios
      .get("http://127.0.0.1:4000/api/events/")
      .then((res) => setEvents(res.data))
      .catch((err) => console.error(err));
  }, [onUpdate]);

  console.log(startOfWeek.toISOString().slice(0, 16))

  // Adding days of the week to days array
  for (let i = 0; i < 6; i++) {
    days.push({
      fullDate: startOfWeek.toISOString().slice(0, 16),
      dayName: startOfWeek.toLocaleDateString("en-US", { weekday: "short" }),
      dayNumber: startOfWeek.getDate(),
    });
    startOfWeek.setDate(startOfWeek.getDate() + 1);
  }

  const [open, setOpen] = useState(false);
  
  return (
    <Layout>
      <AddEvent
        open={open}
        onClose={() => setOpen(false)}
        onUpdate={() => setOnUpdate(!onUpdate)}
      />
      <div className="schedule">
        <div className="schedule-header">
          <div className="schedule-header-icons">
            <FaArrowLeft id="icon-arrowLeft" />
            <FaArrowRight id="icon-arrowRight" />
          </div>
          <div className="schedule-header-date">{displayText}</div>
          <FaPlus id="icon-plus" onClick={() => setOpen(true)} />
        </div>
        <div className="schedule-content">
          {days.map(({ dayName, dayNumber, fullDate }) => (
            <div className="schedule-content-day" key={dayName}>
              <div className="schedule-content-daynumber">
                {dayNumber}
                <p id="schedule-content-dayname">{dayName}</p>
              </div>
              {events && (
                <Event
                  events={events.filter((event) => event.time.split("T")[0] === fullDate.split("T")[0])}
                  onUpdate={() => setOnUpdate(!onUpdate)}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default Schedule;
