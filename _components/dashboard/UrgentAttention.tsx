"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { AlertTriangle, Clock, CalendarX, Search } from "lucide-react";
import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { formatAmount, formatDateStringUTC } from "../../app/lib/utils";

interface UrgentAttentionProps {
  overdueInvoices: any[];
  unscheduledJobs: any[];
}

type FilterType = "all" | "overdue" | "unscheduled";

export default function UrgentAttention({
  overdueInvoices,
  unscheduledJobs,
}: UrgentAttentionProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [filter, setFilter] = useState<FilterType>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const totalUrgent = overdueInvoices.length + unscheduledJobs.length;

  // Filter items based on filter type and search query
  const filteredItems = useMemo(() => {
    const items: Array<{
      id: string;
      type: "overdue" | "unscheduled";
      title: string;
      subtitle: string;
      badge: string;
      href: string;
    }> = [];

    // Add overdue invoices
    if (filter === "all" || filter === "overdue") {
      overdueInvoices.forEach((invoice) => {
        items.push({
          id: invoice._id,
          type: "overdue",
          title: invoice.jobTitle,
          subtitle: `${invoice.invoiceId} • ${formatAmount(invoice.amount)}`,
          badge: invoice.dateDue
            ? formatDateStringUTC(invoice.dateIssued)
            : "Overdue",
          href: `/invoices/${invoice._id}`,
        });
      });
    }

    // Add unscheduled jobs
    if (filter === "all" || filter === "unscheduled") {
      unscheduledJobs.forEach((job) => {
        items.push({
          id: job._id,
          type: "unscheduled",
          title: job.jobTitle,
          subtitle: job.clientId ? "Client Linked" : "No Client",
          badge: `Due: ${formatDateStringUTC(job.dateDue)}`,
          href: `/invoices/${job.invoiceId}`,
        });
      });
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      return items.filter(
        (item) =>
          item.title.toLowerCase().includes(query) ||
          item.subtitle.toLowerCase().includes(query),
      );
    }

    return items;
  }, [overdueInvoices, unscheduledJobs, filter, searchQuery]);

  if (totalUrgent === 0) {
    return null;
  }

  return (
    <>
      {/* Summary Card - Click to open dialog */}
      <Card
        className="border-destructive/30 bg-destructive/10 hover:bg-destructive/20 cursor-pointer shadow-lg transition-colors"
        onClick={() => setIsDialogOpen(true)}
      >
        <CardContent className="p-1.5 sm:p-2">
          <div className="flex min-w-0 flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-1.5">
              <div className="border-destructive/20 bg-destructive/20 shrink-0 rounded-lg border p-1">
                <AlertTriangle className="text-destructive h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </div>
              <div className="min-w-0">
                <h2 className="text-destructive-foreground text-sm font-bold sm:text-base">
                  Urgent Attention
                </h2>
                <p className="text-destructive-foreground/70 text-[10px] sm:text-xs">
                  {overdueInvoices.length > 0 &&
                    `${overdueInvoices.length} overdue`}
                  {overdueInvoices.length > 0 &&
                    unscheduledJobs.length > 0 &&
                    " • "}
                  {unscheduledJobs.length > 0 &&
                    `${unscheduledJobs.length} unscheduled`}
                </p>
              </div>
            </div>
            <div className="shrink-0 text-center sm:text-right">
              <div className="border-destructive/20 bg-destructive/20 rounded-md border p-1.5 text-center">
                <div className="text-destructive truncate text-lg font-bold sm:text-xl">
                  {totalUrgent}
                </div>
              </div>
              <div className="mt-1 flex items-center justify-center gap-1 sm:justify-end">
                <Clock className="text-destructive-foreground/70 h-3 w-3 shrink-0" />
                <span className="text-destructive-foreground/70 truncate text-[10px] sm:text-xs">
                  items need action
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dialog with Search and Filter */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="flex h-[70vh] max-h-[600px] w-full flex-col overflow-hidden p-0">
          <DialogHeader className="shrink-0 border-b p-4">
            <DialogTitle className="flex items-center gap-2 text-lg font-bold">
              <AlertTriangle className="text-destructive h-5 w-5" />
              Urgent Attention ({totalUrgent} items)
            </DialogTitle>
          </DialogHeader>

          {/* Filter Controls */}
          <div className="flex shrink-0 items-center gap-3 border-b p-3">
            <div className="relative flex-1">
              <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-background ring-ring h-9 w-full rounded-md border pr-3 pl-9 text-sm outline-none focus:ring-2"
              />
            </div>
            <Select
              value={filter}
              onValueChange={(val) => setFilter(val as FilterType)}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All ({totalUrgent})</SelectItem>
                <SelectItem value="overdue">
                  Overdue ({overdueInvoices.length})
                </SelectItem>
                <SelectItem value="unscheduled">
                  Unscheduled ({unscheduledJobs.length})
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Items List - simple overflow with max-height */}
          <div className="max-h-[400px] overflow-y-auto p-3">
            {filteredItems.length === 0 ? (
              <p className="text-muted-foreground py-8 text-center">
                No items found.
              </p>
            ) : (
              <div className="space-y-2">
                {filteredItems.map((item) => (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={() => setIsDialogOpen(false)}
                    className="bg-card hover:bg-accent flex items-center justify-between rounded-md border p-3 transition-colors"
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      {item.type === "overdue" ? (
                        <Clock className="text-destructive h-4 w-4 shrink-0" />
                      ) : (
                        <CalendarX className="text-muted-foreground h-4 w-4 shrink-0" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{item.title}</p>
                        <p className="text-muted-foreground truncate text-xs">
                          {item.subtitle}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={
                        item.type === "overdue" ? "destructive" : "secondary"
                      }
                      className="ml-2 shrink-0"
                    >
                      {item.badge}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
