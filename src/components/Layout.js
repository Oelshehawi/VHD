import * as React from "react";
import TopNavBar from "../components/TopNavBar";
import SideNavBar from "../components/SideNavBar";
import "../style/layout.css";

const Layout = ({ children }) => {
  return (
    <div id="Wrapper">
      <TopNavBar  />
      <div className="layout">
        <main >{children}</main>
        <SideNavBar />
      </div>
    </div>
  );
};

export default Layout;
