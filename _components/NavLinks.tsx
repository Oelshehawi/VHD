"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  HomeIcon,
  CalendarIcon,
  CircleStackIcon,
  DocumentIcon,
  CurrencyDollarIcon,
  ClipboardDocumentListIcon,
  ChartBarIcon,
} from "@heroicons/react/24/solid";
import { usePathname } from "next/navigation";

const NavLinks = ({
  isNavOpen,
  canManage,
  setIsNavOpen,
  pendingTimeOffCount = 0,
}: {
  isNavOpen: boolean;
  canManage: boolean;
  setIsNavOpen: (isOpen: boolean) => void;
  user: any;
  pendingTimeOffCount?: number;
}) => {
  const pathname = usePathname();

  const isActive = (href: string) => {
    return (
      pathname === href ||
      pathname?.startsWith(`${href}`) ||
      pathname?.startsWith(`${href}`)
    );
  };

  const links = canManage
    ? [
        { href: "/dashboard", icon: HomeIcon },
        { href: "/database", icon: CircleStackIcon },
        { href: "/estimates", icon: ClipboardDocumentListIcon },
        { href: "/invoices", icon: DocumentIcon },
        { href: "/schedule", icon: CalendarIcon },
        { href: "/payroll", icon: CurrencyDollarIcon, badge: pendingTimeOffCount ? pendingTimeOffCount : undefined },
        { href: "/analytics", icon: ChartBarIcon },
      ]
    : [
        { href: "/employee-dashboard", icon: HomeIcon },
        { href: "/schedule", icon: CalendarIcon },
      ];

  return (
    <motion.div
      initial={{ opacity: 0, x: "-100%" }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: "-100%" }}
      className={`lg:flex lg:flex-col lg:items-start ${
        isNavOpen ? "block" : "hidden"
      } lg:block`}
    >
      <div className="p-4 lg:mt-3 lg:flex lg:w-full lg:space-y-5">
        <div className="grid grid-cols-3 gap-4 lg:hidden">
          {links.map(({ href, icon: Icon, badge }) => (
            <motion.div
              key={href}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative"
            >
              <Link
                href={href}
                className={`text-black flex items-center justify-center rounded-lg bg-gray-600 p-4 text-xl font-bold ${
                  isActive(href)
                    ? "!bg-darkBlue text-white!"
                    : "hover:bg-darkBlue hover:text-white!"
                }`}
                onClick={() => setIsNavOpen(false)}
              >
                <div className="flex items-center">
                  <Icon className="h-8 w-8" />
                </div>
              </Link>
              {badge && badge > 0 && (
                <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-red-500"></span>
              )}
            </motion.div>
          ))}
        </div>

        <div className="hidden flex-col items-center space-y-5 lg:flex">
          {links.map(({ href, icon: Icon, badge }) => (
            <motion.div
              key={href}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative"
            >
              <Link
                href={href}
                className={`text-black flex items-center justify-center rounded-lg bg-gray-600 p-2 text-xl font-bold ${
                  isActive(href)
                    ? "!bg-darkBlue text-white!"
                    : "hover:bg-darkBlue hover:text-white!"
                }`}
                onClick={() => setIsNavOpen(false)}
              >
                <div className="flex items-center">
                  <Icon className="h-6 w-6" />
                </div>
              </Link>
              {badge && badge > 0 && (
                <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-red-500"></span>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default NavLinks;
