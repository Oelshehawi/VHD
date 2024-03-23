'use server'
import { fetchDueInvoices } from '../app/lib/data';
import InvoiceRow from './dashboard/InvoiceRow';

const JobsDueContainer = async () => {

  const dueInvoices = await fetchDueInvoices();

  return (
    <>
    
      <div className='shadow-lg rounded-lg h-96 md:!h-3/4 md:!mr-0 md:!ml-10 mt-2 mx-4 md:w-1/2 overflow-auto'>
        <table className='w-full table-fixed'>
          <thead>
            <tr className='bg-gray-100'>
              <th className='w-1/4 py-4 px-6 text-left text-gray-600 font-bold uppercase'>
                Job Name
              </th>
              <th className='w-1/4 py-4 px-6 text-left text-gray-600 font-bold uppercase'>
                Due Date
              </th>
              <th className='w-1/4 py-4 px-6 text-left text-gray-600 font-bold uppercase hidden md:block'>
                Scheduled?
              </th>
              <th className='w-1/4 py-4 px-6 text-left text-gray-600 font-bold uppercase'>
                Send Email?
              </th>
            </tr>
          </thead>
          <tbody className='bg-white'>
            {dueInvoices.map((invoice) => (
              <InvoiceRow key={invoice.invoiceId} invoiceData={invoice}/>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default JobsDueContainer;
