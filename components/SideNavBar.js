import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  HomeIcon,
  CalendarIcon,
  CircleStackIcon,
  DocumentIcon,
  PowerIcon,

} from '@heroicons/react/24/solid';
import { signOut } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';

const SideNavBar = () => {
  const isActive = (href) => {
    const pathname = usePathname();
    return (
      pathname === href ||
      pathname.startsWith(`${href}`) ||
      pathname.startsWith(`${href}`)
    );
  };

  return (
    <div className='flex flex-row md:h-screen items-center md:items-stretch md:!flex-col md:min-w-[5
    %] bg-darkGreen md:border-r-4 border-borderGreen text-xl text-white justify-between'>
      <div className='flex-1 flex justify-center md:!justify-start md:flex-col'>
        <div className='flex flex-row md:!flex-col md:mt-3 text-center md:space-y-5 mx-3'>
          {[
            { href: '/dashboard', icon: HomeIcon },
            { href: '/database', icon: CircleStackIcon },
            { href: '/invoices', icon: DocumentIcon },
            { href: '/schedule', icon: CalendarIcon },
          ].map(({ href, icon: Icon }) => (
            <AnimatePresence key={href}>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  href={href}
                  className={`flex items-center bg-gray-200 text-black justify-center p-2 mx-2 text-xl rounded-lg font-bold ${
                    isActive(href)
                      ? '!bg-darkBlue !text-white'
                      : 'hover:bg-darkBlue hover:!text-white'
                  }`}
                >
                  <div className='flex items-center basis-full'>
                    <Icon className='h-6 w-6' />
                  </div>
                </Link>
              </motion.div>
            </AnimatePresence>
          ))}
        </div>
      </div>
      <div
        className='flex justify-center p-3 bg-red-600 text-center font-bold hover:cursor-pointer hover:bg-red-700 hover:text-black'
        onClick={signOut}
      >
        <PowerIcon className='h-6 w-6' />
      </div>
    </div>
  );
};

export default SideNavBar;
