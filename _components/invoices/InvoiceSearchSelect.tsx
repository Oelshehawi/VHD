"use client";

import * as React from "react";
import { CheckIcon, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { InvoiceType } from "../../app/lib/typeDefinitions";
import { formatDateStringUTC } from "../../app/lib/utils";

interface InvoiceSearchSelectProps {
  invoices: InvoiceType[];
  onSelect: (invoice: InvoiceType) => void;
  error?: any;
  resetKey?: number;
}

export function InvoiceSearchSelect({
  invoices,
  onSelect,
  error,
  resetKey = 0,
}: InvoiceSearchSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState("");

  // Reset selection when resetKey changes
  React.useEffect(() => {
    setValue("");
  }, [resetKey]);

  const selectedInvoice = invoices.find(
    (invoice) => invoice._id?.toString() === value,
  );

  return (
    <Popover modal={true} open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between",
            error && "border-destructive focus-visible:ring-destructive",
          )}
        >
          {selectedInvoice ? (
            <span className="truncate">{selectedInvoice.jobTitle}</span>
          ) : (
            <span className="text-muted-foreground">
              Search and select invoice...
            </span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0"
        align="start"
      >
        <Command
          filter={(value, search) => {
            // Case-insensitive substring match
            if (value.toLowerCase().includes(search.toLowerCase())) return 1;
            return 0;
          }}
        >
          <CommandInput placeholder="Search invoices..." />
          <CommandList className="max-h-[300px]">
            <CommandEmpty>No invoice found.</CommandEmpty>
            <CommandGroup>
              {invoices.map((invoice) => (
                <CommandItem
                  key={invoice._id?.toString()}
                  value={`${invoice.jobTitle} ${formatDateStringUTC(invoice.dateIssued as string | Date)}`}
                  onSelect={() => {
                    const invoiceId = invoice._id?.toString() || "";
                    setValue(invoiceId);
                    setOpen(false);
                    onSelect(invoice);
                  }}
                >
                  <CheckIcon
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === invoice._id?.toString()
                        ? "opacity-100"
                        : "opacity-0",
                    )}
                  />
                  <div className="flex flex-1 items-center justify-between">
                    <span className="font-medium">{invoice.jobTitle}</span>
                    <span className="text-muted-foreground ml-2 text-xs">
                      {formatDateStringUTC(invoice.dateIssued as string | Date)}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export default InvoiceSearchSelect;
