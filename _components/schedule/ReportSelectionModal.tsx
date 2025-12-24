"use client";
import { format } from "date-fns";
import { ChevronRight, FileText, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../ui/dialog";
import { ScrollArea } from "../ui/scroll-area";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";

interface ReportSelectionModalProps {
  reports: any[];
  isOpen: boolean;
  onClose: () => void;
  onSelect: (report: any) => void;
}

const ReportSelectionModal = ({
  reports,
  isOpen,
  onClose,
  onSelect,
}: ReportSelectionModalProps) => {
  const formatDate = (dateString: string | Date) => {
    try {
      const date = new Date(dateString);
      return format(date, "MMM dd, yyyy");
    } catch {
      return "Unknown Date";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex max-h-[80vh] w-full max-w-2xl flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="shrink-0 space-y-1 border-b p-6">
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="text-primary h-5 w-5" />
            Auto-fill from Previous Reports
          </DialogTitle>
          <DialogDescription>
            Select a previous report to copy its settings and equipment details
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="min-h-0 flex-1">
          <div className="p-6">
            {reports.length === 0 ? (
              <div className="py-8 text-center">
                <div className="bg-muted mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
                  <FileText className="text-muted-foreground h-8 w-8" />
                </div>
                <p className="text-foreground mb-2 text-lg font-medium">
                  No Previous Reports Found
                </p>
                <p className="text-muted-foreground">
                  This client doesn&apos;t have any previous reports to
                  auto-fill from.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {reports.map((report) => (
                  <Card
                    key={report._id}
                    className="hover:border-primary/50 hover:bg-accent/50 cursor-pointer gap-0 py-0 transition-all duration-200"
                    onClick={() => onSelect(report)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="mb-2 flex items-center gap-3">
                            <h4 className="text-foreground truncate font-medium">
                              {report.jobTitle || "Service Report"}
                            </h4>
                            <Badge variant="secondary" className="shrink-0">
                              {formatDate(report.dateCompleted)}
                            </Badge>
                          </div>

                          <p className="text-muted-foreground mb-3 text-sm">
                            📍 {report.location || "Location not specified"}
                          </p>

                          <div className="text-muted-foreground grid grid-cols-2 gap-4 text-xs">
                            <div>
                              <span className="font-medium">Fuel Type:</span>{" "}
                              {report.fuelType || "Not specified"}
                            </div>
                            <div>
                              <span className="font-medium">
                                Cooking Volume:
                              </span>{" "}
                              {report.cookingVolume || "Not specified"}
                            </div>
                            <div>
                              <span className="font-medium">Hood Type:</span>{" "}
                              {report.equipmentDetails?.hoodType ||
                                "Not specified"}
                            </div>
                            <div>
                              <span className="font-medium">Filter Type:</span>{" "}
                              {report.equipmentDetails?.filterType ||
                                "Not specified"}
                            </div>
                          </div>

                          {report.recommendedCleaningFrequency && (
                            <div className="text-success mt-2 text-xs">
                              <span className="font-medium">
                                Cleaning Frequency:
                              </span>{" "}
                              {report.recommendedCleaningFrequency}x per year
                            </div>
                          )}
                        </div>

                        <div className="ml-4 shrink-0">
                          <div className="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-full">
                            <ChevronRight className="text-primary h-4 w-4" />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="shrink-0 border-t p-6">
          <div className="flex w-full items-center justify-between">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <p className="text-muted-foreground flex items-center text-xs">
              💡 Selected report data will auto-fill the form fields
            </p>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReportSelectionModal;
