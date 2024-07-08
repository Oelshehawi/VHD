"use client";
import { usePathname, useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { FaSearch } from "react-icons/fa";
import { useDebouncedCallback } from "use-debounce";

const Search = ({ placeholder }: { placeholder: string }) => {
  const searchParams = useSearchParams() ?? new URLSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  const handleSearch = useDebouncedCallback((term) => {
    console.log(`Searching... ${term}`);

    const params = new URLSearchParams(searchParams);
    params.set('page', '1');
    if (term) {
      params.set("query", term);
    } else {
      params.delete("query");
    }
    replace(`${pathname}?${params.toString()}`);
  }, 300);

  return (
    <div className="flex flex-col gap-3 py-2 md:flex-row">
      <div className="flex">
        <input
          type="text"
          placeholder={placeholder}
          onChange={(e) => handleSearch(e.target.value)}
          className="h-10 w-full rounded-l-md border border-darkGreen px-3  ring-2 ring-darkGreen focus:outline-none md:w-80"
          defaultValue={searchParams.get("query")?.toString()}
        />
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
