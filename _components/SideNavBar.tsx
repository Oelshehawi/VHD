"use client";
import {  useState } from "react";
import UserSection from "./UserSection";
import NavLinks from "./NavLinks";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/solid";

const SideNavBar = ({ canManage, user }: { canManage: boolean; user: any }) => {
  const [isNavOpen, setIsNavOpen] = useState(false);

  const toggleNav = () => {
    setIsNavOpen((prev) => !prev);
  };

  return (
    <div className="border-borderGreen bg-darkGreen text-xl text-white lg:fixed lg:left-0 lg:top-0 lg:h-screen lg:w-18 lg:border-r-4 lg:overflow-y-auto">
      <div className="flex items-center justify-between p-4 lg:flex-col lg:border-b-2 lg:border-r-0">
        <div className="min-h-[10%]">
          <UserSection />
        </div>
        <button
          className="block lg:hidden"
          onClick={toggleNav}
          aria-label="Toggle navigation"
        >
          {isNavOpen ? (
            <XMarkIcon className="h-8 w-8 text-white" />
          ) : (
            <Bars3Icon className="h-8 w-8 text-white" />
          )}
        </button>
      </div>
      <NavLinks
        isNavOpen={isNavOpen}
        canManage={canManage}
        setIsNavOpen={setIsNavOpen}
        user={user}
      />
    </div>
  );
};

export default SideNavBar;
