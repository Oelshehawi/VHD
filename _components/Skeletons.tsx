const shimmer =
  'before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/60 before:to-transparent';

export function InfoBoxSkeleton() {
  return (
    <div
      className={`${shimmer} relative overflow-hidden rounded-xl bg-gray-100 p-2 shadow-md`}
    >
      <div className='flex flex-col space-y-2 p-2'>
        <div
          className={`flex flex-row items-center justify-center md:justify-start`}
        >
          <div className='h-6 w-6 rounded-full bg-gray-200'></div>
          <div className='h-4 p-2 ml-2 w-3/4 items-center justify-center md:justify-start rounded-md hidden md:block bg-gray-200'></div>
        </div>
        <div className='h-6 md:h-14 w-full text-xl rounded-md bg-darkGray p-2'></div>
      </div>
    </div>
  );
}

export const JobsDueContainerSkeleton = () => {
  return (
    <div className='w-3/4 relative lg:h-[70vh] h-[50vh] p-4 border rounded-lg bg-white ml-5 animate-pulse'>
      <div className='shadow-md rounded-lg md:!h-full md:!ml-0 md:w-full overflow-auto'>
        <table className='w-full table-fixed'>
          <thead>
            <tr className='bg-gray-100'>
              <th className='w-1/4 py-4 px-6'>
                <div className='h-4 bg-gray-200 rounded-md'></div>
              </th>
              <th className='w-1/4 py-4 px-6'>
                <div className='h-4 bg-gray-200 rounded-md'></div>
              </th>
              <th className='w-1/4 py-4 px-6 hidden md:table-cell'>
                <div className='h-4 bg-gray-200 rounded-md'></div>
              </th>
              <th className='w-1/4 py-4 px-6'>
                <div className='h-4 bg-gray-200 rounded-md'></div>
              </th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 10 }).map((_, index) => (
              <tr key={index}>
                <td className='py-4 px-6 border-b border-gray-200'>
                  <div className='h-6 bg-gray-200 rounded-md'></div>
                </td>
                <td className='py-4 px-6 border-b border-gray-200'>
                  <div className='h-6 bg-gray-200 rounded-md'></div>
                </td>
                <td className='py-4 px-6 border-b border-gray-200 hidden md:table-cell'>
                  <div className='h-6 bg-gray-200 rounded-md'></div>
                </td>
                <td className='py-4 px-6 border-b border-gray-200'>
                  <div className='h-6 bg-gray-200 rounded-md'></div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const YearlySalesSkeleton = () => {
  return (
    <div className='flex flex-col w-3/4 m-auto'>
      <div className='animate-pulse w-full md:col-span-2 relative lg:h-[70vh] h-[50vh] p-4 border rounded-lg bg-white'>
        <div className='h-full w-full rounded-lg bg-gray-300'></div>
      </div>
      <div className='flex justify-center items-center'>
        <div className='h-10 w-32 mt-2 rounded bg-darkGray'></div>
      </div>
    </div>
  );
};

export const TableContainerSkeleton = () => {
  return (
    <div className='flex items-center justify-center min-h-full'>
      <div className='bg-white rounded-lg shadow-lg w-3/4 p-4 min-h-[80vh] animate-pulse'>
        <div className='text-xl font-bold h-6 bg-gray-300 rounded'></div>
        <div className='flex flex-col py-2 md:flex-row gap-3'>
          {/* Search Input Skeleton */}
          <div className='flex w-full md:w-80'>
            <div className='w-full h-10 bg-gray-200 rounded-l-md'></div>
            <div className='w-10 h-10 bg-gray-200 rounded-r-md'></div>
          </div>
          {/* Select Skeleton */}
          <div className='w-full h-10 bg-gray-200 rounded-md'></div>
        </div>
        {/* Table Rows Skeleton */}
        <div className='overflow-auto min-h-[70vh] max-h-[70vh] rounded'>
          <div className='w-full'>
            <div className='flex justify-between bg-darkGreen text-white'>
              {Array(4).fill(0).map((_, index) => (
                <div key={index} className='w-1/4 h-6 bg-gray-300 rounded mx-3.5 my-3'></div>
              ))}
            </div>
            {Array(20).fill(0).map((_, rowIndex) => (
              <div key={rowIndex} className={`flex justify-between ${rowIndex % 2 === 0 ? 'bg-borderGreen' : 'bg-darkGreen'} text-white`}>
                {Array(4).fill(0).map((_, cellIndex) => (
                  <div key={cellIndex} className='w-1/4 h-6 bg-gray-300 rounded mx-3.5 my-2.5'></div>
                ))}
              </div>
            ))}
          </div>
        </div>
        {/* Pagination Skeleton */}
        <div className='flex items-center justify-between mt-2'>
          <div className='flex gap-2'>
            {Array(4).fill(0).map((_, index) => (
              <div key={index} className='p-1 w-8 h-8 bg-gray-200 rounded'></div>
            ))}
          </div>
          <div className='flex items-center gap-2'>
            <div className='w-16 h-8 bg-gray-200 rounded'></div>
            <div className='w-20 h-8 bg-gray-200 rounded'></div>
          </div>
        </div>
      </div>
    </div>
  );
};


export const ClientDetailedSkeleton = () => {
  return (
    <div className='mt-4 px-5 animate-pulse'>
      <div className='flex mb-4 justify-between'>
        <div className=' text-gray-600 py-2 px-4 rounded inline-flex items-center'>
          <div className='h-4 w-4 bg-gray-300 rounded-full mr-2'></div>
          <div className='h-4 w-24 bg-gray-300 rounded'></div>
        </div>
        <div className='bg-blue-500 text-white py-2 px-4 rounded inline-flex items-center mr-2'>
          <div className='h-4 w-4 bg-gray-300 rounded-full mr-2'></div>
          <div className='h-4 w-24 bg-gray-300 rounded'></div>
        </div>
      </div>
      <div className='flex flex-wrap -mx-2'>
        {/* InlineEditClient Skeleton */}
        <div className='w-full md:w-1/2 px-2 mb-4'>
          <div className='border rounded shadow'>
            <div className='px-4 py-2 border-b bg-gray-300'></div>
            <div className='p-4 space-y-2'>
              {Array(4).fill(0).map((_, idx) => (
                <div key={idx} className='flex items-center'>
                  <div className='w-24 h-4 bg-gray-300 rounded mr-2'></div>
                  <div className='flex-1 h-4 bg-gray-300 rounded'></div>
                </div>
              ))}
              <div className='flex justify-end mt-4 space-x-2'>
                <div className='px-4 py-2 bg-gray-200 rounded w-20 h-6'></div>
                <div className='px-4 py-2 bg-blue-500 rounded w-20 h-6'></div>
              </div>
            </div>
          </div>
        </div>
        {/* TransactionHistory Skeleton */}
        <div className='w-full md:w-1/2 px-2 mb-2 lg:mb-0'>
          <div className='border rounded shadow'>
            <div className='px-4 py-2 border-b bg-gray-300'></div>
            <div className='p-4 space-y-2'>
              {Array(4).fill(0).map((_, idx) => (
                <div key={idx} className='border rounded p-2 bg-gray-100'></div>
              ))}
              <div className='text-center p-2 bg-gray-100'></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


export const InvoiceDetailedSkeleton = () => {
  return (
    <div className='mt-4 px-5 animate-pulse'>
      <div className='flex mb-4 justify-between'>
        <div className='bg-gray-700 text-white py-2 px-4 rounded inline-flex items-center'>
          <div className='h-4 w-4 bg-gray-300 rounded-full mr-2'></div>
          <div className='h-4 w-24 bg-gray-300 rounded'></div>
        </div>
        <div className='flex space-x-2'>
          <div className='bg-darkGreen text-white py-2 px-4 rounded inline-flex items-center'>
            <div className='h-4 w-4 bg-gray-300 rounded-full mr-2'></div>
            <div className='h-4 w-16 bg-gray-300 rounded'></div>
          </div>
          <div className='bg-blue-500 text-white py-2 px-4 rounded inline-flex items-center'>
            <div className='h-4 w-4 bg-gray-300 rounded-full mr-2'></div>
            <div className='h-4 w-16 bg-gray-300 rounded'></div>
          </div>
        </div>
      </div>
      <div className='flex flex-wrap lg:flex-nowrap text-sm lg:text-[1rem] -mx-2'>
        {/* Invoice Details Skeleton */}
        <div className='w-full lg:w-[60%] mb-4 px-2'>
          <div className='border rounded shadow'>
            <div className='px-4 py-2 border-b bg-gray-300'></div>
            <div className='p-4 space-y-2'>
              {Array(5)
                .fill(0)
                .map((_, idx) => (
                  <div key={idx} className='flex justify-between items-center py-2'>
                    <div className='w-1/2 h-4 bg-gray-300 rounded'></div>
                    <div className='w-1/4 h-4 bg-gray-300 rounded'></div>
                  </div>
                ))}
              <div className='flex justify-end mt-4'>
                <div className='w-32 h-6 bg-gray-200 rounded'></div>
              </div>
            </div>
          </div>
        </div>
        {/* Client Details Skeleton */}
        <div className='w-full lg:w-[40%] mb-4 px-2'>
          <div className='border rounded shadow'>
            <div className='px-4 py-2 border-b bg-gray-300'></div>
            <div className='p-4 space-y-2'>
              {Array(3)
                .fill(0)
                .map((_, idx) => (
                  <div key={idx} className='flex items-center'>
                    <div className='w-24 h-4 bg-gray-300 rounded mr-2'></div>
                    <div className='flex-1 h-4 bg-gray-300 rounded'></div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
      {/* Price Breakdown Skeleton */}
      <div className='w-full lg:w-[60%] mb-4 px-2'>
        <div className='border rounded shadow'>
          <div className='px-4 py-2 border-b bg-gray-300'></div>
          <div className='p-4 space-y-2'>
            {Array(3)
              .fill(0)
              .map((_, idx) => (
                <div key={idx} className='flex justify-between items-center py-2'>
                  <div className='w-1/2 h-4 bg-gray-300 rounded'></div>
                  <div className='w-1/4 h-4 bg-gray-300 rounded'></div>
                </div>
              ))}
            <div className='flex justify-end mt-4'>
              <div className='w-32 h-6 bg-gray-200 rounded'></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};