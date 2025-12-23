"use client";
import { usePathname, useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { Search as SearchIcon } from "lucide-react";
import { useDebouncedCallback } from "use-debounce";
import { useState } from "react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Loader2 } from "lucide-react";

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
    <div className="relative flex w-full">
      <Input
        type="text"
        placeholder={placeholder}
        onChange={(e) => {
          setIsSearching(true);
          handleSearch(e.target.value);
        }}
        defaultValue={searchParams.get("query")?.toString()}
        className="pr-20"
      />
      {isSearching && (
        <div className="absolute right-14 top-1/2 -translate-y-1/2">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      )}
      <Button
        type="submit"
        className="absolute right-0 top-0 h-full rounded-l-none"
        size="default"
      >
        <SearchIcon className="h-5 w-5" />
      </Button>
    </div>
  );
};

export default Search;
