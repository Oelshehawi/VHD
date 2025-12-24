"use client";

import { useMemo, useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { YearlySalesData } from "../../app/lib/typeDefinitions";
import { BarChart3, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "../ui/button";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "../ui/chart";

interface YearlySalesProps {
  salesData: YearlySalesData[];
  currentYear: number;
  onYearChange?: (newYear: number) => void;
  isLoading?: boolean;
}

const YearlySales = ({
  salesData,
  currentYear,
  onYearChange,
}: YearlySalesProps) => {
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Dynamic chart config with actual year labels
  const chartConfig = useMemo(
    () =>
      ({
        currentYear: {
          label: `${currentYear}`,
          color: "var(--chart-1)",
        },
        previousYear: {
          label: `${currentYear - 1}`,
          color: "var(--chart-2)",
        },
      }) satisfies ChartConfig,
    [currentYear],
  );

  // Transform data for Recharts format
  const chartData = useMemo(() => {
    return salesData.map((item) => ({
      month: item.date.split(" ")[0],
      currentYear: item["Current Year"],
      previousYear: item["Previous Year"],
    }));
  }, [salesData]);

  const handleYearChange = (direction: "next" | "previous") => {
    const newYear = direction === "next" ? currentYear + 1 : currentYear - 1;

    if (newYear > new Date().getFullYear()) return;

    if (onYearChange) {
      onYearChange(newYear);
    }
  };

  const tooltipContent = (
    <ChartTooltipContent
      formatter={(value, name) => {
        const yearLabel =
          name === "currentYear" ? currentYear : currentYear - 1;
        return (
          <span className="font-medium">
            {yearLabel}: ${Number(value).toLocaleString()}
          </span>
        );
      }}
    />
  );

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="mb-4 flex items-center gap-3">
        <div className="bg-primary flex h-10 w-10 items-center justify-center rounded-lg shadow-sm">
          <BarChart3 className="text-primary-foreground h-5 w-5" />
        </div>
        <div>
          <h3 className="text-foreground text-lg font-bold">Sales Analytics</h3>
          <p className="text-muted-foreground text-sm">
            Monthly performance comparison
          </p>
        </div>
      </div>

      {/* Chart - Takes remaining space */}
      <div className="min-h-0 flex-1">
        <ChartContainer config={chartConfig} className="h-full w-full">
          {isMobile ? (
            // Line chart for mobile - better for narrow screens
            <LineChart data={chartData} accessibilityLayer>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="month"
                tickLine={false}
                tickMargin={8}
                axisLine={false}
                fontSize={10}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                fontSize={10}
                width={40}
              />
              <ChartTooltip content={tooltipContent} />
              <ChartLegend content={<ChartLegendContent />} />
              <Line
                type="monotone"
                dataKey="currentYear"
                stroke="var(--color-currentYear)"
                strokeWidth={2}
                dot={{ fill: "var(--color-currentYear)", r: 3 }}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="previousYear"
                stroke="var(--color-previousYear)"
                strokeWidth={2}
                dot={{ fill: "var(--color-previousYear)", r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          ) : (
            // Bar chart for desktop
            <BarChart data={chartData} accessibilityLayer>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="month"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                fontSize={12}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                fontSize={12}
                width={50}
              />
              <ChartTooltip content={tooltipContent} />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar
                dataKey="currentYear"
                fill="var(--color-currentYear)"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="previousYear"
                fill="var(--color-previousYear)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          )}
        </ChartContainer>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4 pt-4">
        <Button
          variant="default"
          size="sm"
          onClick={() => handleYearChange("previous")}
          className="gap-2"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Previous Year</span>
          <span className="sm:hidden">Prev</span>
        </Button>

        <div className="bg-muted flex items-center gap-2 rounded-lg border px-4 py-2">
          <Calendar className="text-muted-foreground h-4 w-4" />
          <span className="text-foreground font-bold">{currentYear}</span>
        </div>

        <Button
          variant="default"
          size="sm"
          onClick={() => handleYearChange("next")}
          disabled={currentYear === new Date().getFullYear()}
          className="gap-2"
        >
          <span className="hidden sm:inline">Next Year</span>
          <span className="sm:hidden">Next</span>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default YearlySales;
