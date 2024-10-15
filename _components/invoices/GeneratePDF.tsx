'use client';
import axios from 'axios';
import { useState } from 'react';
import { FaPrint } from 'react-icons/fa';
import toast from 'react-hot-toast';

interface GeneratePDFProps {
  invoiceId: string;
  jobTitle: string;
}

const GeneratePDF = ({ invoiceId, jobTitle }: GeneratePDFProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleGeneratePDF = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`/invoices/${invoiceId}/pdf`, {
        responseType: 'blob',
      });
  
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
  
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${jobTitle} - Invoice.pdf`);

      document.body.appendChild(link);
  
      link.click();
  
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
  
      toast.success('PDF downloaded successfully!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleGeneratePDF}
      className='bg-darkBlue hover:bg-blue-700 text-white py-2 px-4 rounded inline-flex items-center'
      disabled={isLoading}
    >
      {isLoading ? (
        <>
          <FaPrint className='lg:mr-2' />
          <span>Printing...</span>
        </>
      ) : (
        <>
          <FaPrint className='lg:mr-2' />
          <span>Print</span>
        </>
      )}
    </button>
  );
};


export default GeneratePDF;
