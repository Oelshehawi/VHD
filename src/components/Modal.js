import React from "react";

const Modal = ({ open, onClose }) => {
  if (!open) return null;
  return (
    <div onClick={onClose} className="overlay">
      <div onClick={(e) => {
        e.stopPropagation();
      }} className="modalContainer">
        <p className="closeBtn" onClick={onClose}>X</p>
        <div className="modalContent">STUFF</div>
        <div className="btnContainer">
          <button className="btnPrimary">
            <span className="bold"> Submit</span>
          </button>
          <button className="btnOutline">
            <span className="bold"> No thanks</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Modal;
