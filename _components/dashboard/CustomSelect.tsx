'use client'
import Link from "next/link";
import { Key, useState } from "react";
import { DashboardSearchParams } from "../../app/lib/typeDefinitions";

const CustomSelect = ({
  values,
  currentValue,
  urlName,
  searchParams,
}: {
  values: String[] | number[];
  currentValue: string | number | undefined;
  urlName: string;
  searchParams: DashboardSearchParams;
}) => {
  const displayValue = searchParams[urlName] || currentValue;

  const [open, setOpen] = useState(false);

  return (
    <div className="relative w-2/5 md:w-1/4">
      <div
        onClick={() => setOpen(!open)}
        className="w-full rounded border-2 border-gray-400 p-2 text-gray-700 outline-none focus:border-darkGreen focus:ring-2 focus:ring-darkGreen"
      >
        {displayValue}
      </div>
      {open && (
        <ul className="absolute left-0 z-10 mt-2 w-full rounded bg-white shadow-md">
          {values.map((value: any, index: Key | null | undefined) => {
            const currentParams = new URLSearchParams();
            Object.entries(searchParams).forEach(([key, value]) => {
              if (value) currentParams.set(key, value);
            });
            currentParams.set(urlName, value);
            const newUrl = `?${currentParams.toString()}`;
            return (
                <li
                  key={index}
                  className="border-b border-gray-200 last:border-none"
                >
                  <Link
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                    href={newUrl}
                    onClick={() => setOpen(false)}
                  >
                    {value}
                  </Link>
                </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default CustomSelect;
