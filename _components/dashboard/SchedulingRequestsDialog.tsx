"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Clock, Mail, Phone } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { ScrollArea } from "../ui/scroll-area";
import { Badge } from "../ui/badge";
import { Card, CardContent } from "../ui/card";
import { Skeleton } from "../ui/skeleton";
import {
  formatDateStringUTC,
  formatDateWithWeekdayUTC,
} from "../../app/lib/utils";
import { getSchedulingRequestsForJobsDueSoon } from "../../app/lib/actions/schedulingRequest.actions";
import { SchedulingRequestType } from "../../app/lib/typeDefinitions";

interface SchedulingRequestsDialogProps {
  jobsDueSoonId: string;
  jobTitle: string;
  count: number;
  isOpen: boolean;
  onClose: () => void;
}

const formatExactTime = (hour?: number, minute?: number) => {
  if (hour === undefined || minute === undefined) return "Unknown";
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minute.toString().padStart(2, "0")} ${period}`;
};

const statusBadgeVariant = (status?: string) => {
  switch (status) {
    case "confirmed":
      return "default";
    case "pending":
      return "secondary";
    case "alternatives_sent":
      return "outline";
    case "cancelled":
    case "expired":
      return "destructive";
    default:
      return "secondary";
  }
};

export default function SchedulingRequestsDialog({
  jobsDueSoonId,
  jobTitle,
  count,
  isOpen,
  onClose,
}: SchedulingRequestsDialogProps) {
  const [requests, setRequests] = useState<SchedulingRequestType[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    const fetchRequests = async () => {
      if (!isOpen || !jobsDueSoonId) return;
      setIsLoading(true);
      try {
        const result = await getSchedulingRequestsForJobsDueSoon(jobsDueSoonId);
        if (!isCancelled) {
          setRequests(result.success ? result.requests : []);
        }
      } catch (error) {
        if (!isCancelled) {
          console.error("Failed to load scheduling requests:", error);
          setRequests([]);
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchRequests();

    return () => {
      isCancelled = true;
    };
  }, [isOpen, jobsDueSoonId]);

  const sortedRequests = useMemo(
    () =>
      [...requests].sort(
        (a, b) =>
          new Date(b.requestedAt || 0).getTime() -
          new Date(a.requestedAt || 0).getTime(),
      ),
    [requests],
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex max-h-[85vh] flex-col sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between gap-2">
            <span>Scheduling Requests</span>
            <Badge variant="secondary">
              {count} {count === 1 ? "request" : "requests"}
            </Badge>
          </DialogTitle>
          <p className="text-muted-foreground text-sm">{jobTitle}</p>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-2">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-28 w-full rounded-lg" />
              ))}
            </div>
          ) : sortedRequests.length === 0 ? (
            <div className="text-muted-foreground py-10 text-center">
              No scheduling requests found.
            </div>
          ) : (
            <div className="space-y-3 pb-2">
              {sortedRequests.map((request) => (
                <Card key={request._id?.toString()}>
                  <CardContent className="space-y-4 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="text-muted-foreground text-xs">
                        Requested{" "}
                        {request.requestedAt
                          ? formatDateStringUTC(request.requestedAt)
                          : "Unknown date"}
                      </div>
                      <Badge variant={statusBadgeVariant(request.status)}>
                        {request.status.replaceAll("_", " ")}
                      </Badge>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="space-y-1 rounded-md border p-3">
                        <div className="text-muted-foreground text-xs uppercase">
                          Primary Selection
                        </div>
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <CalendarDays className="text-primary h-4 w-4" />
                          {formatDateWithWeekdayUTC(
                            request.primarySelection?.date ?? "",
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="text-muted-foreground h-4 w-4" />
                          {formatExactTime(
                            request.primarySelection?.requestedTime?.hour,
                            request.primarySelection?.requestedTime?.minute,
                          )}
                        </div>
                      </div>

                      <div className="space-y-1 rounded-md border p-3">
                        <div className="text-muted-foreground text-xs uppercase">
                          Backup Selection
                        </div>
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <CalendarDays className="text-primary h-4 w-4" />
                          {formatDateWithWeekdayUTC(
                            request.backupSelection?.date ?? "",
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="text-muted-foreground h-4 w-4" />
                          {formatExactTime(
                            request.backupSelection?.requestedTime?.hour,
                            request.backupSelection?.requestedTime?.minute,
                          )}
                        </div>
                      </div>
                    </div>

                    {(request.confirmedDate || request.confirmedTime) && (
                      <div className="rounded-md border border-green-200 bg-green-50/60 p-3 text-sm dark:border-green-900/40 dark:bg-green-950/20">
                        <div className="text-muted-foreground text-xs uppercase">
                          Confirmed Schedule
                        </div>
                        <div className="mt-1 flex items-center gap-2 font-medium">
                          <CalendarDays className="h-4 w-4 text-green-600" />
                          {request.confirmedDate
                            ? formatDateWithWeekdayUTC(request.confirmedDate)
                            : "Unknown date"}
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="h-4 w-4 text-green-600" />
                          {formatExactTime(
                            request.confirmedTime?.hour,
                            request.confirmedTime?.minute,
                          )}
                        </div>
                      </div>
                    )}

                    <div className="grid gap-2 text-sm md:grid-cols-2">
                      {request.onSiteContactName && (
                        <div className="rounded-md border p-3">
                          <div className="text-muted-foreground text-xs uppercase">
                            On-site Contact
                          </div>
                          <div className="font-medium">
                            {request.onSiteContactName}
                          </div>
                          {request.onSiteContactPhone && (
                            <div className="text-muted-foreground text-xs">
                              {request.onSiteContactPhone}
                            </div>
                          )}
                        </div>
                      )}
                      <div className="rounded-md border p-3">
                        <div className="text-muted-foreground text-xs uppercase">
                          Preferred Contact
                        </div>
                        <div className="mt-1 flex items-center gap-2 text-sm">
                          {request.preferredContact === "phone" ? (
                            <Phone className="text-muted-foreground h-4 w-4" />
                          ) : (
                            <Mail className="text-muted-foreground h-4 w-4" />
                          )}
                          <span className="capitalize">
                            {request.preferredContact}
                          </span>
                        </div>
                        {request.customContactMethod && (
                          <div className="text-muted-foreground mt-1 text-xs">
                            {request.customContactMethod}
                          </div>
                        )}
                      </div>
                    </div>

                    {(request.specialInstructions ||
                      request.parkingNotes ||
                      request.accessNotes) && (
                      <div className="space-y-2 rounded-md border p-3 text-sm">
                        {request.specialInstructions && (
                          <div>
                            <div className="text-muted-foreground text-xs uppercase">
                              Special Instructions
                            </div>
                            <p>{request.specialInstructions}</p>
                          </div>
                        )}
                        {request.parkingNotes && (
                          <div>
                            <div className="text-muted-foreground text-xs uppercase">
                              Parking Notes
                            </div>
                            <p>{request.parkingNotes}</p>
                          </div>
                        )}
                        {request.accessNotes && (
                          <div>
                            <div className="text-muted-foreground text-xs uppercase">
                              Access Notes
                            </div>
                            <p>{request.accessNotes}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
