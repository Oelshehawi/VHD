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
