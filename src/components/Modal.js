import React from "react";
import { useState,useRef } from "react";

const Modal = ({ open, onClose }) => {
  const [file, setfile] = useState("Attach Invoice");

  const fileInputField = useRef(null)

  const handleFileChange = (e) => {
    setfile(e.target.files[0].name)
  };


  if (!open) return null;
  return (
    <div onClick={onClose} className="overlay">
      <div
        onClick={(e) => {
          e.stopPropagation();
        }}
        className="modalContainer"
      >
        <div className="modalHeader">
          Add New Client
          <p className="closeBtn" onClick={onClose}>
            X
          </p>
        </div>
        <form id="addClientForm" className="modalContent">
          <label htmlFor="clientName">Client's Name: </label>
          <input Name="clientName" className="mediumInput" type="text" />
          <label htmlFor="jobTitle">Job Title: </label>
          <input Name="jobTitle" className="mediumInput" type="text" />
          <label htmlFor="email">Email: </label>
          <input Name="email" className="mediumInput" type="email" />
          <label htmlFor="phoneNumber">Phone Number: </label>
          <input Name="phoneNumber" className="mediumInput" type="text" />
          <label htmlFor="Date">Date: </label>
          <input Name="Date" className="smallInput" type="datetime-local" />
          <label htmlFor="location">Location: </label>
          <input Name="location" className="mediumInput" type="text" />
          <label htmlFor="Notes">Notes: </label>
          <textarea Name="Notes" className="largeInput" type="text" />
          <label className="attach" htmlFor="attachInvoice">
          {file}
          </label>
          <input type="file" name="attachInvoice" id="attachInvoice" onClick={() => fileInputField.current.click()} onChange={handleFileChange} ref={fileInputField}/>
        </form>
        <div className="modalFooter">
          <input
            id="submitButtonForm"
            type="submit"
            value="submit"
            form="addClientForm"
          />
        </div>
      </div>
    </div>
  );
};

export default Modal;
