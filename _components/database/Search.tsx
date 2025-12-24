"use client";
import { usePathname, useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { Search as SearchIcon, Loader2 } from "lucide-react";
import { useDebouncedCallback } from "use-debounce";
import { useState } from "react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "../ui/input-group";

const Search = ({ placeholder }: { placeholder: string }) => {
  const searchParams = useSearchParams() ?? new URLSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = useDebouncedCallback((term) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", "1");
    if (term) {
      params.set("query", term);
    } else {
      params.delete("query");
    }
    replace(`${pathname}?${params.toString()}`);
    setIsSearching(false);
  }, 300);

  return (
    <InputGroup>
      <InputGroupAddon align="inline-start">
        <SearchIcon className="h-4 w-4" />
      </InputGroupAddon>
      <InputGroupInput
        type="text"
        placeholder={placeholder}
        onChange={(e) => {
          setIsSearching(true);
          handleSearch(e.target.value);
        }}
        defaultValue={searchParams.get("query")?.toString()}
      />
      {isSearching && (
        <InputGroupAddon align="inline-end">
          <Loader2 className="h-4 w-4 animate-spin" />
        </InputGroupAddon>
      )}
    </InputGroup>
  );
};

export default Search;
