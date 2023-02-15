import * as React from "react";
import "../style/sidebar.css";
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
      <div className="tab">
        <FaHome className="icon" />
        {"Dashboard"}
      </div>
      <div className="tab">
        <FaDatabase className="icon" />
        {"Database "}
      </div>
      <div className="tab">
        <FaRegCalendarAlt className="icon" />
        {"Schedule"}
      </div>
    </aside>
  );
};

export default SideNavBar;
