'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import YearlySales from '../dashboard/YearlySales';
import { YearlySalesSkeleton } from '../Skeletons';
import { fetchYearlySalesData } from '../../app/lib/dashboard.data';

interface YearlySalesContainerProps {
  initialYear?: number;
}

export default function YearlySalesContainer({
  initialYear,
}: YearlySalesContainerProps) {
  const [selectedYear, setSelectedYear] = useState(
    initialYear || new Date().getFullYear()
  );

  const { data: salesData, isLoading, error } = useQuery({
    queryKey: ['yearlySalesData', selectedYear],
    queryFn: async () => {
      return await fetchYearlySalesData(selectedYear);
    },
  });

  const handleYearChange = (newYear: number) => {
    setSelectedYear(newYear);
  };

  if (error) {
    return (
      <div className="flex h-96 items-center justify-center rounded-xl border border-red-200 bg-red-50 p-6">
        <div className="text-center">
          <p className="text-red-600 font-medium">Failed to load sales data</p>
          <p className="text-red-500 text-sm mt-1">Please try again</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full rounded-xl border border-gray-200 bg-white p-6 shadow-lg">
      {isLoading ? (
        <YearlySalesSkeleton />
      ) : (
        <YearlySales
          salesData={salesData || []}
          currentYear={selectedYear}
          onYearChange={handleYearChange}
          isLoading={isLoading}
        />
      )}
    </div>
  );
}
