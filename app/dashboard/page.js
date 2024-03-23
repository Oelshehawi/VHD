import { Suspense } from 'react';
import JobsDueContainer from '../../components/JobsDueContainer';
import { getClientCount, getOverDueInvoiceAmount, getPendingInvoiceAmount } from '../lib/data';
import { InfoBoxSkeleton } from '../../components/Skeletons';

const DashboardPage = () => {
  return (
    <div className='mt-4'>
      <div className='flex flex-row justify-evenly'>
        <div className='w-full md:w-1/6 px-2'>
          <Suspense fallback={<InfoBoxSkeleton />}>
            <ClientCount />
          </Suspense>
        </div>
        <div className='w-full md:w-1/6 px-2'>
          <Suspense fallback={<InfoBoxSkeleton />}>
            <OverdueAmount />
          </Suspense>
        </div>
        <div className='w-full md:w-1/6 px-2'>
          <Suspense fallback={<InfoBoxSkeleton />}>
            <PendingAmount />
          </Suspense>
        </div>
      </div>
      <JobsDueContainer />
    </div>
  );
};

const ClientCount = async () => {
  const count = await getClientCount();
  return (
    <div className='p-2 bg-darkGreen text-white rounded shadow space-y-2'>
      <div className='p-2 text-center text-3xl'>Total Clients</div>
      <div className='p-2 text-center text-3xl'>{count}</div>
    </div>
  );
};

const OverdueAmount = async () => {
  const amount = await getOverDueInvoiceAmount();
  return (
    <div className='p-2 bg-darkGreen text-white rounded shadow space-y-2'>
      <div className='p-2 text-center text-3xl'>Overdue Invoices</div>
      <div className='p-2 text-center text-3xl'>{amount}</div>
    </div>
  );
};

const PendingAmount = async () => {
  const amount = await getPendingInvoiceAmount();
  return (
    <div className='p-2 bg-darkGreen text-white rounded shadow space-y-2'>
      <div className='p-2 text-center text-3xl'>Pending Amount</div>
      <div className='p-2 text-center text-3xl'>{amount}</div>
    </div>
  );
};

export default DashboardPage;
