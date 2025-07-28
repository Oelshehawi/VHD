const shimmer =
  'before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent';

export function InfoBoxSkeleton() {
  return (
    <div
      className={`${shimmer} relative overflow-hidden rounded-xl bg-darkGreen p-4 shadow-lg border border-borderGreen`}
    >
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-3'>
          <div className='h-8 w-8 rounded-lg bg-darkBlue/50 border border-borderGreen'></div>
          <div>
            <div className='h-5 w-24 rounded-md bg-darkGray'></div>
            <div className='h-3 w-20 mt-1 rounded-md bg-darkGray'></div>
          </div>
        </div>
        <div className='h-16 w-16 rounded-lg bg-darkGray border border-borderGreen'></div>
      </div>
    </div>
  );
}

export const JobsDueContainerSkeleton = () => {
  return (
    <div className='flex h-[50vh] w-full flex-col rounded-xl border border-borderGreen bg-darkGreen p-6 shadow-lg lg:h-[70vh] lg:w-[50%] animate-pulse'>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-borderGreen pb-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-darkBlue border border-borderGreen"></div>
          <div>
            <div className="h-6 w-20 bg-darkGray rounded-md mb-1"></div>
            <div className="h-4 w-32 bg-darkGray rounded-md"></div>
          </div>
        </div>
        <div className="h-10 w-10 rounded-full bg-darkGray border border-borderGreen"></div>
      </div>

      {/* Status Cards */}
      <div className="flex gap-4 mb-4">
        <div className="flex-1 h-16 bg-darkBlue/50 rounded-lg border border-borderGreen"></div>
        <div className="flex-1 h-16 bg-darkBlue/50 rounded-lg border border-borderGreen"></div>
      </div>

      {/* Filter Section */}
      <div className="flex items-center gap-2 mb-4">
        <div className="h-4 w-4 bg-darkGray rounded"></div>
        <div className="h-4 w-16 bg-darkGray rounded"></div>
        <div className="h-8 w-20 bg-darkBlue rounded-lg border border-borderGreen"></div>
        <div className="h-8 w-20 bg-darkBlue rounded-lg border border-borderGreen"></div>
      </div>

      {/* Table */}
      <div className="flex-grow overflow-hidden rounded-lg border border-borderGreen bg-darkGray/50">
        <div className="bg-darkBlue border-b border-borderGreen p-4">
          <div className="flex justify-between">
            <div className="h-4 w-16 bg-darkGray rounded"></div>
            <div className="h-4 w-20 bg-darkGray rounded"></div>
            <div className="h-4 w-16 bg-darkGray rounded"></div>
            <div className="h-4 w-16 bg-darkGray rounded"></div>
          </div>
        </div>
        <div className="divide-y divide-borderGreen">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="p-4 flex justify-between items-center">
              <div className="h-4 w-24 bg-darkGreen rounded"></div>
              <div className="h-4 w-20 bg-darkGreen rounded"></div>
              <div className="h-6 w-12 bg-darkGreen rounded-full"></div>
              <div className="h-8 w-8 bg-darkGreen rounded-lg"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const YearlySalesSkeleton = () => {
  return (
    <div className='flex flex-col w-full lg:w-[50%] animate-pulse'>
      <div className='rounded-xl border border-borderGreen bg-darkGreen p-4 shadow-lg'>
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="h-8 w-8 rounded-lg bg-darkBlue border border-borderGreen"></div>
          <div>
            <div className="h-5 w-28 bg-darkGray rounded-md mb-1"></div>
            <div className="h-4 w-36 bg-darkGray rounded-md"></div>
          </div>
        </div>
        
        {/* Chart Area */}
        <div className="h-[400px] lg:h-[450px] rounded-lg bg-darkGray/50 p-4 border border-borderGreen">
          <div className="h-full w-full bg-darkBlue/50 rounded"></div>
        </div>
      </div>
      
      {/* Controls */}
      <div className="flex items-center justify-center gap-3 pt-4">
        <div className="h-10 w-28 bg-darkBlue rounded-lg border border-borderGreen"></div>
        <div className="h-10 w-20 bg-darkGray rounded-lg border border-borderGreen"></div>
        <div className="h-10 w-24 bg-darkBlue rounded-lg border border-borderGreen"></div>
      </div>
    </div>
  );
};

export const TableContainerSkeleton = () => {
  return (
    <div className='flex items-center justify-center min-h-full bg-darkGray p-4'>
      <div className='bg-darkGreen rounded-xl shadow-lg border border-borderGreen w-full p-6 min-h-[80vh] animate-pulse'>
        {/* Header */}
        <div className='flex items-center gap-3 mb-6'>
          <div className='h-6 w-6 bg-darkBlue rounded'></div>
          <div className='h-6 w-32 bg-darkGray rounded'></div>
        </div>
        
        {/* Search and Filters */}
        <div className='flex flex-col py-2 md:flex-row gap-3 mb-4'>
          <div className='flex w-full md:w-80'>
            <div className='w-full h-10 bg-darkBlue rounded-l-lg border border-borderGreen'></div>
            <div className='w-10 h-10 bg-darkBlue rounded-r-lg border border-borderGreen'></div>
          </div>
          <div className='w-full h-10 bg-darkBlue rounded-lg border border-borderGreen'></div>
        </div>
        
        {/* Table */}
        <div className='overflow-hidden rounded-xl border border-borderGreen bg-darkGreen'>
          {/* Table Header */}
          <div className='bg-darkBlue border-b border-borderGreen p-4'>
            <div className='flex justify-between'>
              {Array(4).fill(0).map((_, index) => (
                <div key={index} className='h-4 w-20 bg-darkGray rounded'></div>
              ))}
            </div>
          </div>
          {/* Table Rows */}
          <div className='divide-y divide-borderGreen'>
            {Array(12).fill(0).map((_, rowIndex) => (
              <div key={rowIndex} className='bg-darkGreen/70 p-4'>
                <div className='flex justify-between items-center'>
                  {Array(4).fill(0).map((_, cellIndex) => (
                    <div key={cellIndex} className='h-4 w-16 bg-darkBlue/50 rounded'></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Pagination */}
        <div className='flex items-center justify-between mt-6'>
          <div className='flex gap-2'>
            {Array(4).fill(0).map((_, index) => (
              <div key={index} className='h-8 w-8 bg-darkBlue rounded border border-borderGreen'></div>
            ))}
          </div>
          <div className='flex items-center gap-2'>
            <div className='w-16 h-8 bg-darkBlue rounded border border-borderGreen'></div>
            <div className='w-20 h-8 bg-darkBlue rounded border border-borderGreen'></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const ClientDetailedSkeleton = () => {
  return (
    <div className='mt-4 px-5 animate-pulse bg-darkGray'>
      <div className='flex mb-4 justify-between'>
        <div className='bg-darkGreen text-white py-2 px-4 rounded-lg border border-borderGreen inline-flex items-center'>
          <div className='h-4 w-4 bg-darkBlue rounded-full mr-2'></div>
          <div className='h-4 w-24 bg-darkBlue rounded'></div>
        </div>
        <div className='bg-darkBlue text-white py-2 px-4 rounded-lg border border-borderGreen inline-flex items-center mr-2'>
          <div className='h-4 w-4 bg-darkGray rounded-full mr-2'></div>
          <div className='h-4 w-24 bg-darkGray rounded'></div>
        </div>
      </div>
      <div className='flex flex-wrap -mx-2'>
        {/* InlineEditClient Skeleton */}
        <div className='w-full md:w-1/2 px-2 mb-4'>
          <div className='border border-borderGreen rounded-xl shadow bg-darkGreen'>
            <div className='px-4 py-3 border-b border-borderGreen bg-darkBlue'>
              <div className='h-5 w-32 bg-darkGray rounded'></div>
            </div>
            <div className='p-4 space-y-3'>
              {Array(4).fill(0).map((_, idx) => (
                <div key={idx} className='flex items-center'>
                  <div className='w-24 h-4 bg-darkBlue rounded mr-2'></div>
                  <div className='flex-1 h-4 bg-darkBlue rounded'></div>
                </div>
              ))}
              <div className='flex justify-end mt-4 space-x-2'>
                <div className='px-4 py-2 bg-darkBlue rounded-lg w-20 h-8 border border-borderGreen'></div>
                <div className='px-4 py-2 bg-darkBlue rounded-lg w-20 h-8 border border-borderGreen'></div>
              </div>
            </div>
          </div>
        </div>
        {/* TransactionHistory Skeleton */}
        <div className='w-full md:w-1/2 px-2 mb-2 lg:mb-0'>
          <div className='border border-borderGreen rounded-xl shadow bg-darkGreen'>
            <div className='px-4 py-3 border-b border-borderGreen bg-darkBlue'>
              <div className='h-5 w-36 bg-darkGray rounded'></div>
            </div>
            <div className='p-4 space-y-3'>
              {Array(4).fill(0).map((_, idx) => (
                <div key={idx} className='border border-borderGreen rounded-lg p-3 bg-darkBlue/50'>
                  <div className='h-4 w-full bg-darkGray rounded'></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const InvoiceDetailedSkeleton = () => {
  return (
    <div className='mt-4 px-5 animate-pulse bg-darkGray'>
      <div className='flex mb-4 justify-between'>
        <div className='bg-darkGreen text-white py-2 px-4 rounded-lg border border-borderGreen inline-flex items-center'>
          <div className='h-4 w-4 bg-darkBlue rounded-full mr-2'></div>
          <div className='h-4 w-24 bg-darkBlue rounded'></div>
        </div>
        <div className='flex space-x-2'>
          <div className='bg-darkBlue text-white py-2 px-4 rounded-lg border border-borderGreen inline-flex items-center'>
            <div className='h-4 w-4 bg-darkGray rounded-full mr-2'></div>
            <div className='h-4 w-16 bg-darkGray rounded'></div>
          </div>
          <div className='bg-darkBlue text-white py-2 px-4 rounded-lg border border-borderGreen inline-flex items-center'>
            <div className='h-4 w-4 bg-darkGray rounded-full mr-2'></div>
            <div className='h-4 w-16 bg-darkGray rounded'></div>
          </div>
        </div>
      </div>
      <div className='flex flex-wrap lg:flex-nowrap text-sm lg:text-[1rem] -mx-2'>
        {/* Invoice Details Skeleton */}
        <div className='w-full lg:w-[60%] mb-4 px-2'>
          <div className='border border-borderGreen rounded-xl shadow bg-darkGreen'>
            <div className='px-4 py-3 border-b border-borderGreen bg-darkBlue'>
              <div className='h-5 w-32 bg-darkGray rounded'></div>
            </div>
            <div className='p-4 space-y-3'>
              {Array(5)
                .fill(0)
                .map((_, idx) => (
                  <div key={idx} className='flex justify-between items-center py-2 border-b border-borderGreen'>
                    <div className='w-1/2 h-4 bg-darkBlue rounded'></div>
                    <div className='w-1/4 h-4 bg-darkBlue rounded'></div>
                  </div>
                ))}
              <div className='flex justify-end mt-4'>
                <div className='w-32 h-8 bg-darkBlue rounded-lg border border-borderGreen'></div>
              </div>
            </div>
          </div>
        </div>
        {/* Client Details Skeleton */}
        <div className='w-full lg:w-[40%] mb-4 px-2'>
          <div className='border border-borderGreen rounded-xl shadow bg-darkGreen'>
            <div className='px-4 py-3 border-b border-borderGreen bg-darkBlue'>
              <div className='h-5 w-28 bg-darkGray rounded'></div>
            </div>
            <div className='p-4 space-y-3'>
              {Array(3)
                .fill(0)
                .map((_, idx) => (
                  <div key={idx} className='flex items-center'>
                    <div className='w-24 h-4 bg-darkBlue rounded mr-2'></div>
                    <div className='flex-1 h-4 bg-darkBlue rounded'></div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
      {/* Price Breakdown Skeleton */}
      <div className='w-full lg:w-[60%] mb-4 px-2'>
        <div className='border border-borderGreen rounded-xl shadow bg-darkGreen'>
          <div className='px-4 py-3 border-b border-borderGreen bg-darkBlue'>
            <div className='h-5 w-32 bg-darkGray rounded'></div>
          </div>
          <div className='p-4 space-y-3'>
            {Array(3)
              .fill(0)
              .map((_, idx) => (
                <div key={idx} className='flex justify-between items-center py-2 border-b border-borderGreen'>
                  <div className='w-1/2 h-4 bg-darkBlue rounded'></div>
                  <div className='w-1/4 h-4 bg-darkBlue rounded'></div>
                </div>
              ))}
            <div className='flex justify-end mt-4'>
              <div className='w-32 h-8 bg-darkBlue rounded-lg border border-borderGreen'></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};