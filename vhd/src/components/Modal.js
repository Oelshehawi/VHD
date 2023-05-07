import React from "react";
import "../style/modal.css";
import { useState } from "react";
import { useForm } from "react-hook-form";
import Axios from "axios";

const Modal = ({ open, onClose }) => {
  //Setting variables for displaying file name in Attach invoice button
  const [file, setfile] = useState("Attach Invoice");

  //Assigning empty input to clear form
  const emptyInput = {};

  //values used to submit and manipulate form
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  //Function that handles form submit
  const handleSave = (values) => {
    // Print out form values
    console.log({ values });

    //Send data using Axios
    Axios.post(
      "http://127.0.0.1:4000/api/Clients/",
      {
        clientName: values.clientName,
        jobTitle: values.jobTitle,
        email: values.email,
        phoneNumber: values.phoneNumber,
        date: values.date,
        price: values.price,
        frequency: values.frequency,
        location: values.location,
        notes: values.notes,
        invoice: values.invoice[0],
      },
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    ).then((response) => {
      console.log(response);
    });

    //Empty form input
    reset({ ...emptyInput });
    setfile("Attach Invoice");

    //Close Modal
    onClose();
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
        className="modalContainer"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          e.stopPropagation();
        }}
      >
        <div className="modalHeader">
          Add New Client
          <button className="closeBtn" onClick={onClose}>
            X
          </button>
        </div>
        <form
          id="addClientForm"
          className="modalContent"
          onSubmit={handleSubmit(handleSave)}
        >
          <div className="modal-content-input-container">
            <input
              {...register("clientName")}
              className="modal-content-input"
              type="text"
              placeholder="Client's Name"
            />
            <span className="modal-content-input-focus"></span>
          </div>
          <div className="modal-content-input-container">
            <input
              {...register("jobTitle")}
              className="modal-content-input"
              type="text"
              placeholder="Job Title"
            />
            <span className="modal-content-input-focus"></span>
          </div>
          <div className="modal-content-input-container">
            <input
              {...register("email")}
              className="modal-content-input"
              type="email"
              placeholder="Email"
            />
            <span className="modal-content-input-focus"></span>
          </div>
          <div className="modal-content-input-container">
            <input
              {...register("phoneNumber")}
              className="modal-content-input"
              type="tel"
              placeholder="Phone Number"
            />
            <span className="modal-content-input-focus"></span>
          </div>
          <div className="modal-content-input-container">
            <input
              {...register("date")}
              className="modal-content-input"
              type="date"
              placeholder="Date"
            />
            <span className="modal-content-input-focus"></span>
          </div>
          <div className="modal-content-input-container">
            <input
              {...register("location")}
              className="modal-content-input"
              type="text"
              placeholder="Location"
            />
            <span className="modal-content-input-focus"></span>
          </div>
          <div className="modal-content-input-container">
            <input
              {...register("price")}
              className="modal-content-input"
              type="number"
              placeholder="Price"
              step="any"
              min="1"
            />
            <span className="modal-content-input-focus"></span>
          </div>
          <div className="modal-content-input-container">
            <input
              {...register("frequency")}
              className="modal-content-input"
              type="number"
              placeholder="Frequency per Year"
            />
            <span className="modal-content-input-focus"></span>
          </div>
          <div className="modal-content-input-container">
            <textarea
              {...register("notes")}
              className="modal-content-input"
              placeholder="Notes"
            />
            <span className="modal-content-input-focus"></span>
          </div>
          <label className="attach" htmlFor="invoice">
            {file}
          </label>
          <input
            type="file"
            name="invoice"
            {...register("invoice", {
              onChange: (e) => {
                setfile(e.target.files[0].name);
              },
              required: true,
            })}
            id="invoice"
          />
          {errors.invoice && (
            <p style={{ color: "red", padding: "5px" }}>Invoice is required </p>
          )}
        </form>
        <div className="modalFooter">
          <button
            id="submitButtonForm"
            type="submit"
            value="submit"
            form="addClientForm"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
};

export default Modal;
