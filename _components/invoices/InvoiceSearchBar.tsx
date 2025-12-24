"use client";

import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { Search as SearchIcon } from "lucide-react";
import { useDebouncedCallback } from "use-debounce";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "../ui/input-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

const sortOptions = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "dateIssued descending", label: "Latest" },
  { value: "dateIssued ascending", label: "Earliest" },
] as const;

const InvoiceSearchBar = () => {
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

  const handleSorting = useDebouncedCallback((term: string) => {
    const params = new URLSearchParams(searchParams);

    if (term === "dateIssued ascending") {
      params.set("sort", "dateIssuedasc");
    }

    if (term === "dateIssued descending") {
      params.set("sort", "dateIssueddes");
    }

    if (term === "pending") {
      params.set("filter", term);
    }

    if (term === "all") {
      params.delete("sort");
      params.delete("filter");
    }
    replace(`${pathname}?${params.toString()}`);
  }, 300);

  // Determine current selection for sorting
  const currentFilter = searchParams.get("filter");
  const currentSort = searchParams.get("sort");
  let currentValue = "all";

  if (currentFilter === "pending") {
    currentValue = "pending";
  } else if (currentSort === "dateIssueddes") {
    currentValue = "dateIssued descending";
  } else if (currentSort === "dateIssuedasc") {
    currentValue = "dateIssued ascending";
  }

  const selectedOption = sortOptions.find(
    (option) => option.value === currentValue,
  );

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      {/* Search Input Group */}
      <div className="flex-1">
        <InputGroup>
          <InputGroupAddon align="inline-start">
            <SearchIcon className="h-4 w-4" />
          </InputGroupAddon>
          <InputGroupInput
            type="text"
            placeholder="Search For Invoice..."
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
      </div>

      {/* Sorting Select */}
      <div className="w-full sm:w-48">
        <Select value={currentValue} onValueChange={handleSorting}>
          <SelectTrigger className="w-full">
            <SelectValue>
              {selectedOption ? selectedOption.label : "All"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default InvoiceSearchBar;
