import React, { useState, useEffect } from "react";
import DownloadInvoice from "./downloadInvoice";
import { FaTrashAlt } from "react-icons/fa";
import { FaPenSquare } from "react-icons/fa";
import { Buffer } from "buffer";
import axios from "axios";
import Image from "next/image";
import { ToastContainer, toast, Slide } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { API_URL } from "../../../shared/config";

const ClientModalDetailed = ({
  open,
  onClose,
  rowId,
  clientData,
  onUpdate,
}) => {
  const client = clientData.find((obj) => obj._id === rowId);

  const base64Image = Buffer.from(client.invoice.data).toString("base64");

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

  const showDeleteToast = () => {
    toast.success("Client Deleted Successfully!", {
      transition: Slide,
      position: "bottom-right",
    });
  };

  const showUpdateToast = () => {
    toast.success("Client Updated Successfully!", {
      transition: Slide,
      position: "bottom-right",
    });
  };

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

  const handleChange = (e) => {
    e.target.setAttribute("type", "date");
  };

  const handleDelete = () => {
    axios
      .delete(`${API_URL}/clients/${client._id}`)
      .then((response) => {
        console.log("Record deleted successfully");
      })
      .catch((error) => {
        console.log("Error deleting record:", error);
      });
    onClose();
    showDeleteToast();
    onUpdate();
  };

  const handleUpdate = () => {
    axios
      .put(`${API_URL}/clients/${client._id}`, {
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
        console.log(response.data);
      })
      .catch((error) => {
        console.log("Error Updating record:", error);
      });
    onClose();
    showUpdateToast();
    onUpdate()
  };

  const inputFields = [
    {
      name: "Client's Name",
      type: "text",
      placeholder: client.clientName,
      setter: setName,
    },
    {
      name: "jobTitle",
      type: "text",
      placeholder: client.jobTitle,
      setter: setJobtitle,
    },
    {
      name: "email",
      type: "email",
      placeholder: client.email,
      setter: setEmail,
    },
    {
      name: "phoneNumber",
      type: "tel",
      placeholder: client.phoneNumber,
      setter: setPhoneNumber,
    },
    {
      name: "date",
      type: "text",
      placeholder: client.date ? client.date.split("T")[0] : null,
      setter: setDate,
    },
    {
      name: "location",
      type: "text",
      placeholder: client.location,
      setter: setLocation,
    },
    {
      name: "price",
      type: "number",
      placeholder: client.price,
      setter: setPrice,
    },
    {
      name: "frequency",
      type: "number",
      placeholder: client.frequency,
      setter: setFrequency,
    },
    {
      name: "notes",
      type: "textarea",
      placeholder: client.notes,
      setter: setNotes,
    },
  ];

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
            <Image
              src={`data:image/png;base64,${base64Image}`}
              alt=""
              width={500}
              height={500}
              className="full-width-height"
            />
          </div>
          <div className="modal-content-details">
            {inputFields.map(({ name, placeholder, type, setter }) => (
              <div className="modal-content-input-container" key={name}>
                {type === "textarea" ? (
                  <textarea
                    className="modal-content-input"
                    name={name}
                    type={type}
                    placeholder={placeholder !== "" && placeholder !== null ? placeholder : name}
                    disabled={disabled}
                    onChange={(e) => setter(e.target.value)}
                  />
                ) : name === "date" ? (
                  <input
                    className="modal-content-input"
                    name={name}
                    type={type}
                    placeholder={placeholder !== "" && placeholder !== null ? placeholder : name}
                    disabled={disabled}
                    onClick={handleChange}
                    onChange={(e) => setter(e.target.value)}
                  />
                ) : (
                  <input
                    className="modal-content-input"
                    name={name}
                    type={type}
                    placeholder={placeholder !== "" && placeholder !== null ? placeholder : name}
                    disabled={disabled}
                    onChange={(e) => setter(e.target.value)}
                  />
                )}

                <span className="modal-content-input-focus"></span>
              </div>
            ))}
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
      <ToastContainer />
    </div>
  );
};

export default ClientModalDetailed;
