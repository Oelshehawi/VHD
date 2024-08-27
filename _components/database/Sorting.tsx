"use client";
import { usePathname, useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";

const Sorting = () => {
  const searchParams = useSearchParams() ?? new URLSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  const handleSorting = useDebouncedCallback((term) => {

    const params = new URLSearchParams(searchParams);
    if (term) {
      params.set("sort", term);
    } else {
      params.delete("sort");
    }
    replace(`${pathname}?${params.toString()}`);
  }, 300);

  return (
    <div className="flex flex-1 flex-col py-2 md:flex-row">
      <select
        id="clientSort"
        name="clientSort"
        onChange={(e) => handleSorting(e.target.value)}
        className="h-10 w-full rounded-md border border-gray-300 px-2 py-0 tracking-wider text-gray-700 hover:cursor-pointer focus:border-darkGreen focus:ring-2 focus:ring-darkGreen md:px-3 md:py-1"
      >
        <option value={1}>Name A-Z</option>
        <option value={-1}>Name Z-A</option>
      </select>
    </div>
  );
};
export default Sorting;
