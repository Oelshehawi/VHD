'use client';
import { useRouter } from 'next/navigation';

const TransactionHistory = ({ invoices }) => {
  const router = useRouter();

  return (
    <div className='w-full md:w-1/2 px-2 mb-2 lg:mb-0'>
      <div className='border rounded shadow'>
        <div className='px-4 py-2 border-b text-xl '>Transaction History</div>
        <div className='p-4'>
          {invoices.length !== 0 ? (
            <ul className='space-y-2'>
              {invoices.map((invoice) => (
                <li
                  key={invoice._id}
                  className='border rounded p-2 hover:bg-gray-100 cursor-pointer'
                  onClick={()=> router.replace(`/invoices/${invoice._id}`)}
                >
                  #{invoice.invoiceId} - {invoice.jobTitle}
                </li>
              ))}
            </ul>
          ) : (
            <div className='text-center p-2'>No invoices for this client</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TransactionHistory;
