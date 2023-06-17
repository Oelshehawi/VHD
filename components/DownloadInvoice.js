import axios from "axios";
import { FaDownload } from "react-icons/fa";
import { toast, Flip } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import modalDetailed from "./styles/modalDetailed.module.css"

const DownloadInvoice = ({ fileId }) => {
  const showDownloadToast = () => {
    toast.info("Invoice Downloaded.", {
      transition: Flip,
      position: "bottom-right",
    });
  };

  const handleDownload = () => {
    axios
      .get(`${process.env.NEXT_PUBLIC_API_URL}/clients/${fileId}`, {
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
        link.click();
      })
      .catch((err) => console.error(err));
  };
  return (
    <>
      <FaDownload
        onClick={() => {
          handleDownload();
          showDownloadToast();
        }}
        className={modalDetailed.iconHover}
      />
    </>
  );
};

export default DownloadInvoice;