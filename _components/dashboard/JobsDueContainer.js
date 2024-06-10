'use server';
import { fetchDueInvoices } from '../../app/lib/data';
import InvoiceRow from './InvoiceRow';

const JobsDueContainer = async () => {
  const dueInvoices = await fetchDueInvoices();

  return (
    <div className=' w-full lg:w-3/4 relative lg:h-[70vh] h-[50vh] md:p-4 border rounded-lg bg-white lg:ml-5 overflow-auto lg:mb-0 mb-5'>
      <div className='shadow-md rounded-lg md:!h-full md:!ml-0 md:w-full overflow-auto'>
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
              <InvoiceRow key={invoice.invoiceId} invoiceData={invoice} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default JobsDueContainer;
