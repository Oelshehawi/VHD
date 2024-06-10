'use client';
import { useRouter } from 'next/navigation';
import { SendReminder } from '../Email/Button';
import { toast } from 'react-hot-toast';
import { updateInvoiceScheduleStatus } from '../../app/lib/actions';
import { formatDate } from '../../app/lib/utils';

const InvoiceRow = ({ invoiceData }) => {
  const router = useRouter();

  const handleCheckInvoice = async (e) => {
    try {
      e.currentTarget.form?.requestSubmit();
      toast.success('Invoice Schedule Status updated successfully');
    } catch (error) {
      console.error('Error updating invoice:', error);
      toast.error('Failed to update invoice status due to an error');
    }
  };

 
  return (
    <>
      <tr className='hover:bg-gray-100'>
        <td
          className='py-4 px-3 border-b border-gray-200 cursor-pointer hover:bg-darkGreen hover:text-white'
          onClick={() => router.push(`/invoices/${invoiceData.invoiceId}`)}
        >
          {invoiceData.jobTitle}
        </td>
        <td className='py-4 px-3 border-b border-gray-200'>
          {formatDate(invoiceData.dateDue.split('T')[0])}
        </td>
        <td className='py-4 px-3 border-b border-gray-200 text-center hidden md:table-cell'>
          <form
            action={updateInvoiceScheduleStatus.bind(
              null,
              invoiceData.invoiceId
            )}
          >
            <input
              type='checkbox'
              name='isScheduled'
              onChange={handleCheckInvoice}
              className='h-6 w-6 hover:cursor-pointer'
            />
          </form>
        </td>
        <td className='text-center align-middle py-4 px-3 border-b border-gray-200'>
          <SendReminder
            emailRecipient={invoiceData.jobTitle}
            emailSent={invoiceData.emailSent}
            invoiceId={invoiceData.invoiceId}
            emailExists={invoiceData.emailExists}
          />
        </td>
      </tr>
    </>
  );
};

export default InvoiceRow;
