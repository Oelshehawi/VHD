'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import Event from '../../components/Event';
import { ToastContainer, toast, Slide } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import dashboard from './dashboard.module.css';

const DashboardPage = () => {
  const utcOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  };

  const [events, setEvents] = useState([]);
  const todaysDate = new Date().toLocaleString('en-US', utcOptions);
  const [eventSchedule, setEventSchedule] = useState(false);
  const [onUpdate, setOnUpdate] = useState(false);

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

        console.log(updatedEvents);
        setEvents(updatedEvents);
      })
      .catch((err) => console.error(err));
  }, [onUpdate]);

  const showDeleteEventToast = () => {
    toast.success('Event Deleted Successfully!', {
      position: 'bottom-right',
      transition: Slide,
    });
  };

  return (
    <>
      <div className={dashboard.dashboardContainer}>
        <div className={dashboard.dashContainer}>
          Today's Schedule
          <div className={dashboard.innerContainer}>
            <Event
              eventSchedule={() => setEventSchedule(!eventSchedule)}
              events={events.filter((event) => {
                const eventDate = event.time.split(',')[0]; // Extract the date part from event.time
                const currentDate = todaysDate.split(',')[0]; // Extract the date part from todaysDate
                console.log('this is eventdate;', eventDate);
                console.log('this is currentdate;', currentDate);
                console.log(events);
                return eventDate === currentDate;
              })}
              onUpdate={() => setOnUpdate(!onUpdate)}
              showDeleteEventToast={showDeleteEventToast}
            />
          </div>
        </div>
      </div>
      <ToastContainer />
    </>
  );
};

export default DashboardPage;

export const Head = () => <title>VHD</title>;
