import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  HomeIcon,
  CalendarIcon,
  CircleStackIcon,
  DocumentIcon,
  PowerIcon
} from '@heroicons/react/24/solid';
import { signOut } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';

const SideNavBar = () => {
  const isActive = (href) => {
    const pathname = usePathname();
    return (
      pathname === href ||
      pathname.startsWith(`${href}/clientDetailed`) ||
      pathname.startsWith(`${href}/invoiceDetailed`)
    );
  };

  return (
    <div className='flex flex-row items-center md:items-stretch md:!flex-col md:w-[15%] bg-darkGreen md:border-r-4 border-borderGreen text-xl text-white justify-between'>
      <div className='flex-1 flex justify-center md:!justify-start md:flex-col'>
        <div className='hidden p-3 bg-gray-700 text-center md:block'>
          <div>VHD Admin CRM</div>
        </div>
        <div className='flex flex-row md:!flex-col md:mt-3 text-center md:space-y-5 mx-3'>
          {[
            { href: '/dashboard', icon: HomeIcon, label: 'Dashboard' },
            { href: '/database', icon: CircleStackIcon, label: 'Clients' },
            { href: '/invoices', icon: DocumentIcon, label: 'Invoices' },
            { href: '/schedule', icon: CalendarIcon, label: 'Schedule' },
          ].map(({ href, icon: Icon, label }) => (
            <AnimatePresence key={href}>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  href={href}
                  className={`flex items-center justify-center p-2 mx-2 text-xl rounded-lg font-bold ${
                    isActive(href)
                      ? 'bg-gray-200 text-black'
                      : 'hover:bg-gray-200 hover:text-black'
                  }`}
                >
                  <div className='flex items-center basis-full'>
                    <Icon className='h-6 w-6 md:mr-2' />
                    <span className='hidden md:block '>{label}</span>
                  </div>
                </Link>
              </motion.div>
            </AnimatePresence>
          ))}
        </div>
      </div>
      <div
        className='p-3 bg-red-600 text-center font-bold hover:cursor-pointer hover:bg-red-700 hover:text-black'
        onClick={signOut}
      >
        <PowerIcon className='h-6 block w-6 md:hidden' />
        <span className='hidden md:block'>Sign Out</span>
      </div>
    </div>
  );
};

export default SideNavBar;
