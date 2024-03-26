'use client'
import '../global.css'
import SideNavBar from '../../components/SideNavBar';

const Layout = ({ children }) => {
  return (
      <div className="flex max-h-[100vh] flex-col lg:!flex-row">
        <SideNavBar />
        <main>{children}</main>
      </div>
  );
};

export default Layout;
