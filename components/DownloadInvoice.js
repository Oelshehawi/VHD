import axios from 'axios';
import { FaDownload } from 'react-icons/fa';
import { toast, Flip } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import modalDetailed from './styles/modalDetailed.module.css';

const DownloadInvoice = ({ fileId }) => {
  const showDownloadToast = () => {
    toast.info('Invoice Downloaded.', {
      transition: Flip,
      position: 'bottom-right',
    });
  };

  const handleDownload = async () => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/clients/${fileId}`,
        {
          responseType: 'json',
        }
      );

      const invoice = response.data.invoice;

      const bufferData = Buffer.from(invoice.data);

      if (invoice) {
        const fileName = invoice.filename;
        const fileData = new Blob([new Uint8Array(bufferData)], {
          type: invoice.contentType,
        });

        console.log(fileData);

        const fileUrl = window.URL.createObjectURL(fileData);
        const link = document.createElement('a');
        link.href = fileUrl;
        link.setAttribute('download', fileName);

        document.body.appendChild(link);
        link.click();

        URL.revokeObjectURL(fileUrl);
        document.body.removeChild(link);
      } else {
        console.error('Invoice data not found in the API response');
      }
    } catch (error) {
      console.error(error);
    }
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
