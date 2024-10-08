import React from 'react';

const shimmer =
  'relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/60 before:to-transparent';

const TransactionsLoading = () => {
  return (
    <div className="flex h-full flex-col gap-4 p-6">
      {/* Account Selector Skeleton */}
      <div className={`${shimmer} w-full h-10 bg-gray-200 rounded-md`}></div>

      {/* Transactions Header Skeleton */}
      <div className={`${shimmer} w-full h-24 bg-gray-200 rounded-md`}></div>

      {/* Transactions Table Skeleton */}
      <div className="flex flex-col items-center justify-center gap-4">
        <div className="min-h-[80%] min-w-[100%] max-w-[50%] overflow-auto rounded">
          <table className="w-full text-left">
            <thead className="bg-gray-200">
              <tr>
                {['Transaction', 'Amount', 'Status', 'Date', 'Channel', 'Category'].map(
                  (heading) => (
                    <th key={heading} className="px-4 py-3 capitalize">
                      <div className={`${shimmer} h-4 bg-gray-300 rounded-md`}></div>
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody className="font-bold">
              {Array.from({ length: 10 }).map((_, index) => (
                <tr key={index} className="bg-gray-100">
                  {Array.from({ length: 6 }).map((_, idx) => (
                    <td key={idx} className="p-4">
                      <div className={`${shimmer} h-6 bg-gray-200 rounded-md`}></div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Skeleton */}
        <div className="flex items-center justify-between mt-2 w-full">
          <div className="flex gap-2">
            {Array(4)
              .fill(0)
              .map((_, index) => (
                <div
                  key={index}
                  className={`${shimmer} p-1 w-8 h-8 bg-gray-200 rounded`}
                ></div>
              ))}
          </div>
          <div className="flex items-center gap-2">
            <div className={`${shimmer} w-16 h-8 bg-gray-200 rounded`}></div>
            <div className={`${shimmer} w-20 h-8 bg-gray-200 rounded`}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionsLoading;
