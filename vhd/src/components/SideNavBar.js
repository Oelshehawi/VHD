import React from "react";
import "../style/sidebar.css";
import { Link } from "gatsby";
import { FaRegUserCircle } from "react-icons/fa";
import { FaHome } from "react-icons/fa";
import { FaRegCalendarAlt } from "react-icons/fa";
import { FaDatabase } from "react-icons/fa";
import { FaAngleDown } from "react-icons/fa";

const SideNavBar = () => {
  return (
    <aside id="sidebar">
      <FaRegUserCircle id="user-icon" />
      <div id="user">
        {"User name"}
        <FaAngleDown id="iconUser" />
      </div>
      <div className="line"></div>
      <div className="links">
        <Link id="theLink" activeClassName="sideNavTabActive" to="/">
          <FaHome className="icon" />
          {"Dashboard"}
        </Link>
        <Link id="theLink" activeClassName="sideNavTabActive" to="/database">
          <FaDatabase className="icon" />
          {"Database "}
        </Link>
        <Link id="theLink" activeClassName="sideNavTabActive" to="/schedule">
          <FaRegCalendarAlt className="icon" />
          {"Schedule"}
        </Link>
      </div>
    </aside>
  );
};

export default SideNavBar;
