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
  const [invoices, setInvoices] = useState([]);
  const [clients, setClients] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const eventsRes = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/events`
        );
        const invoicesRes = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/invoices`
        );
        const clientsRes = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/clients`
        );

        const utcOptions = {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          timeZone: 'UTC',
        };

        const updatedEvents = eventsRes.data.map((event) => {
          const utcDate = new Date(event.time);
          const utcString = utcDate.toLocaleString('en-US', utcOptions);
          return { ...event, time: utcString };
        });

        setEvents(updatedEvents);
        setInvoices(invoicesRes);
        setClients(clientsRes);
      } catch (error) {
        console.error(error);
      }
    };

    fetchData();
  }, [onUpdate]);

  const showDeleteEventToast = () => {
    toast.success('Event Deleted Successfully!', {
      position: 'bottom-right',
      transition: Slide,
    });
  };

  const jobsToday = events.filter((event) => {
    const eventDate = event.time.split(',')[0];
    const currentDate = todaysDate.split(',')[0];
    return eventDate === currentDate;
  });

  const totalClients = clients?.data?.length;

  const totalOverdueInvoices = invoices?.data?.filter(
    (invoice) => invoice.status === 'overdue'
  );

  return (
    <>
      <div className={dashboard.dashboardContainer}>
        <div className={dashboard.topLevel}>
          <div className={dashboard.jobsDueContainer}>words</div>
          <div className={dashboard.statsContainer}>
            <div className={dashboard.clientNumber}>
              Clients
              {totalClients ? (
                <p>{totalClients}</p>
              ) : (
                <div className={dashboard.loadingContainer}>
                  <div className={dashboard.loader}></div>
                </div>
              )}
            </div>
            <div className={dashboard.clientNumber}>
              Overdue
              {totalOverdueInvoices ? (
                <p>{totalOverdueInvoices.length}</p>
              ) : (
                <div className={dashboard.loadingContainer}>
                  <div className={dashboard.loader}></div>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className={dashboard.dashContainer}>
          Today's Schedule
          <div className={dashboard.innerContainer}>
            {jobsToday.length !== 0 ? (
              <Event
                eventSchedule={() => setEventSchedule(!eventSchedule)}
                events={jobsToday}
                onUpdate={() => setOnUpdate(!onUpdate)}
                showDeleteEventToast={showDeleteEventToast}
              />
            ) : (
              <p className={dashboard.center}> NO JOBS TODAY</p>
            )}
          </div>
        </div>
      </div>
      <ToastContainer />
    </>
  );
};

export default DashboardPage;

export const Head = () => <title>VHD</title>;
