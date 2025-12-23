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
import { ClientType } from "../../app/lib/typeDefinitions";

interface ClientComboboxProps {
  clients: ClientType[];
  onSelect: (client: ClientType) => void;
  error?: any;
  resetKey?: number;
}

export function ClientCombobox({
  clients,
  onSelect,
  error,
  resetKey = 0,
}: ClientComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState("");

  // Reset selection when resetKey changes
  React.useEffect(() => {
    setValue("");
  }, [resetKey]);

  const selectedClient = clients.find(
    (client) => client._id?.toString() === value,
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
          {selectedClient ? (
            <span className="truncate">{selectedClient.clientName}</span>
          ) : (
            <span className="text-muted-foreground">
              Search and select a client...
            </span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0"
        align="start"
      >
        <Command>
          <CommandInput placeholder="Search clients..." />
          <CommandList className="max-h-[300px]">
            <CommandEmpty>No client found.</CommandEmpty>
            <CommandGroup>
              {clients.map((client) => (
                <CommandItem
                  key={client._id?.toString()}
                  value={`${client.clientName} ${client.email || ""}`}
                  onSelect={() => {
                    const clientId = client._id?.toString() || "";
                    setValue(clientId);
                    setOpen(false);
                    onSelect(client);
                  }}
                >
                  <CheckIcon
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === client._id?.toString()
                        ? "opacity-100"
                        : "opacity-0",
                    )}
                  />
                  <div className="flex flex-col">
                    <span className="font-medium">{client.clientName}</span>
                    {client.email && (
                      <span className="text-muted-foreground text-xs">
                        {client.email}
                      </span>
                    )}
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
