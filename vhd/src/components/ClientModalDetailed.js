import React, { useState } from "react";
import "../style/modal.css";
import DownloadInvoice from "./DownloadInvoice";
import { FaTrashAlt } from "react-icons/fa";
import { FaPenSquare } from "react-icons/fa";
import { Buffer } from "buffer";
import axios from "axios";

const ClientModalDetailed = ({ open, onClose, data, clientData }) => {
  const client = clientData.find((obj) => obj._id === data);

  let base64Image = "";

  const [disabled, setDisabled] = useState(true);
  const [name, setName] = useState("");
  const [jobtitle, setJobtitle] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [date, setDate] = useState("");
  const [price, setPrice] = useState("");
  const [frequency, setFrequency] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");

  const updateAll = () => {
    setName(client.clientName);
    setJobtitle(client.jobTitle);
    setEmail(client.email);
    setPhoneNumber(client.phoneNumber);
    setDate(client.date);
    setPrice(client.price);
    setFrequency(client.frequency);
    setLocation(client.location);
    setNotes(client.notes);
  };

  if (client) {
    base64Image = Buffer.from(client.invoice.data).toString("base64");
  }

  const handleChange = (e) => {
    e.target.setAttribute("type", "date");
  };

  const handleDelete = () => {
    axios
      .delete(`http://127.0.0.1:4000/api/Clients/${client._id}`)
      .then((response) => {
        console.log("Record deleted successfully");
      })
      .catch((error) => {
        console.log("Error deleting record:", error);
      });
      onClose()
  };

  const handleUpdate = () => {
    axios
      .put(`http://127.0.0.1:4000/api/Clients/${client._id}`, {
        clientName: name,
        jobTitle: jobtitle,
        email: email,
        phoneNumber: phoneNumber,
        date: date,
        price: price,
        frequency: frequency,
        location: location,
        notes: notes,
      })
      .then((response) => {
        console.log("Record Updated successfully");
      })
      .catch((error) => {
        console.log("Error Updating record:", error);
      });
      onClose()
  };

  if (!open) return null;
  return (
    <div
      onClick={onClose}
      className="overlay"
      role="button"
      tabIndex={0}
      onKeyDown={onClose}
    >
      <div
        onClick={(e) => {
          e.stopPropagation();
        }}
        className="modal"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          e.stopPropagation();
        }}
      >
        <div className="modal-header">
          {client.jobTitle}
          <button className="closeBtn" onClick={onClose}>
            X
          </button>
        </div>
        <div className="modal-content">
          <div className="modal-content-invoice">
            <img src={`data:image/png;base64,${base64Image}`} alt="" />
          </div>
          <div className="modal-content-details">
            <div className="modal-content-input-container">
              <input
                className="modal-content-input"
                type="text"
                placeholder={client.clientName}
                disabled={disabled}
                onChange={(e) => setName(e.target.value)}
              />
              <span className="modal-content-input-focus"></span>
            </div>
            <div className="modal-content-input-container">
              <input
                className="modal-content-input"
                type="text"
                placeholder={client.jobTitle}
                disabled={disabled}
                onChange={(e) => setJobtitle(e.target.value)}
              />
              <span className="modal-content-input-focus"></span>
            </div>
            <div className="modal-content-input-container">
              <input
                className="modal-content-input"
                type="email"
                placeholder={client.email}
                disabled={disabled}
                onChange={(e) => setEmail(e.target.value)}
              />
              <span className="modal-content-input-focus"></span>
            </div>
            <div className="modal-content-input-container">
              <input
                className="modal-content-input"
                type="text"
                placeholder={client.phoneNumber}
                disabled={disabled}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
              <span className="modal-content-input-focus"></span>
            </div>
            <div className="modal-content-input-container">
              <input
                className="modal-content-input"
                type="text"
                placeholder={client.date ? client.date.split("T")[0] : null}
                disabled={disabled}
                onClick={handleChange}
                onChange={(e) => setDate(e.target.value)}
              />
              <span className="modal-content-input-focus"></span>
            </div>
            <div className="modal-content-input-container">
              <input
                className="modal-content-input"
                type="number"
                placeholder={client.price}
                disabled={disabled}
                onChange={(e) => setPrice(e.target.value)}
              />
              <span className="modal-content-input-focus"></span>
            </div>
            <div className="modal-content-input-container">
              <input
                className="modal-content-input"
                type="number"
                placeholder={client.frequency}
                disabled={disabled}
                onChange={(e) => setFrequency(e.target.value)}
              />
              <span className="modal-content-input-focus"></span>
            </div>
            <div className="modal-content-input-container">
              <input
                className="modal-content-input"
                type="text"
                placeholder={client.location}
                disabled={disabled}
                onChange={(e) => setLocation(e.target.value)}
              />
              <span className="modal-content-input-focus"></span>
            </div>
            <div className="modal-content-input-container">
              <textarea
                className="modal-content-input"
                type="text"
                placeholder={client.notes}
                disabled={disabled}
                onChange={(e) => setNotes(e.target.value)}
              />
              <span className="modal-content-input-focus"></span>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <div className="modal-footer-icons">
            <FaTrashAlt className="icon-hover" onClick={handleDelete} />
            <FaPenSquare
              className="icon-hover"
              onClick={() => {
                setDisabled(false);
                updateAll();
              }}
            />
          </div>
          <button
            id="modal-footer-update"
            value="Update"
            onClick={handleUpdate}
            disabled={disabled}
          >
            Update entry{" "}
          </button>
          <DownloadInvoice fileId={client._id} />
        </div>
      </div>
    </div>
  );
};

export default ClientModalDetailed;
