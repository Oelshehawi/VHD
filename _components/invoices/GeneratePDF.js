'use client';
import axios from 'axios';
import { useState } from 'react';
import { FaPrint } from 'react-icons/fa';
import toast from 'react-hot-toast';

const GeneratePDF = ({ invoiceData }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleGeneratePDF = async () => {
    setIsLoading(true);
    try {
      const response = await axios.post(`/api/renderTemplate`, invoiceData);

      if (response.data && response.data.download_url) {
        window.open(response.data.download_url);
        toast.success('PDF generated successfully!');
      } else {
        console.error('PDF URL not found in the response');
        toast.error('Failed to generate PDF.');
      }
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
