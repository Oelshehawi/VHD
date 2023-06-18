'use client';
import { useState, useEffect } from 'react';
import { FaArrowLeft } from 'react-icons/fa';
import { FaArrowRight } from 'react-icons/fa';
import { FaPlus } from 'react-icons/fa';
import Event from '../../components/Event';
import AddEvent from '../../components/AddEvent';
import axios from 'axios';
import { ToastContainer, toast, Slide } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import scheduleStyle from './schedule.module.css';

const populateDaysArray = (currentDateStart, currentDateEnd) => {
  const days = [];
  const tempDate = new Date(currentDateStart);
  const utcOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
  };

  for (let i = 0; tempDate <= currentDateEnd; i++) {
    days.push({
      fullDate: tempDate.toLocaleString('en-US', utcOptions),
      dayName: tempDate.toLocaleDateString('en-US', { weekday: 'short' }),
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
      .get(`${process.env.NEXT_PUBLIC_API_URL}/events`)
      .then((res) => {
        const utcOptions = {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          timeZone: 'UTC',
        };

        const updatedEvents = res.data.map((event) => {
          const utcDate = new Date(event.time);
          const utcString = utcDate.toLocaleString('en-US', utcOptions);
          return { ...event, time: utcString };
        });

        setEvents(updatedEvents);
      })
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
    toast.success('Event Added Successfully!', {
      position: 'bottom-right',
      transition: Slide,
    });
  };

  const showDeleteEventToast = () => {
    toast.success('Event Deleted Successfully!', {
      position: 'bottom-right',
      transition: Slide,
    });
  };

  return (
    <>
      <AddEvent
        open={open}
        onClose={() => setOpen(false)}
        onUpdate={() => setOnUpdate(!onUpdate)}
        showAddEventToast={showAddEventToast}
      />
      <div className={scheduleStyle.schedule}>
        <div className={scheduleStyle.scheduleHeader}>
          <div className={scheduleStyle.scheduleHeaderIcons}>
            <FaArrowLeft
              id={scheduleStyle.iconArrowLeft}
              onClick={handlePrevWeek}
            />
            <FaArrowRight
              id={scheduleStyle.iconArrowRight}
              onClick={handleNextWeek}
            />
          </div>
          <div
            className={scheduleStyle.scheduleHeaderDate}
          >{`${currentDateStart.toDateString()} - ${currentDateEnd.toDateString()}`}</div>

          <FaPlus id={scheduleStyle.iconPlus} onClick={() => setOpen(true)} />
        </div>
        <div className={scheduleStyle.scheduleContent}>
          {days.map(({ dayName, dayNumber, fullDate }) => (
            <div className={scheduleStyle.scheduleContentDay} key={dayName}>
              <div className={scheduleStyle.scheduleContentDayNumber}>
                {dayNumber}
                <p id={scheduleStyle.scheduleContentDayName}>{dayName}</p>
              </div>
              {events && (
                <Event
                  events={events.filter(
                    (event) =>
                      event.time.split(',')[0] === fullDate.split(',')[0]
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
    </>
  );
};

export default Schedule;
