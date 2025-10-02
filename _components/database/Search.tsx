"use client";
import { usePathname, useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { FaSearch } from "react-icons/fa";
import { useDebouncedCallback } from "use-debounce";
import { useState } from "react";

const Search = ({ placeholder }: { placeholder: string }) => {
  const searchParams = useSearchParams() ?? new URLSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = useDebouncedCallback((term) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', '1');
    if (term) {
      params.set("query", term);
    } else {
      params.delete("query");
    }
    replace(`${pathname}?${params.toString()}`);
    setIsSearching(false);
  }, 300);

  return (
    <div className="flex flex-col gap-3 py-2 md:flex-row">
      <div className="flex relative">
        <input
          type="text"
          placeholder={placeholder}
          onChange={(e) => {
            setIsSearching(true);
            handleSearch(e.target.value);
          }}
          className="h-10 w-full rounded-l-md border border-darkGreen px-3 pr-10 ring-2 ring-darkGreen focus:outline-none md:w-80"
          defaultValue={searchParams.get("query")?.toString()}
        />
        {isSearching && (
          <div className="absolute right-14 top-1/2 -translate-y-1/2">
            <svg className="animate-spin h-4 w-4 text-darkGreen" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        )}
        <button
          type="submit"
          className="rounded-r-md border-darkGreen bg-darkGreen px-2 py-0 text-white ring-2 ring-darkGreen hover:bg-darkBlue md:px-3 md:py-1"
        >
          <FaSearch className="h-5 w-5 " />
        </button>
      </div>
    </div>
  );
};

export default Search;
