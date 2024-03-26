import { Suspense } from 'react';
import JobsDueContainer from '../../components/dashboard/JobsDueContainer';
import {
  getClientCount,
  getOverDueInvoiceAmount,
  getPendingInvoiceAmount,
} from '../lib/data';
import {
  InfoBoxSkeleton,
  JobsDueContainerSkeleton,
  YearlySalesSkeleton,
} from '../../components/Skeletons';
import { FaPeopleGroup, FaMoneyBill, FaFile } from 'react-icons/fa6';
import YearlySales from '../../components/dashboard/YearlySales';
import { fetchYearlySalesData } from '../lib/data';

const DashboardPage = async () => {
  const salesData = await fetchYearlySalesData();
  return (
    <>
      <div className='flex flex-row h-[20vh] md:h-1/5 justify-between items-center md:px-6'>
        <div className='w-1/3 md:w-1/6 px-2 md:!px-0'>
          <Suspense fallback={<InfoBoxSkeleton />}>
            <ClientCount />
          </Suspense>
        </div>
        <div className='w-1/3 md:w-1/6 px-2 md:!px-0'>
          <Suspense fallback={<InfoBoxSkeleton />}>
            <OverdueAmount />
          </Suspense>
        </div>
        <div className='w-1/3 md:w-1/6 px-2 md:!px-0'>
          <Suspense fallback={<InfoBoxSkeleton />}>
            <PendingAmount />
          </Suspense>
        </div>
      </div>

      <div className='flex h-4/5 flex-col justify-between lg:flex-row px-4'>
        <Suspense fallback={<YearlySalesSkeleton />}>
          <YearlySales salesData={salesData} />
        </Suspense>
        <Suspense fallback={<JobsDueContainerSkeleton />}>
          <JobsDueContainer />
        </Suspense>
      </div>
    </>
  );
};

const ClientCount = async () => {
  const count = await getClientCount();
  return (
    <div className='p-2 h-full bg-darkGreen text-white rounded shadow space-y-2'>
      <div className='flex flex-row items-center justify-center md:justify-start'>
        <FaPeopleGroup className='h-6 w-6 ' />
        <div className='p-2 text-center text-xl hidden md:block'>
          Total Clients
        </div>
      </div>
      <div className='p-2 text-center text-md md:text-3xl bg-darkGray rounded'>
        {count}
      </div>
    </div>
  );
};

const OverdueAmount = async () => {
  const amount = await getOverDueInvoiceAmount();
  return (
    <div className='p-2 bg-darkGreen h-full text-white rounded shadow space-y-2'>
      <div className='flex flex-row items-center justify-center md:justify-start'>
        <FaFile className='h-6 w-6' />
        <div className='p-2 text-center text-xl hidden md:block '>
          Overdue Amount
        </div>
      </div>

      <div className='p-2 text-center text-md md:text-3xl bg-darkGray rounded'>
        ${amount}
      </div>
    </div>
  );
};

const PendingAmount = async () => {
  const amount = await getPendingInvoiceAmount();
  return (
    <div className='p-2 bg-darkGreen h-full text-white rounded shadow space-y-2'>
      <div className='flex flex-row items-center justify-center md:justify-start'>
        <FaMoneyBill className='h-6 w-6' />
        <div className='p-2 text-center text-xl hidden md:block'>
          Pending Amount
        </div>
      </div>
      <div className='p-2 text-center text-md md:text-3xl bg-darkGray rounded'>
        ${amount}
      </div>
    </div>
  );
};

export default DashboardPage;
