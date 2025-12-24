"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { DueInvoiceType } from "../../app/lib/typeDefinitions";
import { updateScheduleStatus } from "../../app/lib/dashboard.data";
import { formatDate } from "../../app/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { ScrollArea } from "../ui/scroll-area";
import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { Loader2 } from "lucide-react";

interface ScheduledJobsBoxProps {
  scheduledCount: number;
  unscheduledCount: number;
  scheduledInvoices: DueInvoiceType[];
}

const ScheduledJobsBox = ({
  scheduledCount,
  unscheduledCount,
  scheduledInvoices,
}: ScheduledJobsBoxProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const router = useRouter();

  const handleResetScheduleStatus = async (invoiceId: string) => {
    setProcessingId(invoiceId);
    try {
      const boundUpdateScheduleStatus = updateScheduleStatus.bind(
        null,
        invoiceId,
      );
      await boundUpdateScheduleStatus(false);
      toast.success("Schedule status reset successfully");
      router.refresh();
    } catch (error) {
      console.error("Error resetting schedule status:", error);
      toast.error("Failed to reset schedule status");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <>
      <div className="flex gap-2">
        <Card
          className="hover:bg-muted/50 flex-1 cursor-pointer gap-0 py-0 transition-colors"
          onClick={() => setIsModalOpen(true)}
        >
          <CardContent className="flex items-center justify-between gap-2 p-3">
            <p className="text-muted-foreground text-xs">Scheduled</p>
            <Badge
              variant="default"
              className="bg-green-600 hover:bg-green-700"
            >
              {scheduledCount}
            </Badge>
          </CardContent>
        </Card>
        <Card className="flex-1 gap-0 py-0">
          <CardContent className="flex items-center justify-between gap-2 p-3">
            <p className="text-muted-foreground text-xs">Unscheduled</p>
            <Badge variant="destructive">{unscheduledCount}</Badge>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Scheduled Jobs</DialogTitle>
            <DialogDescription>
              Manage scheduled jobs and reset their status if needed
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[50vh]">
            {scheduledInvoices.length === 0 ? (
              <div className="text-muted-foreground py-8 text-center text-sm">
                No scheduled jobs found
              </div>
            ) : (
              <div className="divide-border space-y-2 divide-y">
                {scheduledInvoices.map((job) => (
                  <div
                    key={job.invoiceId}
                    className="flex items-center justify-between py-3"
                  >
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <span className="text-foreground truncate font-medium">
                        {job.jobTitle}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        Due: {formatDate(job.dateDue.toString().split("T")[0])}
                      </span>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleResetScheduleStatus(job.invoiceId)}
                      disabled={processingId === job.invoiceId}
                    >
                      {processingId === job.invoiceId ? (
                        <>
                          <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                          Resetting...
                        </>
                      ) : (
                        "Reset"
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ScheduledJobsBox;
