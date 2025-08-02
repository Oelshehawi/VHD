'use client';
import { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  CategoryScale,
} from 'chart.js';
import { YearlySalesData } from '../../app/lib/typeDefinitions';
import { useRouter, useSearchParams } from 'next/navigation';
import { FaChartBar, FaCalendarAlt, FaArrowLeft, FaArrowRight } from 'react-icons/fa';

ChartJS.register(
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  CategoryScale
);

interface YearlySalesProps {
  salesData: YearlySalesData[];
  currentYear: number;
}

interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor: string;
    borderColor: string;
    borderWidth: number;
    borderRadius: number;
  }[];
}

interface ChartOptions {
  plugins: {
    legend: {
      position: 'top';
      labels: {
        usePointStyle: boolean;
        padding: number;
        color: string;
        font: {
          size: number;
        };
      };
    };
    title: {
      display: boolean;
      text: string;
      color: string;
              font: {
          size: number;
          weight: 'normal' | 'bold' | 'lighter' | 'bolder';
        };
    };
  };
  maintainAspectRatio: boolean;
  responsive: boolean;
  scales: {
    x: {
      grid: {
        color: string;
      };
      ticks: {
        color: string;
        font: {
          size: number;
        };
      };
    };
    y: {
      grid: {
        color: string;
      };
      ticks: {
        color: string;
        font: {
          size: number;
        };
      };
    };
  };
}

const YearlySales = ({ salesData, currentYear }: YearlySalesProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [chartOptions, setChartOptions] = useState<ChartOptions>({
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 20,
          color: '#374151',
          font: {
            size: 12,
          },
        },
      },
      title: {
        display: true,
        text: `Monthly Sales Overview - ${currentYear} vs ${currentYear - 1}`,
        color: '#374151',
        font: {
          size: 16,
          weight: 'bold',
        },
      },
    },
    maintainAspectRatio: false,
    responsive: true,
    scales: {
      x: {
        grid: {
          color: '#e5e7eb',
        },
        ticks: {
          color: '#6b7280',
          font: {
            size: 11,
          },
        },
      },
      y: {
        grid: {
          color: '#e5e7eb',
        },
        ticks: {
          color: '#6b7280',
          font: {
            size: 11,
          },
        },
      },
    },
  });
  const [chartData, setChartData] = useState<ChartData>({
    labels: [],
    datasets: [],
  });

  useEffect(() => {
    const dataCurrentYear = salesData.map((item) => item['Current Year']);
    const dataPreviousYear = salesData.map((item) => item['Previous Year']);
    const labels = salesData.map((item) => item.date.split(' ')[0]);

    setChartData({
      labels: labels.filter(Boolean) as string[],
      datasets: [
        {
          label: `${currentYear}`,
          data: dataCurrentYear,
          backgroundColor: '#10b981',
          borderColor: '#059669',
          borderWidth: 2,
          borderRadius: 6,
        },
        {
          label: `${currentYear - 1}`,
          data: dataPreviousYear,
          backgroundColor: '#3b82f6',
          borderColor: '#2563eb',
          borderWidth: 2,
          borderRadius: 6,
        },
      ],
    });

    setChartOptions((prev) => ({
      ...prev,
      plugins: {
        ...prev.plugins,
        title: {
          ...prev.plugins.title,
          text: `Monthly Sales Overview - ${currentYear} vs ${currentYear - 1}`,
        },
      },
    }));
  }, [salesData, currentYear]);

  const handleYearChange = (direction: 'next' | 'previous') => {
    const params = new URLSearchParams(searchParams?.toString());
    const newYear = direction === 'next' ? currentYear + 1 : currentYear - 1;
    
    if (newYear > new Date().getFullYear()) return; // Don't allow future years
    
    params.set('salesYear', newYear.toString());
    router.push(`/dashboard?${params.toString()}`);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chart Container */}
      <div className="flex-1 rounded-xl border border-gray-200 bg-white p-3 sm:p-6 shadow-lg transition-all hover:shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-6">
          <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-gradient-to-r from-darkGreen to-green-600 shadow-lg">
            <FaChartBar className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 sm:text-xl">Sales Analytics</h3>
            <p className="text-xs text-gray-600 sm:text-sm">Monthly performance comparison</p>
          </div>
        </div>
        
        {/* Chart - Takes remaining space */}
        <div className="flex-1 rounded-xl bg-gray-50 p-2 sm:p-4 border border-gray-200 min-h-0">
          <Bar data={chartData} options={chartOptions} />
        </div>
      </div>
      
      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pt-4 sm:pt-6">
        <button
          className="flex items-center gap-2 sm:gap-3 rounded-xl bg-gradient-to-r from-darkBlue to-blue-600 px-3 py-2 sm:px-4 sm:py-2.5 text-white font-medium shadow-lg transition-all hover:shadow-xl hover:scale-105 text-sm sm:text-base"
          onClick={() => handleYearChange('previous')}
        >
          <FaArrowLeft className="h-3 w-3" />
          <span className="hidden sm:inline">Previous Year</span>
          <span className="sm:hidden">Prev</span>
        </button>
        
        <div className="flex items-center gap-2 sm:gap-3 rounded-xl bg-white px-3 py-2 sm:px-4 sm:py-2.5 border border-gray-200 shadow-lg">
          <FaCalendarAlt className="h-3 w-3 sm:h-4 sm:w-4 text-gray-600" />
          <span className="font-bold text-gray-900 text-sm sm:text-base">{currentYear}</span>
        </div>
        
        <button
          className="flex items-center gap-2 sm:gap-3 rounded-xl bg-gradient-to-r from-darkBlue to-blue-600 px-3 py-2 sm:px-4 sm:py-2.5 text-white font-medium shadow-lg transition-all hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 text-sm sm:text-base"
          onClick={() => handleYearChange('next')}
          disabled={currentYear === new Date().getFullYear()}
        >
          <span className="hidden sm:inline">Next Year</span>
          <span className="sm:hidden">Next</span>
          <FaArrowRight className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
};

export default YearlySales;
