import './global.css';
import { Inter } from 'next/font/google';
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Analytics } from '@vercel/analytics/react';
import {Toaster} from 'react-hot-toast'

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'VHD',
  description: '',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className} >
      <Toaster position="top-center" />
        {children}
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
