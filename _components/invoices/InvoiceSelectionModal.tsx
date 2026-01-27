"use client";
import { useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { ScrollArea } from "../ui/scroll-area";
import { formatDateStringUTC } from "../../app/lib/utils";

interface InvoiceSelectionModalProps {
  invoices: any[];
  isOpen: boolean;
  onClose: () => void;
  onSelect: (invoice: any) => void;
}

const InvoiceSelectionModal = ({
  invoices,
  isOpen,
  onClose,
  onSelect,
}: InvoiceSelectionModalProps) => {
  const uniqueInvoices = useMemo(() => {
    const jobTitleMap = new Map<string, any>();

    invoices.forEach((invoice) => {
      const rawJobTitle =
        typeof invoice?.jobTitle === "string" ? invoice.jobTitle : "";
      const key = rawJobTitle.trim() || String(invoice?._id ?? "");

      if (!jobTitleMap.has(key)) {
        jobTitleMap.set(key, invoice);
      }
    });

    return Array.from(jobTitleMap.values());
  }, [invoices]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl">
            Select Invoice to Autofill
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-96">
          {uniqueInvoices.length > 0 ? (
            <ul className="space-y-2">
              {uniqueInvoices.map((invoice) => (
                <li
                  key={invoice._id}
                  onClick={() => onSelect(invoice)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onSelect(invoice);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  className="border-border hover:bg-muted cursor-pointer rounded-md border p-3 transition-colors"
                >
                  <div className="flex justify-between">
                    <span className="text-primary font-medium">
                      {invoice.invoiceId}
                    </span>
                    <span className="text-muted-foreground text-sm">
                      {invoice.dateIssued
                        ? formatDateStringUTC(invoice.dateIssued)
                        : "No date"}
                    </span>
                  </div>
                  <div className="text-primary mt-1 text-sm font-medium">
                    Location: {invoice.location}
                  </div>
                  <div className="text-muted-foreground mt-1 text-xs">
                    Job: {invoice.jobTitle}
                  </div>
                  {invoice.items && invoice.items.length > 0 && (
                    <div className="mt-2 space-y-1">
                      <div className="text-muted-foreground text-xs font-medium">
                        Services:
                      </div>
                      {invoice.items
                        .slice(0, 2)
                        .map((item: any, index: number) => (
                          <div
                            key={index}
                            className="text-muted-foreground text-xs"
                          >
                            • {item.description}
                            {item.details && (
                              <span className="text-muted-foreground/70 italic">
                                {" "}
                                ({item.details})
                              </span>
                            )}
                          </div>
                        ))}
                      {invoice.items.length > 2 && (
                        <div className="text-muted-foreground text-xs italic">
                          +{invoice.items.length - 2} more services...
                        </div>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-muted-foreground py-4 text-center">
              No invoices found
            </div>
          )}
        </ScrollArea>

        <DialogFooter>
          <Button onClick={onClose} variant="outline">
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default InvoiceSelectionModal;
