'use client'
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HomeIcon,
  CalendarIcon,
  CircleStackIcon,
  DocumentIcon,
} from "@heroicons/react/24/solid";
import { motion, AnimatePresence } from "framer-motion";
import {
  SignOutButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";

const SideNavBar = () => {
  const isActive = (href: string) => {
    const pathname = usePathname();
    return (
      pathname === href ||
      pathname?.startsWith(`${href}`) ||
      pathname?.startsWith(`${href}`)
    );
  };

  return (
    <div className="flex flex-row items-center justify-between border-borderGreen bg-darkGreen text-xl text-white lg:min-h-screen lg:flex-col lg:border-r-4">
      <div className="flex items-center justify-center border-r-2 border-borderGreen p-2 lg:border-b-2 lg:border-r-0">
        <SignedIn>
          <UserButton afterSignOutUrl="/sign-in" />
        </SignedIn>
        <SignedOut>
          <SignOutButton />
        </SignedOut>
      </div>
      <div className="flex grow justify-center p-2 lg:flex-col lg:justify-start">
        <div className="flex flex-row gap-4 text-center lg:mt-3 lg:flex-col lg:space-y-5">
          {[
            { href: "/dashboard", icon: HomeIcon },
            { href: "/database", icon: CircleStackIcon },
            { href: "/invoices", icon: DocumentIcon },
            { href: "/schedule", icon: CalendarIcon },
          ].map(({ href, icon: Icon }) => (
            <AnimatePresence key={href}>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  href={href}
                  className={` flex items-center justify-center rounded-lg bg-gray-200 p-2 text-xl font-bold text-black ${
                    isActive(href)
                      ? "!bg-darkBlue !text-white"
                      : "hover:bg-darkBlue hover:!text-white"
                  }`}
                >
                  <div className="flex items-center ">
                    <Icon className="h-6 w-6" />
                  </div>
                </Link>
              </motion.div>
            </AnimatePresence>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SideNavBar;
