'use client'
import Link from "next/link";
import { Key, useState } from "react";
import { DashboardSearchParams } from "../../app/lib/typeDefinitions";
import { FaChevronDown } from "react-icons/fa";

const CustomSelect = ({
  values,
  currentValue,
  urlName,
  searchParams,
  onChange,
}: {
  values: String[] | number[];
  currentValue: string | number | undefined;
  urlName: string;
  searchParams: DashboardSearchParams;
  onChange?: (value: string | number) => void;
}) => {
  // Use currentValue as primary source of truth (local state), fall back to searchParams for backward compatibility
  const displayValue = currentValue || searchParams[urlName];
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <div
        onClick={() => setOpen(!open)}
        className="flex cursor-pointer items-center gap-2 rounded-full border-2 border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:border-darkGreen focus:outline-none"
      >
        <span>{displayValue}</span>
        <FaChevronDown className={`h-3 w-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </div>
      {open && (
        <ul className="absolute left-0 z-10 mt-2 max-h-60 w-full overflow-auto rounded-lg bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5">
          {values.map((value: any, index: Key | null | undefined) => {
            // If onChange callback is provided, use it; otherwise use URL navigation
            if (onChange) {
              return (
                <li
                  key={index}
                  className="relative"
                >
                  <button
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100
                      ${value === displayValue ? 'bg-gray-50 text-darkGreen font-medium' : 'text-gray-700'}`}
                    onClick={() => {
                      onChange(value);
                      setOpen(false);
                    }}
                  >
                    {value}
                  </button>
                </li>
              );
            } else {
              // Fallback to URL navigation for backward compatibility
              const currentParams = new URLSearchParams();
              Object.entries(searchParams).forEach(([key, value]) => {
                if (value) currentParams.set(key, value);
              });
              currentParams.set(urlName, value);
              const newUrl = `?${currentParams.toString()}`;

              return (
                <li
                  key={index}
                  className="relative"
                >
                  <Link
                    className={`block px-4 py-2 text-sm hover:bg-gray-100
                      ${value === displayValue ? 'bg-gray-50 text-darkGreen font-medium' : 'text-gray-700'}`}
                    href={newUrl}
                    onClick={() => setOpen(false)}
                  >
                    {value}
                  </Link>
                </li>
              );
            }
          })}
        </ul>
      )}
    </div>
  );
};

export default CustomSelect;
