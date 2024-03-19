'use client'
import '../global.css'
import SideNavBar from '../../components/SideNavBar';

const Layout = ({ children }) => {
  return (
      <div className="flex min-h-[100vh] flex-col md:!flex-row">
        <SideNavBar />
        <main>{children}</main>
      </div>
  );
};

export default Layout;
