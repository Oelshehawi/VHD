import React from "react";
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
        date: values.Date,
        location: values.location,
        notes: values.Notes,
        invoice: values.invoice[0]
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
        <form
          id="addClientForm"
          className="modalContent"
          onSubmit={handleSubmit(handleSave)}
        >
          <label htmlFor="clientName">Client's Name: </label>
          <input
            {...register("clientName")}
            className="mediumInput"
            type="text"
          />
          <label htmlFor="jobTitle">Job Title: </label>
          <input
            {...register("jobTitle")}
            className="mediumInput"
            type="text"
          />
          <label htmlFor="email">Email: </label>
          <input {...register("email")} className="mediumInput" type="email" />
          <label htmlFor="phoneNumber">Phone Number: </label>
          <input
            {...register("phoneNumber")}
            className="mediumInput"
            type="text"
          />
          <label htmlFor="Date">Date: </label>
          <input
            {...register("Date")}
            className="smallInput"
            type="datetime-local"
          />
          <label htmlFor="location">Location: </label>
          <input
            {...register("location")}
            className="mediumInput"
            type="text"
          />
          <label htmlFor="Notes">Notes: </label>
          <textarea {...register("Notes")} className="largeInput" type="text" />
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
            <p style={{ color: "red", padding:"5px" }}>Invoice is required </p>
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
