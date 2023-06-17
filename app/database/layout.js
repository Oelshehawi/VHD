'use client';
import SideNavBar from '../../components/SideNavBar';

const Layout = ({ children }) => {
  return (
    <div id="Wrapper">
      <div className="layout">
        <SideNavBar />
        <main>{children}</main>
      </div>
    </div>
  );
};

export default Layout;
