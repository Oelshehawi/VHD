"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import YearlySales from "../dashboard/YearlySales";
import { YearlySalesSkeleton } from "../Skeletons";
import { fetchYearlySalesData } from "../../app/lib/dashboard.data";
import { Card, CardContent } from "../ui/card";
import { AlertTriangle } from "lucide-react";

interface YearlySalesContainerProps {
  initialYear?: number;
}

export default function YearlySalesContainer({
  initialYear,
}: YearlySalesContainerProps) {
  const [selectedYear, setSelectedYear] = useState(
    initialYear || new Date().getFullYear(),
  );

  const {
    data: salesData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["yearlySalesData", selectedYear],
    queryFn: async () => {
      return await fetchYearlySalesData(selectedYear);
    },
  });

  const handleYearChange = (newYear: number) => {
    setSelectedYear(newYear);
  };

  if (error) {
    return (
      <Card className="border-destructive/20 bg-destructive/5 h-96">
        <CardContent className="flex h-full items-center justify-center p-6">
          <div className="text-center">
            <AlertTriangle className="text-destructive mx-auto mb-2 h-8 w-8" />
            <p className="text-destructive font-medium">
              Failed to load sales data
            </p>
            <p className="text-destructive/70 mt-1 text-sm">Please try again</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardContent className="h-full p-6">
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
      </CardContent>
    </Card>
  );
}
