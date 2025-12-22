"use client";
import { usePathname, useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

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

  const currentSort = searchParams.get("sort") || "1";

  return (
    <Select
      value={currentSort}
      onValueChange={(value) => handleSorting(value)}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Sort by" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="1">Name A-Z</SelectItem>
        <SelectItem value="-1">Name Z-A</SelectItem>
      </SelectContent>
    </Select>
  );
};
export default Sorting;
