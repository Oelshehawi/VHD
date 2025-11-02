"use client";

import { FaDollarSign, FaClock, FaCheckCircle, FaExclamationTriangle, FaUsers, FaFileInvoice } from "react-icons/fa";
import { AnalyticsMetrics as AnalyticsMetricsType } from "../../app/lib/dashboard.data";

interface MetricCard {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: "blue" | "green" | "yellow" | "red" | "purple";
}

interface AnalyticsMetricsProps {
  metrics: AnalyticsMetricsType;
}

const colorClasses = {
  blue: "bg-blue-50 border-blue-200",
  green: "bg-green-50 border-green-200",
  yellow: "bg-yellow-50 border-yellow-200",
  red: "bg-red-50 border-red-200",
  purple: "bg-purple-50 border-purple-200",
};

const iconColorClasses = {
  blue: "from-blue-500 to-blue-600",
  green: "from-green-500 to-green-600",
  yellow: "from-yellow-500 to-yellow-600",
  red: "from-red-500 to-red-600",
  purple: "from-purple-500 to-purple-600",
};

const badgeColorClasses = {
  blue: "text-blue-800",
  green: "text-green-800",
  yellow: "text-yellow-800",
  red: "text-red-800",
  purple: "text-purple-800",
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export default function AnalyticsMetrics({ metrics }: AnalyticsMetricsProps) {

  const cards: MetricCard[] = [
    {
      label: "Total Revenue",
      value: formatCurrency(metrics.totalRevenue),
      icon: <FaDollarSign className="h-6 w-6" />,
      color: "green",
    },
    {
      label: "Pending Invoices",
      value: metrics.pendingCount,
      icon: <FaClock className="h-6 w-6" />,
      color: "yellow",
    },
    {
      label: "Overdue Invoices",
      value: metrics.overdueCount,
      icon: <FaExclamationTriangle className="h-6 w-6" />,
      color: "red",
    },
    {
      label: "Paid Invoices",
      value: metrics.paidCount,
      icon: <FaCheckCircle className="h-6 w-6" />,
      color: "green",
    },
    {
      label: "Active Clients",
      value: metrics.activeClientCount,
      icon: <FaUsers className="h-6 w-6" />,
      color: "blue",
    },
    {
      label: "Jobs Due (Next 30 Days)",
      value: metrics.jobsDueSoon,
      icon: <FaFileInvoice className="h-6 w-6" />,
      color: "purple",
    },
  ];

  return (
    <div className="flex flex-col gap-4 h-full">
      {cards.map((card, index) => (
        <div
          key={index}
          className={`flex-1 rounded-xl border shadow-md p-4 ${colorClasses[card.color]}`}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-600 mb-1">
                {card.label}
              </p>
              <p className={`text-2xl font-bold ${badgeColorClasses[card.color]} truncate`}>
                {card.value}
              </p>
            </div>
            <div
              className={`bg-gradient-to-r ${iconColorClasses[card.color]} p-2.5 rounded-lg shadow-md flex-shrink-0`}
            >
              <div className="text-white text-lg">{card.icon}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
