import React, { useState, useEffect } from "react";
import Layout from "../components/Layout";
import { FaArrowLeft } from "react-icons/fa";
import { FaArrowRight } from "react-icons/fa";
import { FaPlus } from "react-icons/fa";
import Event from "../components/Event";
import AddEvent from "../components/AddEvent";
import axios from "axios";
import { ToastContainer, toast, Slide } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const populateDaysArray = (currentDateStart, currentDateEnd) => {
  const days = [];
  const tempDate = new Date(currentDateStart);

  for (let i = 0; tempDate <= currentDateEnd; i++) {
    days.push({
      fullDate: tempDate.toISOString().slice(0, 16),
      dayName: tempDate.toLocaleDateString("en-US", { weekday: "short" }),
      dayNumber: tempDate.getDate(),
    });
    tempDate.setDate(tempDate.getDate() + 1);
  }

  return days;
};

const Schedule = () => {
  // Open and close event modal
  const [open, setOpen] = useState(false);

  // Setting the current date using React date object
  const currentDate = new Date();

  // Setting week to Sunday - Friday
  const [currentDateStart, setCurrentDateStart] = useState(
    new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      currentDate.getDate() - currentDate.getDay()
    )
  );
  const [currentDateEnd, setCurrentDateEnd] = useState(
    new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      currentDate.getDate() + (5 - currentDate.getDay())
    )
  );

  // Array of Object with events
  const [events, setEvents] = useState([]);

  // Used to update database fetch
  const [onUpdate, setOnUpdate] = useState(false);

  // Initializing the current week in the days array
  const [days, setDays] = useState(
    populateDaysArray(currentDateStart, currentDateEnd)
  );

  // fetching all events
  useEffect(() => {
    axios
      .get("http://127.0.0.1:4000/api/events/")
      .then((res) => setEvents(res.data))
      .catch((err) => console.error(err));
  }, [onUpdate]);

  // displaying prev week based on current date
  const handlePrevWeek = () => {
    currentDateStart.setDate(currentDateStart.getDate() - 7);
    currentDateEnd.setDate(currentDateEnd.getDate() - 7);
    setDays(populateDaysArray(currentDateStart, currentDateEnd));
  };

  // displaying next week based on current date
  const handleNextWeek = () => {
    currentDateStart.setDate(currentDateStart.getDate() + 7);
    currentDateEnd.setDate(currentDateEnd.getDate() + 7);
    setDays(populateDaysArray(currentDateStart, currentDateEnd));
  };

  // Toast for adding event
  const showAddEventToast = () => {
    toast.success("Event Added Successfully!", {
      position: "bottom-right",
      transition: Slide,
    });
    console.log("tities")
  };

  const showDeleteEventToast = () => {
    toast.success("Event Deleted Successfully!", {
      position: "bottom-right",
      transition: Slide,
    });
    console.log("tittties")
  };


  return (
    <Layout>
      <AddEvent
        open={open}
        onClose={() => setOpen(false)}
        onUpdate={() => setOnUpdate(!onUpdate)}
        showAddEventToast={showAddEventToast}
      />
      <div className="schedule">
        <div className="schedule-header">
          <div className="schedule-header-icons">
            <FaArrowLeft id="icon-arrowLeft" onClick={handlePrevWeek} />
            <FaArrowRight id="icon-arrowRight" onClick={handleNextWeek} />
          </div>
          <div className="schedule-header-date">{`${currentDateStart.toDateString()} - ${currentDateEnd.toDateString()}`}</div>

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
                  events={events.filter(
                    (event) =>
                      event.time.split("T")[0] === fullDate.split("T")[0]
                  )}
                  onUpdate={() => setOnUpdate(!onUpdate)}
                  showDeleteEventToast={showDeleteEventToast}
                />
              )}
            </div>
          ))}
        </div>
      </div>
      <ToastContainer />
    </Layout>
  );
};

export default Schedule;
