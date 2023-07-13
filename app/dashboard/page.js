'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import Event from '../../components/Event';
import { useRouter } from 'next/navigation';
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

  const router = useRouter();

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

  // Group invoices by invoice ID prefix
  const groupedLatestInvoices = invoices?.data?.reduce((group, invoice) => {
    const prefix = invoice.invoiceId.split('-')[0];
    if (!group[prefix] || group[prefix].dateIssued < invoice.dateIssued) {
      group[prefix] = invoice;
    }
    return group;
  }, []);

  const latestInvoices = Object.values(groupedLatestInvoices ?? []);

  const today = new Date();

  const groupedDueInvoices = latestInvoices.reduce((group, invoice) => {
    const dueDate = new Date(invoice.dateDue);
    const daysRemaining = Math.floor((dueDate - today) / (24 * 60 * 60 * 1000));

    if (daysRemaining >= 0 && daysRemaining <= 7) {
      group.push(invoice);
    }
    return group;
  }, []);

  const redirectToInvoiceDetails = (invoiceId) => {
    router.push(`/invoices/invoiceDetailed?id=${invoiceId}`);
  };

  const dueInvoices = Object.values(groupedDueInvoices ?? []);

  console.log(dueInvoices);

  return (
    <>
      <div className={dashboard.dashboardContainer}>
        <div className={dashboard.topLevel}>
          <div className={dashboard.statsContainer}>
            <div className={dashboard.statBox}>
              <p className={dashboard.statBoxHeader}>Clients</p>
              {totalClients ? (
                <p className={dashboard.statBoxParagraph}>{totalClients}</p>
              ) : (
                <div className={dashboard.loadingContainer}>
                  <div className={dashboard.loader}></div>
                </div>
              )}
            </div>
            <div className={dashboard.statBox}>
              <p className={dashboard.statBoxHeader}>Overdue</p>
              {totalOverdueInvoices ? (
                <p className={dashboard.statBoxParagraph}>
                  {totalOverdueInvoices.length}
                </p>
              ) : (
                <div className={dashboard.loadingContainer}>
                  <div className={dashboard.loader}></div>
                </div>
              )}
            </div>
          </div>
          <div className={dashboard.jobsDueContainer}>
            <p style={{ color: 'white' }}> Jobs Due Soon</p>
            <div className={dashboard.innerJobsDueContainer}>
              <div className={dashboard.jobsDueHeader}>
                <span>Job Title</span>
                <span> Due Date</span>
              </div>
              {groupedLatestInvoices ? (
                dueInvoices.map(({ jobTitle, invoiceId, dateDue, _id }) => {
                  const formattedDate = new Intl.DateTimeFormat('en-US', {
                    timeZone: 'UTC',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  }).format(new Date(dateDue));

                  return (
                    <div
                      className={dashboard.jobItem}
                      key={invoiceId}
                      onClick={() => redirectToInvoiceDetails(_id)}
                    >
                      <span>{jobTitle}</span>
                      <span>{formattedDate}</span>
                    </div>
                  );
                })
              ) : (
                <div className={dashboard.center}>
                  <div className={dashboard.loadingContainer}>
                    <div className={dashboard.loader}></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className={dashboard.dashContainer}>
          <p style={{ color: 'white' }}> Today's Schedule</p>
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
