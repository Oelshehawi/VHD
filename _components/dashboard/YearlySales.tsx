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
  }[];
}

interface ChartOptions {
  plugins: {
    legend: {
      position: 'top';
    };
    title: {
      display: boolean;
      text: string;
    };
  };
  maintainAspectRatio: boolean;
  responsive: boolean;
}

const YearlySales = ({ salesData, currentYear }: YearlySalesProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [chartOptions, setChartOptions] = useState<ChartOptions>({
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: `Monthly Sales Overview - ${currentYear} vs ${currentYear - 1}`,
      },
    },
    maintainAspectRatio: false,
    responsive: true,
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
          backgroundColor: '#0a003e',
          borderColor: '#467061',
        },
        {
          label: `${currentYear - 1}`,
          data: dataPreviousYear,
          backgroundColor: '#003e29',
          borderColor: '#467061',
        },
      ],
    });

    setChartOptions((prev) => ({
      ...prev,
      plugins: {
        ...prev.plugins,
        title: {
          display: true,
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
    <div className='flex flex-col w-full lg:w-[50%]'>
      <div className='w-full relative lg:min-h-[70vh] h-[50vh] p-4 border rounded-lg bg-white shadow-lg transition-all hover:shadow-xl'>
        <Bar data={chartData} options={chartOptions} />
      </div>
      <div className='flex justify-center items-center gap-2 md:gap-4 py-4'>
        <button
          className='hover:bg-darkBlue bg-darkGreen text-white font-bold py-1 md:py-2 px-2 md:px-4 rounded text-sm md:text-base'
          onClick={() => handleYearChange('previous')}
        >
          Previous Year
        </button>
        <span className="font-bold text-sm md:text-base">{currentYear}</span>
        <button
          className='hover:bg-darkBlue bg-darkGreen text-white font-bold py-1 md:py-2 px-2 md:px-4 rounded text-sm md:text-base disabled:opacity-50'
          onClick={() => handleYearChange('next')}
          disabled={currentYear === new Date().getFullYear()}
        >
          Next Year
        </button>
      </div>
    </div>
  );
};

export default YearlySales;
