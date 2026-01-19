"use client";

import { useState } from "react";
import {
  SchedulingRequestType,
  RequestedTime,
} from "../../app/lib/typeDefinitions";
import {
  confirmSchedulingRequest,
  sendSchedulingAlternatives,
} from "../../app/lib/actions/autoScheduling.actions";
import { formatDateWithWeekdayUTC } from "../../app/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  CheckCircleIcon,
  ClockIcon,
  MapPinIcon,
  PhoneIcon,
  UserIcon,
  CalendarIcon,
} from "@heroicons/react/24/outline";

interface SchedulingReviewModalProps {
  request: SchedulingRequestType;
  onClose: () => void;
  isOpen?: boolean;
}

// Format exact time for display
const formatTime = (time: RequestedTime): string => {
  const period = time.hour >= 12 ? "PM" : "AM";
  const displayHour = time.hour % 12 || 12;
  return `${displayHour}:${time.minute.toString().padStart(2, "0")} ${period}`;
};

// Time options for select
const TIME_OPTIONS = [
  { value: "7", label: "7:00 AM" },
  { value: "8", label: "8:00 AM" },
  { value: "9", label: "9:00 AM" },
  { value: "10", label: "10:00 AM" },
  { value: "11", label: "11:00 AM" },
  { value: "12", label: "12:00 PM" },
  { value: "13", label: "1:00 PM" },
  { value: "14", label: "2:00 PM" },
  { value: "15", label: "3:00 PM" },
  { value: "16", label: "4:00 PM" },
];

export default function SchedulingReviewModal({
  request,
  onClose,
  isOpen = true,
}: SchedulingReviewModalProps) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [showAlternatives, setShowAlternatives] = useState(false);
  const [alternatives, setAlternatives] = useState<
    Array<{ date: string; requestedTime: RequestedTime }>
  >([
    { date: "", requestedTime: { hour: 9, minute: 0 } },
    { date: "", requestedTime: { hour: 9, minute: 0 } },
  ]);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const clientName = (request.clientId as any)?.clientName || "Unknown Client";
  const clientEmail = (request.clientId as any)?.email || "";
  const clientPhone = (request.clientId as any)?.phoneNumber || "";
  const jobTitle = (request.invoiceId as any)?.jobTitle || "Unknown Job";
  const location = (request.invoiceId as any)?.location || "";

  const handleConfirm = async (selection: "primary" | "backup") => {
    setIsConfirming(true);
    setError(null);

    const selectedTime =
      selection === "primary"
        ? request.primarySelection
        : request.backupSelection;

    try {
      const result = await confirmSchedulingRequest(
        request._id!.toString(),
        selectedTime.date as string,
        selectedTime.requestedTime,
        notes || undefined,
      );

      if (result.success) {
        onClose();
      } else {
        setError(result.error || "Failed to confirm request");
      }
    } catch {
      setError("An error occurred while confirming");
    } finally {
      setIsConfirming(false);
    }
  };

  const handleSendAlternatives = async () => {
    const validAlternatives = alternatives.filter((alt) => alt.date);
    if (validAlternatives.length === 0) {
      setError("Please select at least one alternative date");
      return;
    }

    setIsConfirming(true);
    setError(null);

    try {
      const result = await sendSchedulingAlternatives(
        request._id!.toString(),
        validAlternatives,
        notes || undefined,
      );

      if (result.success) {
        onClose();
      } else {
        setError(result.error || "Failed to send alternatives");
      }
    } catch {
      setError("An error occurred while sending alternatives");
    } finally {
      setIsConfirming(false);
    }
  };

  const updateAlternativeDate = (index: number, date: string) => {
    const newAlts = [...alternatives];
    const currentAlt = newAlts[index];
    if (currentAlt) {
      newAlts[index] = { ...currentAlt, date };
      setAlternatives(newAlts);
    }
  };

  const updateAlternativeTime = (index: number, hour: string) => {
    const newAlts = [...alternatives];
    const currentAlt = newAlts[index];
    if (currentAlt) {
      newAlts[index] = {
        ...currentAlt,
        requestedTime: { hour: parseInt(hour), minute: 0 },
      };
      setAlternatives(newAlts);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Review Scheduling Request
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Client & Job Info Grid */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Client Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
                  <UserIcon className="h-4 w-4" />
                  Client
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                <p className="text-foreground font-medium">{clientName}</p>
                {clientEmail && (
                  <p className="text-muted-foreground text-sm">{clientEmail}</p>
                )}
                {clientPhone && (
                  <p className="text-muted-foreground text-sm">{clientPhone}</p>
                )}
              </CardContent>
            </Card>

            {/* Job Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
                  <MapPinIcon className="h-4 w-4" />
                  Job
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                <p className="text-foreground font-medium">{jobTitle}</p>
                {location && (
                  <p className="text-muted-foreground text-sm">{location}</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* On-Site Contact Card - Dedicated Section */}
          {(request.onSiteContactName || request.onSiteContactPhone) && (
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-medium">
                  <PhoneIcon className="h-4 w-4" />
                  On-Site Contact
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  {request.onSiteContactName && (
                    <div>
                      <p className="text-muted-foreground text-xs">Name</p>
                      <p className="text-foreground font-medium">
                        {request.onSiteContactName}
                      </p>
                    </div>
                  )}
                  {request.onSiteContactPhone && (
                    <div>
                      <p className="text-muted-foreground text-xs">Phone</p>
                      <p className="text-foreground font-medium">
                        {request.onSiteContactPhone}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-muted-foreground text-xs">
                      Contact Preference
                    </p>
                    <p className="text-foreground font-medium capitalize">
                      {request.preferredContact === "other"
                        ? request.customContactMethod || "Other"
                        : request.preferredContact}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Requested Times */}
          <div>
            <h3 className="text-foreground mb-3 flex items-center gap-2 text-sm font-medium">
              <ClockIcon className="h-4 w-4" />
              Requested Times
            </h3>
            <div className="space-y-3">
              {/* Primary Selection */}
              <div className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950/30">
                <div>
                  <span className="text-xs font-medium text-green-700 uppercase dark:text-green-400">
                    First Choice
                  </span>
                  <p className="text-foreground font-medium">
                    {formatDateWithWeekdayUTC(request.primarySelection.date)}
                  </p>
                  <p className="text-muted-foreground text-sm">
                    {formatTime(request.primarySelection.requestedTime)}
                  </p>
                </div>
                <Button
                  onClick={() => handleConfirm("primary")}
                  disabled={isConfirming}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircleIcon className="mr-2 h-4 w-4" />
                  Confirm
                </Button>
              </div>

              {/* Backup Selection */}
              <div className="bg-muted/50 flex items-center justify-between rounded-lg border p-4">
                <div>
                  <span className="text-muted-foreground text-xs font-medium uppercase">
                    Backup
                  </span>
                  <p className="text-foreground font-medium">
                    {formatDateWithWeekdayUTC(request.backupSelection.date)}
                  </p>
                  <p className="text-muted-foreground text-sm">
                    {formatTime(request.backupSelection.requestedTime)}
                  </p>
                </div>
                <Button
                  variant="secondary"
                  onClick={() => handleConfirm("backup")}
                  disabled={isConfirming}
                >
                  <CheckCircleIcon className="mr-2 h-4 w-4" />
                  Confirm
                </Button>
              </div>
            </div>
          </div>

          {/* Client Notes */}
          {(request.parkingNotes ||
            request.accessNotes ||
            request.specialInstructions) && (
            <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Client Notes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {request.parkingNotes && (
                  <p>
                    <span className="font-medium">Parking:</span>{" "}
                    {request.parkingNotes}
                  </p>
                )}
                {request.accessNotes && (
                  <p>
                    <span className="font-medium">Access:</span>{" "}
                    {request.accessNotes}
                  </p>
                )}
                {request.specialInstructions && (
                  <p>
                    <span className="font-medium">Instructions:</span>{" "}
                    {request.specialInstructions}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Send Alternatives Section */}
          <div className="border-t pt-4">
            {!showAlternatives ? (
              <Button
                variant="link"
                onClick={() => setShowAlternatives(true)}
                className="h-auto p-0 text-blue-600"
              >
                Neither time works? Send alternatives →
              </Button>
            ) : (
              <div className="space-y-4">
                <h3 className="text-foreground text-sm font-medium">
                  Send Alternative Times
                </h3>
                <p className="text-muted-foreground text-sm">
                  Suggest up to 2 alternatives if neither choice works.
                </p>

                {alternatives.map((alt, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <span className="text-muted-foreground w-16 text-sm">
                      Alt {index + 1}:
                    </span>
                    <Input
                      type="date"
                      value={alt.date}
                      onChange={(e) =>
                        updateAlternativeDate(index, e.target.value)
                      }
                      className="w-auto"
                    />
                    <Select
                      value={alt.requestedTime.hour.toString()}
                      onValueChange={(value) =>
                        updateAlternativeTime(index, value)
                      }
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TIME_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}

                <div className="flex gap-2">
                  <Button
                    onClick={handleSendAlternatives}
                    disabled={isConfirming}
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    Send Alternatives to Client
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setShowAlternatives(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Internal Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Internal Notes (optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about this decision..."
              rows={2}
            />
          </div>

          {/* Error Alert */}
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-950/30">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
