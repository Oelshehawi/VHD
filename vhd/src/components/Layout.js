import * as React from "react";
import TopNavBar from "../components/TopNavBar";
import SideNavBar from "../components/SideNavBar";

const Layout = ({ children }) => {
  return (
    <div id="Wrapper">
      <div className="layout">
        <TopNavBar />
        <SideNavBar />
        <main>{children}</main>
      </div>
    </div>
  );
};

export default Layout;
