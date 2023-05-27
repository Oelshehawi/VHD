import React, { useState, useEffect } from "react";
import Layout from "../components/Layout";
import axios from "axios";
import Event from "../components/Event";
import { API_URL } from "../../../shared/config";
import { ToastContainer, toast, Slide } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const IndexPage = () => {
  const [events, setEvents] = useState([]);
  const todaysDate = new Date().toISOString().split("T")[0];
  const [eventSchedule, setEventSchedule] = useState(false);
  const [onUpdate, setOnUpdate] = useState(false);

  useEffect(() => {
    axios
      .get(`${API_URL}/events/`)
      .then((res) => setEvents(res.data))
      .catch((err) => console.error(err));
  }, [onUpdate]);

  const showDeleteEventToast = () => {
    toast.success("Event Deleted Successfully!", {
      position: "bottom-right",
      transition: Slide,
    });
  };

  return (
    <Layout>
      <div className="dashboard-container">
        <div className="dashContainer">
          Today's Schedule
          <div className="innerContainer">
            <Event
              eventSchedule={() => setEventSchedule(!eventSchedule)}
              events={events.filter((event) => {
                const eventDate = event.time.split("T")[0];
                return eventDate === todaysDate;
              })}
              onUpdate={() => setOnUpdate(!onUpdate)}
              showDeleteEventToast={showDeleteEventToast}
            />
          </div>
        </div>
      </div>
      <ToastContainer />
    </Layout>
  );
};

export default IndexPage;

export const Head = () => <title>VHD</title>;
