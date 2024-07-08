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

ChartJS.register(
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  CategoryScale
);

const YearlySales = ({ salesData }) => {
  const [showComparison, setShowComparison] = useState(false);
  const [chartOptions, setChartOptions] = useState({});
  const [chartData, setChartData] = useState({
    datasets: [],
  });

  useEffect(() => {
    const dataThisYear = salesData.map((item) => item['This Year']);
    const dataLastYear = salesData.map((item) => item['Last Year']);
    const labels = salesData.map((item) => item.date.split(' ')[0]);

    setChartData({
      labels: labels,
      datasets: [
        {
          label: 'This Year',
          data: showComparison ? dataThisYear : [],
          backgroundColor: '#0a003e',
          borderColor: '#467061',
        },
        {
          label: 'Last Year',
          data: showComparison ? [] : dataLastYear,
          backgroundColor: '#003e29',
          borderColor: '#467061',
        },
      ],
    });

    setChartOptions({
      plugins: {
        legend: {
          position: 'top',
        },
        title: {
          display: true,
          text: 'Yearly Sales Comparison',
        },
      },
      maintainAspectRatio: false,
      responsive: true,
    });
  }, [showComparison, salesData]);

  return (
    <div className='flex flex-col lg:w-3/4 w-full '>
      <div className='w-full relative lg:min-h-[70vh] h-[50vh] p-4 border rounded-lg bg-white'>
        <Bar data={chartData} options={chartOptions} />
      </div>
      <div className='flex justify-center items-center py-4'>
        <button
          className='hover:bg-darkBlue bg-darkGreen text-white font-bold py-2 px-4 rounded'
          onClick={() => setShowComparison(!showComparison)}
        >
          Toggle Year
        </button>
      </div>
    </div>
  );
};

export default YearlySales;
