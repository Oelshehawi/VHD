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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../ui/popover";
import { InvoiceType, ScheduleType } from "../../app/lib/typeDefinitions";
import { formatDateToString } from "../../app/lib/utils";

interface InvoiceSearchSelectProps {
  placeholder: string;
  data: InvoiceType[];
  className?: string;
  onSelect: (invoice: ScheduleType) => void;
  register: any;
  error: any;
}

const InvoiceSearchSelect = ({
  placeholder,
  data,
  className,
  onSelect,
  register,
  error,
}: InvoiceSearchSelectProps) => {
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState("");
  const { onChange, ...registerProps } = register("invoiceRef", { required: true });

  const selectedInvoice = data.find(
    (invoice) => invoice._id?.toString() === value
  );

  const handleSelect = (invoice: InvoiceType) => {
    const invoiceId = invoice._id?.toString() || "";
    setValue(invoiceId);
    setOpen(false);
    // Trigger react-hook-form onChange
    onChange({ target: { value: invoiceId, name: "invoiceRef" } });
    onSelect(invoice as unknown as any);
  };

  return (
    <div className={cn("flex w-full flex-col gap-3 py-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full justify-between",
              error && "border-destructive focus-visible:ring-destructive"
            )}
          >
            {selectedInvoice ? (
              <span className="truncate">{selectedInvoice.jobTitle}</span>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput placeholder="Search invoices..." />
            <CommandList>
              <CommandEmpty>No invoice found.</CommandEmpty>
              <CommandGroup>
                {data.map((invoice) => (
                  <CommandItem
                    key={invoice._id?.toString()}
                    value={`${invoice.jobTitle} ${formatDateToString(invoice.dateIssued as string | Date)}`}
                    onSelect={() => handleSelect(invoice)}
                  >
                    <CheckIcon
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === invoice._id?.toString() ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex flex-1 items-center justify-between">
                      <span className="font-medium">{invoice.jobTitle}</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        {formatDateToString(invoice.dateIssued as string | Date)}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <input type="hidden" {...registerProps} value={value} onChange={onChange} />
      {error && (
        <p className="text-destructive mt-1 text-xs">Invoice is required</p>
      )}
    </div>
  );
};

export default InvoiceSearchSelect;
