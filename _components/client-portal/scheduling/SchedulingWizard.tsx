"use client";

import { useState, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DueInvoiceType,
  ClientType,
  InvoiceType,
  ClientSchedulingPattern,
  DayAvailability,
  TimeSelection,
  RequestedTime,
} from "../../../app/lib/typeDefinitions";
import {
  createSchedulingRequest,
  refreshAvailabilityAction,
} from "../../../app/lib/actions/autoScheduling.actions";
import { formatDateWithWeekdayUTC } from "../../../app/lib/utils";
import ConfirmationForm, { ConfirmationDetails } from "./ConfirmationForm";
import SubmissionSuccess from "./SubmissionSuccess";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Button } from "../../ui/button";
import { Progress } from "../../ui/progress";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../ui/dialog";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CalendarIcon,
} from "@heroicons/react/24/outline";

interface SchedulingWizardProps {
  token: string;
  jobsDueSoon: DueInvoiceType;
  client: ClientType;
  invoice: InvoiceType;
  pattern?: ClientSchedulingPattern;
  availableDays: DayAvailability[];
}

type WizardStep = "select" | "confirmation" | "review" | "success";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface CalendarDateParts {
  year: number;
  month: number;
  day: number;
}

interface DueBannerState {
  title: "SERVICE DUE" | "SERVICE DUE SOON" | "SERVICE OVERDUE";
  subtitle: string;
  containerClassName: string;
  titleClassName: string;
  dateClassName: string;
}

const parseDateInputToParts = (
  dateInput: string | Date | null | undefined,
): CalendarDateParts | null => {
  if (!dateInput) return null;

  const dateStr =
    dateInput instanceof Date ? dateInput.toISOString() : String(dateInput);
  const datePart = dateStr.split("T")[0] || dateStr;
  const [yearStr, monthStr, dayStr] = datePart.split("-");

  if (!yearStr || !monthStr || !dayStr) return null;

  const year = Number.parseInt(yearStr, 10);
  const month = Number.parseInt(monthStr, 10);
  const day = Number.parseInt(dayStr, 10);

  const hasValidParts =
    Number.isFinite(year) &&
    Number.isFinite(month) &&
    Number.isFinite(day) &&
    month >= 1 &&
    month <= 12 &&
    day >= 1 &&
    day <= 31;

  if (!hasValidParts) return null;

  const localDate = new Date(year, month - 1, day);
  if (
    Number.isNaN(localDate.getTime()) ||
    localDate.getFullYear() !== year ||
    localDate.getMonth() !== month - 1 ||
    localDate.getDate() !== day
  ) {
    return null;
  }

  return { year, month, day };
};

const toYmd = (parts: CalendarDateParts): string =>
  `${String(parts.year).padStart(4, "0")}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;

const getUtcDayNumber = (parts: CalendarDateParts): number =>
  Math.floor(Date.UTC(parts.year, parts.month - 1, parts.day) / 86_400_000);

// Helper to format exact time
const formatExactTime = (hour: number, minute: number): string => {
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  const displayMinute = minute.toString().padStart(2, "0");
  return `${displayHour}:${displayMinute} ${period}`;
};

// Helper to format time with ±15 min note
const formatTimeWithVariance = (hour: number, minute: number): string => {
  return `${formatExactTime(hour, minute)} ±15 min`;
};

// Animation variants
const fadeInVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

const pageVariants = {
  initial: { opacity: 0, x: 50 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -50 },
};

const pageTransition = {
  type: "tween",
  ease: "easeInOut",
  duration: 0.3,
};

export default function SchedulingWizard({
  token,
  jobsDueSoon,
  client,
  invoice,
  pattern,
  availableDays: initialAvailableDays,
}: SchedulingWizardProps) {
  const [step, setStep] = useState<WizardStep>("select");
  const [primarySelection, setPrimarySelection] =
    useState<TimeSelection | null>(null);
  const [backupSelection, setBackupSelection] = useState<TimeSelection | null>(
    null,
  );
  const [isSelectingBackup, setIsSelectingBackup] = useState(false);
  const [isReselectingPrimary, setIsReselectingPrimary] = useState(false);
  const [usedSuggestion, setUsedSuggestion] = useState<{
    dayOfWeek: number;
  } | null>(null);
  const [availableDays, setAvailableDays] =
    useState<DayAvailability[]>(initialAvailableDays);
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);
  const [confirmationDetails, setConfirmationDetails] =
    useState<ConfirmationDetails | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const dueDateParts = useMemo(
    () => parseDateInputToParts(jobsDueSoon.dateDue),
    [jobsDueSoon.dateDue],
  );
  const dueDateYmd = useMemo(
    () => (dueDateParts ? toYmd(dueDateParts) : ""),
    [dueDateParts],
  );
  const dueDateDisplay = useMemo(
    () => (dueDateYmd ? formatDateWithWeekdayUTC(dueDateYmd) : ""),
    [dueDateYmd],
  );
  const todayYmd = useMemo(() => {
    const now = new Date();
    return toYmd({
      year: now.getFullYear(),
      month: now.getMonth() + 1,
      day: now.getDate(),
    });
  }, []);

  const dueBannerState = useMemo<DueBannerState | null>(() => {
    if (!dueDateParts || !dueDateDisplay) return null;
    const todayParts = parseDateInputToParts(todayYmd);
    if (!todayParts) return null;

    const dueDayNumber = getUtcDayNumber(dueDateParts);
    const todayDayNumber = getUtcDayNumber(todayParts);
    const daysPastDue = todayDayNumber - dueDayNumber;
    const daysUntilDue = dueDayNumber - todayDayNumber;
    const dayLabel = daysPastDue === 1 || daysUntilDue === 1 ? "day" : "days";

    if (daysPastDue > 7) {
      return {
        title: "SERVICE OVERDUE",
        subtitle: `${daysPastDue} ${dayLabel} overdue`,
        containerClassName:
          "rounded-md border border-red-300 bg-red-50 px-3 py-2 lg:min-w-[290px] dark:border-red-900/50 dark:bg-red-950/20",
        titleClassName:
          "text-xs font-medium tracking-wide text-red-700 dark:text-red-300",
        dateClassName: "text-sm font-semibold text-red-800 dark:text-red-200",
      };
    }

    if (daysPastDue > 0) {
      return {
        title: "SERVICE OVERDUE",
        subtitle: `${daysPastDue} ${dayLabel} overdue`,
        containerClassName:
          "rounded-md border border-amber-300 bg-amber-50 px-3 py-2 lg:min-w-[290px] dark:border-amber-900/50 dark:bg-amber-950/20",
        titleClassName:
          "text-xs font-medium tracking-wide text-amber-700 dark:text-amber-300",
        dateClassName:
          "text-sm font-semibold text-amber-800 dark:text-amber-200",
      };
    }

    if (daysUntilDue <= 7) {
      return {
        title: "SERVICE DUE SOON",
        subtitle:
          daysUntilDue === 0
            ? "Due today"
            : `Due in ${daysUntilDue} ${dayLabel}`,
        containerClassName:
          "rounded-md border border-amber-300 bg-amber-50 px-3 py-2 lg:min-w-[290px] dark:border-amber-900/50 dark:bg-amber-950/20",
        titleClassName:
          "text-xs font-medium tracking-wide text-amber-700 dark:text-amber-300",
        dateClassName:
          "text-sm font-semibold text-amber-800 dark:text-amber-200",
      };
    }

    return {
      title: "SERVICE DUE",
      subtitle: "On schedule",
      containerClassName:
        "rounded-md border border-blue-200 bg-blue-50 px-3 py-2 lg:min-w-[290px] dark:border-blue-900/50 dark:bg-blue-950/20",
      titleClassName:
        "text-xs font-medium tracking-wide text-blue-700 dark:text-blue-300",
      dateClassName: "text-sm font-semibold text-blue-800 dark:text-blue-200",
    };
  }, [dueDateDisplay, dueDateParts, todayYmd]);

  const [currentMonth, setCurrentMonth] = useState(() => {
    const today = new Date();
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const initialDueDateParts = parseDateInputToParts(jobsDueSoon.dateDue);
    if (!initialDueDateParts) {
      return thisMonth;
    }

    const initialDueYmd = toYmd(initialDueDateParts);
    const initialSortedDates = initialAvailableDays
      .map((day) => day.date)
      .sort();
    const initialStart = initialSortedDates[0] || "";
    const initialEnd = initialSortedDates[initialSortedDates.length - 1] || "";

    if (
      initialStart &&
      initialEnd &&
      initialDueYmd >= initialStart &&
      initialDueYmd <= initialEnd
    ) {
      return new Date(
        initialDueDateParts.year,
        initialDueDateParts.month - 1,
        1,
      );
    }

    return thisMonth;
  });

  // Custom time state
  const [customTimeDialogOpen, setCustomTimeDialogOpen] = useState(false);
  const [customHour, setCustomHour] = useState(pattern?.usualTime?.hour ?? 9);
  const [customMinute, setCustomMinute] = useState(
    pattern?.usualTime?.minute ?? 0,
  );
  const [useCustomTime, setUseCustomTime] = useState(false);
  const [timePickerStep, setTimePickerStep] = useState<"hour" | "minute">(
    "hour",
  );
  const [pendingHour, setPendingHour] = useState<number | null>(null);
  const latestRefreshRequestId = useRef(0);

  // Get estimated hours from invoice (default to 4)
  const estimatedHours = (invoice as any).estimatedHours || 4;

  // Get the current scheduling time (either custom or usual from pattern)
  const currentSchedulingTime = useMemo(() => {
    if (useCustomTime) {
      return { hour: customHour, minute: customMinute };
    }
    return pattern?.usualTime ?? { hour: 9, minute: 0 };
  }, [useCustomTime, customHour, customMinute, pattern?.usualTime]);

  // Create availability map for quick lookup
  const availabilityMap = useMemo(() => {
    const map: Record<string, DayAvailability> = {};
    for (const day of availableDays) {
      map[day.date] = day;
    }
    return map;
  }, [availableDays]);

  const availabilityRange = useMemo(() => {
    if (availableDays.length === 0) return null;
    const sortedDates = availableDays.map((day) => day.date).sort();
    const start = sortedDates[0] || "";
    const end = sortedDates[sortedDates.length - 1] || "";
    if (!start || !end) return null;
    return { start, end };
  }, [availableDays]);

  // Get max available date for "contact us" message
  const maxAvailableDate = useMemo(() => {
    return availabilityRange?.end || null;
  }, [availabilityRange]);

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPadding = firstDay.getDay();

    const days: Array<{
      date: Date | null;
      dateStr: string;
      isCurrentMonth: boolean;
      isToday: boolean;
      isPast: boolean;
      isFridayOrSaturday: boolean;
      availability: DayAvailability | null;
    }> = [];

    for (let i = 0; i < startPadding; i++) {
      days.push({
        date: null,
        dateStr: "",
        isCurrentMonth: false,
        isToday: false,
        isPast: true,
        isFridayOrSaturday: false,
        availability: null,
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(year, month, day);
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const isPast = date < today;
      const dayOfWeek = date.getDay();
      const isFridayOrSaturday = dayOfWeek === 5 || dayOfWeek === 6;

      days.push({
        date,
        dateStr,
        isCurrentMonth: true,
        isToday: date.getTime() === today.getTime(),
        isPast,
        isFridayOrSaturday,
        availability: availabilityMap[dateStr] || null,
      });
    }

    return days;
  }, [currentMonth, availabilityMap]);

  // Check if day has availability
  const dayHasAvailability = (
    availability: DayAvailability | null,
  ): boolean => {
    if (!availability) return false;
    return availability.available;
  };

  const getDueDateRelationInfo = useCallback(
    (selectedDate: string | Date) => {
      if (!dueDateYmd) return null;

      const selectedParts = parseDateInputToParts(selectedDate);
      if (!selectedParts) return null;
      const selectedYmd = toYmd(selectedParts);

      if (selectedYmd < dueDateYmd) {
        return {
          label: "Selected date is before due date",
          className: "text-amber-700 dark:text-amber-400",
        };
      }
      if (selectedYmd > dueDateYmd) {
        return {
          label: "Selected date is after due date",
          className: "text-blue-700 dark:text-blue-400",
        };
      }
      return {
        label: "Selected date is on due date",
        className: "text-emerald-700 dark:text-emerald-400",
      };
    },
    [dueDateYmd],
  );

  // Handle date selection - uses current scheduling time
  const handleDateSelect = (dateStr: string) => {
    const selection: TimeSelection = {
      date: dateStr,
      requestedTime: currentSchedulingTime,
    };

    if (isReselectingPrimary) {
      // Reselecting primary - keep backup
      setPrimarySelection(selection);
      setIsReselectingPrimary(false);
    } else if (!isSelectingBackup) {
      setPrimarySelection(selection);
      setIsSelectingBackup(true);
    } else {
      setBackupSelection(selection);
    }
  };

  // Handle proceeding to confirmation step
  const handleProceedToConfirmation = () => {
    if (primarySelection && backupSelection) {
      setStep("confirmation");
    }
  };

  // Handle confirmation form submission
  const handleConfirmationSubmit = useCallback(
    (details: ConfirmationDetails) => {
      setConfirmationDetails(details);
      setStep("review");
    },
    [],
  );

  // Handle final submission
  const handleSubmit = useCallback(async () => {
    if (!primarySelection || !backupSelection || !confirmationDetails) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const result = await createSchedulingRequest({
        token,
        primarySelection: {
          date: primarySelection.date as string,
          requestedTime: primarySelection.requestedTime,
        },
        backupSelection: {
          date: backupSelection.date as string,
          requestedTime: backupSelection.requestedTime,
        },
        confirmationDetails: {
          addressConfirmed: confirmationDetails.addressConfirmed,
          specialInstructions: confirmationDetails.specialInstructions,
          preferredContact: confirmationDetails.preferredContact,
          customContactMethod: confirmationDetails.customContactMethod,
          onSiteContactName: confirmationDetails.onSiteContactName,
          onSiteContactPhone: confirmationDetails.onSiteContactPhone,
        },
        usedSuggestion: usedSuggestion || undefined,
      });

      if (result.success) {
        setStep("success");
      } else {
        setSubmitError(result.error || "Failed to submit request");
      }
    } catch (error) {
      setSubmitError("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }, [
    token,
    primarySelection,
    backupSelection,
    confirmationDetails,
    usedSuggestion,
  ]);

  // Navigation handlers
  const handleBack = useCallback(() => {
    switch (step) {
      case "confirmation":
        setStep("select");
        break;
      case "review":
        setStep("confirmation");
        break;
    }
  }, [step]);

  // Go back to selection from confirmation, saving form values
  const handleBackToSelection = (
    currentFormValues?: Partial<ConfirmationDetails>,
  ) => {
    if (currentFormValues) {
      setConfirmationDetails(currentFormValues as ConfirmationDetails);
    }
    setStep("select");
  };

  // Clear selections
  const handleClearPrimary = () => {
    setPrimarySelection(null);
    setIsReselectingPrimary(true);
    // Keep backup selection
  };

  const handleClearBackup = () => {
    setBackupSelection(null);
  };

  // Format date for display
  const formatDate = (dateStr: string | Date): string =>
    formatDateWithWeekdayUTC(dateStr);

  // Get step progress
  const getStepProgress = () => {
    switch (step) {
      case "select":
        return 33;
      case "confirmation":
        return 66;
      case "review":
        return 100;
      default:
        return 100;
    }
  };

  // Handle custom time dialog save - refetch availability for new time
  const handleSaveCustomTime = async () => {
    setCustomTimeDialogOpen(false);
    setUseCustomTime(true);
    // Reset selections when time changes since they were based on old time
    setPrimarySelection(null);
    setBackupSelection(null);
    setIsSelectingBackup(false);

    // Refetch availability for the new custom time
    setIsLoadingAvailability(true);
    try {
      const newAvailability = await refreshAvailabilityAction(
        token,
        { hour: customHour, minute: customMinute },
        estimatedHours,
      );
      setAvailableDays(newAvailability);
    } catch (error) {
      console.error("Failed to refresh availability:", error);
    } finally {
      setIsLoadingAvailability(false);
    }
  };

  // Handle reverting to usual time - refetch availability for usual time
  const handleUseUsualTime = async () => {
    setUseCustomTime(false);
    // Reset selections when time changes
    setPrimarySelection(null);
    setBackupSelection(null);
    setIsSelectingBackup(false);

    // Refetch availability for the usual time
    const usualTime = pattern?.usualTime ?? { hour: 9, minute: 0 };
    setIsLoadingAvailability(true);
    try {
      const newAvailability = await refreshAvailabilityAction(
        token,
        usualTime,
        estimatedHours,
      );
      setAvailableDays(newAvailability);
    } catch (error) {
      console.error("Failed to refresh availability:", error);
    } finally {
      setIsLoadingAvailability(false);
    }
  };

  const handleTimeChange = useCallback(
    async (value: string) => {
      const [h, m] = value.split(":").map(Number);
      const newHour = h ?? 9;
      const newMinute = m ?? 0;
      setCustomHour(newHour);
      setCustomMinute(newMinute);
      setUseCustomTime(true);

      // Reset selections and refetch availability
      setPrimarySelection(null);
      setBackupSelection(null);
      setIsSelectingBackup(false);
      setIsLoadingAvailability(true);
      const requestId = ++latestRefreshRequestId.current;
      try {
        const newAvailability = await refreshAvailabilityAction(
          token,
          { hour: newHour, minute: newMinute },
          estimatedHours,
        );
        if (latestRefreshRequestId.current === requestId) {
          setAvailableDays(newAvailability);
        }
      } catch (error) {
        console.error("Error refreshing availability:", error);
      } finally {
        if (latestRefreshRequestId.current === requestId) {
          setIsLoadingAvailability(false);
        }
      }
    },
    [estimatedHours, token],
  );

  const handleOpenTimePicker = () => {
    setPendingHour(currentSchedulingTime.hour);
    setTimePickerStep("hour");
    setCustomTimeDialogOpen(true);
  };

  const handleSelectHour = (hour: number) => {
    setPendingHour(hour);
    setTimePickerStep("minute");
  };

  const handleSelectMinute = async (minute: number) => {
    const hour = pendingHour ?? currentSchedulingTime.hour;
    const value = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
    await handleTimeChange(value);
    setCustomTimeDialogOpen(false);
  };

  return (
    <Card className="mx-auto min-h-[500px] w-full max-w-5xl gap-0 overflow-hidden rounded-xl py-0 lg:min-h-[600px]">
      {/* Header with Job Info */}
      {step !== "success" && (
        <CardHeader className="bg-muted/50 pt-4 pb-4">
          {/* Top row: Navigation, Title, Step indicator */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {step !== "select" && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleBack}
                  className="h-8 w-8"
                >
                  <ChevronLeftIcon className="h-4 w-4" />
                </Button>
              )}
              <div>
                <CardTitle className="text-base sm:text-lg">
                  {step === "select"
                    ? isSelectingBackup
                      ? "Select Backup Date"
                      : "Select Primary Date"
                    : step === "confirmation"
                      ? "Confirm Details"
                      : "Review & Submit"}
                </CardTitle>
                {/* Job info inline - more visible */}
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="text-foreground text-sm font-medium">
                    {invoice.jobTitle}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    Est. {estimatedHours} hours
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {invoice.location}
                  </span>
                </div>
              </div>
            </div>
            <span className="text-muted-foreground text-xs sm:text-sm">
              Step{" "}
              {step === "select" ? "1" : step === "confirmation" ? "2" : "3"} of
              3
            </span>
          </div>
          <Progress value={getStepProgress()} className="mt-3 h-2" />
        </CardHeader>
      )}

      {/* Step Content */}
      <CardContent className="p-0">
        <AnimatePresence mode="wait">
          {/* Date/Time Selection Step */}
          {step === "select" && (
            <motion.div
              key="select"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={pageTransition}
            >
              {/* Time Banner - Always visible */}
              <motion.div
                variants={fadeInVariants}
                initial="hidden"
                animate="visible"
                className="from-primary/10 to-primary/5 border-b bg-gradient-to-r px-4 py-3 sm:px-6"
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-foreground font-medium">
                        {useCustomTime ? "Custom time" : "Your usual time is"}
                      </p>
                      <span className="text-primary bg-primary/10 rounded px-2 py-0.5 text-xs font-medium">
                        Tap time to edit
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleOpenTimePicker}
                        title="Change your preferred time"
                        aria-label="Change your preferred time"
                        className="bg-background text-primary hover:text-primary focus:ring-primary h-9 px-3 text-base font-semibold"
                      >
                        {formatExactTime(
                          currentSchedulingTime.hour,
                          currentSchedulingTime.minute,
                        )}
                      </Button>
                      <span className="text-muted-foreground text-sm">
                        (±15 min)
                      </span>
                      {useCustomTime && pattern?.usualTime && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleUseUsualTime}
                          className="ml-auto sm:ml-2"
                        >
                          Reset to usual
                        </Button>
                      )}
                    </div>
                  </div>

                  {dueDateDisplay && dueBannerState && (
                    <div className={dueBannerState.containerClassName}>
                      <p className={dueBannerState.titleClassName}>
                        {dueBannerState.title}
                      </p>
                      <p className={dueBannerState.dateClassName}>
                        {dueDateDisplay}
                      </p>
                      <p
                        className={`mt-0.5 text-xs ${dueBannerState.titleClassName}`}
                      >
                        {dueBannerState.subtitle}
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>

              <Dialog
                open={customTimeDialogOpen}
                onOpenChange={setCustomTimeDialogOpen}
              >
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Select a time</DialogTitle>
                    <DialogDescription>
                      Choose an hour, then select a 30-minute interval.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    {timePickerStep === "hour" ? (
                      <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                        {Array.from({ length: 24 }, (_, hour) => (
                          <Button
                            key={hour}
                            type="button"
                            variant={
                              pendingHour === hour ? "default" : "outline"
                            }
                            onClick={() => handleSelectHour(hour)}
                            className="h-10"
                          >
                            {formatExactTime(hour, 0).replace(":00 ", " ")}
                          </Button>
                        ))}
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        {[0, 30].map((minute) => (
                          <Button
                            key={minute}
                            type="button"
                            variant="outline"
                            onClick={() => handleSelectMinute(minute)}
                            className="h-12 text-base font-semibold"
                          >
                            {formatExactTime(
                              pendingHour ?? currentSchedulingTime.hour,
                              minute,
                            )}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                  <DialogFooter className="gap-2 sm:gap-3">
                    {timePickerStep === "minute" && (
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setTimePickerStep("hour")}
                      >
                        Back to hours
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setCustomTimeDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <div className="flex flex-col lg:min-h-[450px] lg:flex-row">
                {/* Calendar Section */}
                <div className="flex-1 border-b p-4 sm:p-6 lg:border-r lg:border-b-0">
                  {/* Calendar Header */}
                  <div className="mb-4 flex items-center justify-between">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        setCurrentMonth(
                          (prev) =>
                            new Date(
                              prev.getFullYear(),
                              prev.getMonth() - 1,
                              1,
                            ),
                        )
                      }
                    >
                      <ChevronLeftIcon className="h-5 w-5" />
                    </Button>
                    <h3 className="text-foreground text-base font-semibold sm:text-lg">
                      {MONTH_NAMES[currentMonth.getMonth()]}{" "}
                      {currentMonth.getFullYear()}
                    </h3>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        setCurrentMonth(
                          (prev) =>
                            new Date(
                              prev.getFullYear(),
                              prev.getMonth() + 1,
                              1,
                            ),
                        )
                      }
                    >
                      <ChevronRightIcon className="h-5 w-5" />
                    </Button>
                  </div>

                  <div className="mb-3 flex flex-wrap items-center justify-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (!dueDateParts) return;
                        setCurrentMonth(
                          new Date(
                            dueDateParts.year,
                            dueDateParts.month - 1,
                            1,
                          ),
                        );
                      }}
                      disabled={!dueDateParts}
                    >
                      Jump to Due Date
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const today = new Date();
                        setCurrentMonth(
                          new Date(today.getFullYear(), today.getMonth(), 1),
                        );
                      }}
                    >
                      Jump to Today
                    </Button>
                  </div>

                  {/* Day Names */}
                  <div className="mb-2 grid grid-cols-7">
                    {DAY_NAMES.map((day) => (
                      <div
                        key={day}
                        className="text-muted-foreground p-1 text-center text-xs font-medium sm:p-2 sm:text-sm"
                      >
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Calendar Grid */}
                  <div className="relative">
                    {/* Loading Overlay */}
                    {isLoadingAvailability && (
                      <div className="bg-background/80 absolute inset-0 z-10 flex items-center justify-center">
                        <div className="text-muted-foreground flex items-center gap-2">
                          <div className="border-primary h-5 w-5 animate-spin rounded-full border-2 border-t-transparent" />
                          <span className="text-sm">
                            Updating availability...
                          </span>
                        </div>
                      </div>
                    )}
                    <div
                      className={`grid grid-cols-7 gap-0.5 sm:gap-1 ${isLoadingAvailability ? "opacity-40" : ""}`}
                    >
                      {calendarDays.map((day, index) => {
                        if (!day.date) {
                          return <div key={index} className="h-10 sm:h-12" />;
                        }

                        const hasAvailability = dayHasAvailability(
                          day.availability,
                        );
                        const hasAvailabilityData = day.availability !== null;
                        const isPrimary =
                          primarySelection?.date === day.dateStr;
                        const isBackup = backupSelection?.date === day.dateStr;
                        const isDueDate = dueDateYmd === day.dateStr;
                        const isToday = day.isToday;
                        const isDueAndToday = isDueDate && isToday;
                        const isOutOfRange = !hasAvailabilityData;
                        const isDisabled =
                          !hasAvailability ||
                          day.isPast ||
                          day.isFridayOrSaturday ||
                          isOutOfRange;

                        // Check if day is booked (has schedule conflict)
                        const isBooked =
                          hasAvailabilityData &&
                          !hasAvailability &&
                          !day.isPast &&
                          !day.isFridayOrSaturday;

                        // Determine conflict reason for tooltip
                        const conflictReason =
                          day.availability?.conflictReason ||
                          (isOutOfRange
                            ? "Date is outside the scheduling range"
                            : undefined) ||
                          (day.isPast
                            ? "Date has passed"
                            : day.isFridayOrSaturday
                              ? "We don't work on Fridays or Saturdays"
                              : undefined);

                        return (
                          <button
                            key={index}
                            onClick={() =>
                              !isDisabled && handleDateSelect(day.dateStr)
                            }
                            disabled={isDisabled}
                            title={conflictReason}
                            className={`relative flex h-10 flex-col items-center justify-center rounded-lg text-sm transition-colors sm:h-12 sm:text-base ${isPrimary ? "bg-primary/20 text-primary ring-primary ring-1" : ""} ${isBackup ? "bg-secondary text-secondary-foreground ring-secondary ring-1" : ""} ${isDueAndToday && !isPrimary && !isBackup ? "ring-1 ring-sky-500/80" : ""} ${isDueDate && !isToday && !isPrimary && !isBackup ? "ring-1 ring-blue-500/70" : ""} ${isToday && !isDueDate && !isPrimary && !isBackup ? "ring-1 ring-emerald-500/70" : ""} ${isToday && !isPrimary && !isBackup ? "text-primary font-bold" : ""} ${isOutOfRange && !isPrimary && !isBackup ? "bg-muted/40 text-muted-foreground/60 cursor-not-allowed" : ""} ${day.isFridayOrSaturday && !isPrimary && !isBackup ? "cursor-not-allowed bg-red-50 text-red-400 dark:bg-red-900/20 dark:text-red-500" : ""} ${isBooked && !isPrimary && !isBackup ? "cursor-not-allowed bg-orange-50 text-orange-400 dark:bg-orange-900/20 dark:text-orange-500" : ""} ${day.isPast && !day.isFridayOrSaturday && !isPrimary && !isBackup ? "text-muted-foreground/40 cursor-not-allowed" : ""} ${!isDisabled && !isPrimary && !isBackup ? "hover:bg-accent text-foreground cursor-pointer" : ""} `}
                          >
                            {day.date.getDate()}
                            {(isDueDate || isToday) && (
                              <span className="absolute top-0.5 left-0.5 flex flex-col gap-0.5">
                                {isDueDate && (
                                  <span className="rounded bg-blue-600 px-1 py-0 text-[9px] leading-3 text-white">
                                    Due
                                  </span>
                                )}
                                {isToday && (
                                  <span className="rounded bg-emerald-600 px-1 py-0 text-[9px] leading-3 text-white">
                                    Today
                                  </span>
                                )}
                              </span>
                            )}
                            {hasAvailability &&
                              !day.isPast &&
                              !day.isFridayOrSaturday &&
                              !isPrimary &&
                              !isBackup && (
                                <span className="bg-primary absolute bottom-1 h-1 w-1 rounded-full sm:h-1.5 sm:w-1.5" />
                              )}
                            {isPrimary && (
                              <span className="bg-primary text-primary-foreground absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full text-[10px]">
                                1
                              </span>
                            )}
                            {isBackup && (
                              <span className="bg-secondary text-secondary-foreground absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full text-[10px]">
                                2
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Calendar Legend */}
                  <div className="text-muted-foreground mt-3 flex flex-wrap justify-center gap-3 text-xs">
                    <div className="flex items-center gap-1">
                      <span className="bg-primary h-2 w-2 rounded-full" />
                      <span>Available</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-orange-400" />
                      <span>Already booked</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-red-400" />
                      <span>Closed (Fri/Sat)</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="rounded bg-emerald-600 px-1 py-0 text-[10px] leading-3 text-white">
                        Today
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="rounded bg-blue-600 px-1 py-0 text-[10px] leading-3 text-white">
                        Due
                      </span>
                    </div>
                  </div>

                  {/* Contact Note */}
                  {maxAvailableDate && (
                    <p className="text-muted-foreground mt-4 text-center text-xs">
                      Need a later date?{" "}
                      <a
                        href="tel:604-273-8717"
                        className="text-primary hover:underline"
                      >
                        Contact us
                      </a>
                    </p>
                  )}
                </div>

                {/* Right Side - Selections Summary */}
                <div className="flex w-full flex-col p-4 sm:p-6 lg:w-80">
                  {/* Empty State - only show when nothing selected and not reselecting */}
                  {!primarySelection &&
                    !backupSelection &&
                    !isReselectingPrimary && (
                      <motion.div
                        variants={fadeInVariants}
                        initial="hidden"
                        animate="visible"
                        className="flex flex-1 flex-col items-center justify-center py-8 text-center lg:py-0"
                      >
                        <CalendarIcon className="text-muted-foreground/50 mb-2 h-8 w-8" />
                        <p className="text-muted-foreground text-sm">
                          Select a date from the calendar
                        </p>
                        <p className="text-muted-foreground mt-1 text-xs">
                          You&apos;ll pick both a primary and backup date
                        </p>
                      </motion.div>
                    )}

                  {/* Selections Summary */}
                  <AnimatePresence>
                    {(primarySelection ||
                      isSelectingBackup ||
                      isReselectingPrimary) && (
                      <motion.div
                        variants={fadeInVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="flex flex-1 flex-col"
                      >
                        <h4 className="text-foreground mb-3 text-sm font-medium">
                          Your Selections
                        </h4>

                        <div className="space-y-3">
                          {/* Primary Selection or Reselecting State */}
                          <AnimatePresence mode="wait">
                            {primarySelection ? (
                              <motion.div
                                key="primary-selected"
                                variants={fadeInVariants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                              >
                                <Card className="border-primary/30 bg-primary/5">
                                  <CardContent className="flex items-center justify-between p-3">
                                    <div>
                                      <p className="text-muted-foreground text-xs font-medium uppercase">
                                        Primary
                                      </p>
                                      <p className="text-foreground font-medium">
                                        {formatDate(primarySelection.date)}
                                      </p>
                                      <p className="text-muted-foreground text-sm">
                                        {formatTimeWithVariance(
                                          currentSchedulingTime.hour,
                                          currentSchedulingTime.minute,
                                        )}
                                      </p>
                                      {(() => {
                                        const relationInfo =
                                          getDueDateRelationInfo(
                                            primarySelection.date,
                                          );
                                        if (!relationInfo) return null;
                                        return (
                                          <p
                                            className={`mt-1 text-xs ${relationInfo.className}`}
                                          >
                                            {relationInfo.label}
                                          </p>
                                        );
                                      })()}
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={handleClearPrimary}
                                    >
                                      Change
                                    </Button>
                                  </CardContent>
                                </Card>
                              </motion.div>
                            ) : isReselectingPrimary ? (
                              <motion.div
                                key="primary-reselecting"
                                variants={fadeInVariants}
                                initial="hidden"
                                animate="visible"
                              >
                                <Card className="border-primary border-dashed">
                                  <CardContent className="p-3 text-center">
                                    <p className="text-muted-foreground text-xs font-medium uppercase">
                                      Primary
                                    </p>
                                    <p className="text-primary mt-1 text-sm font-medium">
                                      Select a new primary date
                                    </p>
                                  </CardContent>
                                </Card>
                              </motion.div>
                            ) : null}
                          </AnimatePresence>

                          {/* Backup Selection - show when selecting backup OR when reselecting primary (backup is preserved) */}
                          {(isSelectingBackup ||
                            (isReselectingPrimary && backupSelection)) && (
                            <AnimatePresence>
                              {backupSelection ? (
                                <motion.div
                                  variants={fadeInVariants}
                                  initial="hidden"
                                  animate="visible"
                                  exit="exit"
                                >
                                  <Card className="border-secondary/30 bg-secondary/5">
                                    <CardContent className="flex items-center justify-between p-3">
                                      <div>
                                        <p className="text-muted-foreground text-xs font-medium uppercase">
                                          Backup
                                        </p>
                                        <p className="text-foreground font-medium">
                                          {formatDate(backupSelection.date)}
                                        </p>
                                        <p className="text-muted-foreground text-sm">
                                          {formatTimeWithVariance(
                                            currentSchedulingTime.hour,
                                            currentSchedulingTime.minute,
                                          )}
                                        </p>
                                        {(() => {
                                          const relationInfo =
                                            getDueDateRelationInfo(
                                              backupSelection.date,
                                            );
                                          if (!relationInfo) return null;
                                          return (
                                            <p
                                              className={`mt-1 text-xs ${relationInfo.className}`}
                                            >
                                              {relationInfo.label}
                                            </p>
                                          );
                                        })()}
                                      </div>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleClearBackup}
                                      >
                                        Change
                                      </Button>
                                    </CardContent>
                                  </Card>
                                </motion.div>
                              ) : !isReselectingPrimary ? (
                                <motion.div
                                  variants={fadeInVariants}
                                  initial="hidden"
                                  animate="visible"
                                >
                                  <Card className="border-dashed">
                                    <CardContent className="text-muted-foreground p-3 text-center text-sm">
                                      Now select a backup date
                                    </CardContent>
                                  </Card>
                                </motion.div>
                              ) : null}
                            </AnimatePresence>
                          )}
                        </div>

                        {/* Next Button - Show when both dates selected */}
                        {primarySelection && backupSelection && (
                          <motion.div
                            variants={fadeInVariants}
                            initial="hidden"
                            animate="visible"
                            className="mt-auto pt-4"
                          >
                            <Button
                              className="w-full"
                              onClick={handleProceedToConfirmation}
                            >
                              Next: Confirm Details
                              <ChevronRightIcon className="ml-2 h-4 w-4" />
                            </Button>
                          </motion.div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          )}

          {/* Confirmation Form Step */}
          {step === "confirmation" && primarySelection && backupSelection && (
            <motion.div
              key="confirmation"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={pageTransition}
              className="p-4 sm:p-6"
            >
              {/* Selected Times Summary */}
              <div className="mb-6 grid gap-3 sm:grid-cols-2">
                <Card className="border-primary/30 bg-primary/5">
                  <CardContent className="p-3">
                    <p className="text-muted-foreground text-xs font-medium uppercase">
                      Primary Choice
                    </p>
                    <p className="text-foreground mt-1 font-medium">
                      {formatDate(primarySelection.date)}
                    </p>
                    <p className="text-muted-foreground text-sm">
                      {formatTimeWithVariance(
                        currentSchedulingTime.hour,
                        currentSchedulingTime.minute,
                      )}
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-secondary/30 bg-secondary/5">
                  <CardContent className="p-3">
                    <p className="text-muted-foreground text-xs font-medium uppercase">
                      Backup Choice
                    </p>
                    <p className="text-foreground mt-1 font-medium">
                      {formatDate(backupSelection.date)}
                    </p>
                    <p className="text-muted-foreground text-sm">
                      {formatTimeWithVariance(
                        currentSchedulingTime.hour,
                        currentSchedulingTime.minute,
                      )}
                    </p>
                  </CardContent>
                </Card>
              </div>

              <ConfirmationForm
                location={invoice.location}
                clientEmail={client.email}
                clientPhone={client.phoneNumber}
                initialDetails={confirmationDetails || undefined}
                onSubmit={handleConfirmationSubmit}
                onBack={handleBackToSelection}
              />
            </motion.div>
          )}

          {/* Review Step */}
          {step === "review" &&
            primarySelection &&
            backupSelection &&
            confirmationDetails && (
              <motion.div
                key="review"
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={pageTransition}
                className="p-4 sm:p-6"
              >
                <h3 className="text-foreground mb-4 text-lg font-medium">
                  Review Your Request
                </h3>

                <div className="space-y-4">
                  {/* Selections */}
                  <Card>
                    <CardContent className="p-4">
                      <h4 className="text-foreground mb-3 font-medium">
                        Requested Times
                      </h4>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="bg-primary/5 rounded-lg p-3">
                          <p className="text-muted-foreground text-xs">
                            First choice
                          </p>
                          <p className="font-medium">
                            {formatDate(primarySelection.date)}
                          </p>
                          <p className="text-muted-foreground text-sm">
                            {formatTimeWithVariance(
                              currentSchedulingTime.hour,
                              currentSchedulingTime.minute,
                            )}
                          </p>
                        </div>
                        <div className="bg-muted rounded-lg p-3">
                          <p className="text-muted-foreground text-xs">
                            Backup
                          </p>
                          <p className="font-medium">
                            {formatDate(backupSelection.date)}
                          </p>
                          <p className="text-muted-foreground text-sm">
                            {formatTimeWithVariance(
                              currentSchedulingTime.hour,
                              currentSchedulingTime.minute,
                            )}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Details */}
                  <Card>
                    <CardContent className="p-4">
                      <h4 className="text-foreground mb-3 font-medium">
                        Service Details
                      </h4>
                      <div className="space-y-2 text-sm">
                        <p>
                          <span className="text-muted-foreground">
                            Location:
                          </span>{" "}
                          {invoice.location}
                        </p>
                        <p>
                          <span className="text-muted-foreground">
                            Service address:
                          </span>{" "}
                          {confirmationDetails.addressConfirmed
                            ? "Confirmed"
                            : "Needs update (see instructions)"}
                        </p>
                        <p>
                          <span className="text-muted-foreground">
                            On-site contact:
                          </span>{" "}
                          {confirmationDetails.onSiteContactName} (
                          {confirmationDetails.onSiteContactPhone})
                        </p>
                        <p>
                          <span className="text-muted-foreground">
                            Contact preference:
                          </span>{" "}
                          {confirmationDetails.preferredContact === "phone"
                            ? "Phone"
                            : confirmationDetails.preferredContact === "email"
                              ? "Email"
                              : "Either"}
                        </p>
                        {confirmationDetails.specialInstructions && (
                          <p>
                            <span className="text-muted-foreground">
                              Instructions:
                            </span>{" "}
                            {confirmationDetails.specialInstructions}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {submitError && (
                    <Card className="border-destructive bg-destructive/10">
                      <CardContent className="py-3">
                        <p className="text-destructive text-sm">
                          {submitError}
                        </p>
                      </CardContent>
                    </Card>
                  )}

                  <div className="flex justify-between pt-4">
                    <Button
                      variant="ghost"
                      onClick={handleBack}
                      disabled={isSubmitting}
                    >
                      &larr; Back
                    </Button>
                    <Button onClick={handleSubmit} disabled={isSubmitting}>
                      {isSubmitting ? "Submitting..." : "Submit Request"}
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}

          {/* Success Step */}
          {step === "success" && (
            <motion.div
              key="success"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={pageTransition}
              className="p-4 sm:p-6"
            >
              <SubmissionSuccess
                primarySelection={primarySelection!}
                backupSelection={backupSelection!}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
