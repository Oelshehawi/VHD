import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { FaRegUserCircle } from "react-icons/fa";
import { FaHome } from "react-icons/fa";
import { FaRegCalendarAlt } from "react-icons/fa";
import { FaDatabase } from "react-icons/fa";
import { FaAngleDown } from "react-icons/fa";

const SideNavBar = () => {
  const router = useRouter();

  const isActive = (href) => {
    return router.pathname === href;
  };

  return (
    <aside id="sidebar">
      <div className="user"> Hi There, Admin</div>
      <div className="links">
        <Link
          id="theLink"
          href="/"
          className={
            isActive("/") ? "sidebar-link-active" : "sidebar-link-notActive"
          }
        >
          <FaHome className="icon" />
          {"Dashboard"}
        </Link>
        <Link
          id="theLink"
          href="/database"
          className={
            isActive("/database")
              ? "sidebar-link-active"
              : "sidebar-link-notActive"
          }
        >
          <FaDatabase className="icon" />
          {"Database "}
        </Link>
        <Link
          id="theLink"
          href="/schedule"
          className={
            isActive("/schedule")
              ? "sidebar-link-active"
              : "sidebar-link-notActive"
          }
        >
          <FaRegCalendarAlt className="icon" />
          {"Schedule"}
        </Link>
      </div>
    </aside>
  );
};

export default SideNavBar;
