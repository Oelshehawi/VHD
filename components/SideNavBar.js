import { useState } from 'react';
import sideNav from './styles/sideNav.module.css';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FaHome } from 'react-icons/fa';
import { FaRegCalendarAlt } from 'react-icons/fa';
import { FaDatabase } from 'react-icons/fa';

const SideNavBar = () => {

  const isActive = (href) => {
    const pathname = usePathname();
    return pathname === href;
  };

  return (
    <aside id={sideNav.sidebar}>
      <div className={sideNav.user}> Hi There, Admin</div>
      <div className={sideNav.links}>
        <Link
          href="/dashboard"
          className={
            isActive('/dashboard') ? sideNav.sidebarLinkActive : sideNav.theLink
          }
        >
          <FaHome className={sideNav.icon} />
          {'Dashboard'}
        </Link>
        <Link
          href="/database"
          className={
            isActive('/database') ? sideNav.sidebarLinkActive : sideNav.theLink
          }
        >
          <FaDatabase className={sideNav.icon} />
          {'Database '}
        </Link>
        <Link
          href="/schedule"
          className={
            isActive('/schedule') ? sideNav.sidebarLinkActive : sideNav.theLink
          }
        >
          <FaRegCalendarAlt className={sideNav.icon} />
          {'Schedule'}
        </Link>
      </div>
    </aside>
  );
};

export default SideNavBar;
