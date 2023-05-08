import React from "react";
import axios from "axios";
import { FaDownload } from "react-icons/fa";

const DownloadInvoice = ({ fileId, showDownloadToast }) => {
  const handleDownload = () => {
    axios
      .get(`http://127.0.0.1:4000/api/Clients/${fileId}`, {
        responseType: "blob",
      })
      .then((res) => {
        const fileName = res.headers["content-disposition"].split("=")[1];
        const url = window.URL.createObjectURL(
          new Blob([res.data], { type: res.headers["content-type"] })
        );
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `${fileName}`);
        document.body.appendChild(link);
        showDownloadToast();
        link.click();
      })
      .catch((err) => console.error(err));
  };
  return <FaDownload onClick={handleDownload} className="icon-hover" />;
};

export default DownloadInvoice;
