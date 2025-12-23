"use client";

import * as React from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";
import { CheckIcon, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "../ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../ui/popover";

const sortOptions = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "dateIssued descending", label: "Latest Invoices" },
  { value: "dateIssued ascending", label: "Earliest Invoices" },
] as const;

const InvoiceSorting = () => {
  const searchParams = useSearchParams() ?? new URLSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();
  const [open, setOpen] = React.useState(false);

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

  // Determine current selection
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

  const selectedOption = sortOptions.find((option) => option.value === currentValue);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedOption ? (
            <span className="truncate">{selectedOption.label}</span>
          ) : (
            <span className="text-muted-foreground">All</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandList>
            <CommandEmpty>No option found.</CommandEmpty>
            <CommandGroup>
              {sortOptions.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  onSelect={() => {
                    handleSorting(option.value);
                    setOpen(false);
                  }}
                >
                  <CheckIcon
                    className={cn(
                      "mr-2 h-4 w-4",
                      currentValue === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default InvoiceSorting;
