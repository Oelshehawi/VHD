"use client";

import * as React from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";

import { Button } from "./button";
import { Calendar } from "./calendar";
import { Input } from "./input";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { cn } from "@/lib/utils";

interface DatePickerWithTimeProps {
  date?: Date;
  onSelect?: (date: Date | undefined) => void;
  datePlaceholder?: string;
  timePlaceholder?: string;
  disabled?: boolean;
  minDate?: Date;
  maxDate?: Date;
  className?: string;
  dateId?: string;
  timeId?: string;
  showSeconds?: boolean;
}

export function DatePickerWithTime({
  date,
  onSelect,
  datePlaceholder = "Select date",
  timePlaceholder = "Select time",
  disabled = false,
  minDate,
  maxDate,
  className,
  dateId,
  timeId,
  showSeconds = false,
}: DatePickerWithTimeProps) {
  const [open, setOpen] = React.useState(false);

  // Use ref to track previous date and only update when it actually changes
  const prevDateRef = React.useRef<Date | undefined>(date);
  const [localDate, setLocalDate] = React.useState<Date | undefined>(date);

  const getTimeString = React.useCallback(
    (dateValue: Date | undefined) => {
      if (!dateValue) return "";
      const hours = String(dateValue.getHours()).padStart(2, "0");
      const minutes = String(dateValue.getMinutes()).padStart(2, "0");
      const seconds = showSeconds
        ? String(dateValue.getSeconds()).padStart(2, "0")
        : "00";
      return `${hours}:${minutes}${showSeconds ? `:${seconds}` : ""}`;
    },
    [showSeconds],
  );

  const [timeString, setTimeString] = React.useState<string>(() =>
    getTimeString(date),
  );

  // Only update internal state when date prop actually changes (not just reference)
  React.useEffect(() => {
    const dateChanged =
      date?.getTime() !== prevDateRef.current?.getTime() ||
      (date === undefined && prevDateRef.current !== undefined);

    if (dateChanged) {
      prevDateRef.current = date;
      setLocalDate(date);
      setTimeString(getTimeString(date));
    }
  }, [date, getTimeString]);

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      const newDate = new Date(selectedDate);
      if (timeString) {
        const [hours, minutes, seconds] = timeString.split(":").map(Number);
        newDate.setHours(hours || 0, minutes || 0, seconds || 0);
      }
      setLocalDate(newDate);
      onSelect?.(newDate);
    } else {
      setLocalDate(undefined);
      onSelect?.(undefined);
    }
    setOpen(false);
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTimeString = e.target.value;
    setTimeString(newTimeString);

    if (localDate && newTimeString) {
      const [hours, minutes, seconds] = newTimeString.split(":").map(Number);
      const newDate = new Date(localDate);
      newDate.setHours(hours || 0, minutes || 0, seconds || 0);
      setLocalDate(newDate);
      onSelect?.(newDate);
    }
  };

  return (
    <div className={cn("flex gap-4", className)}>
      <div className="flex flex-1 flex-col gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              id={dateId}
              variant="outline"
              disabled={disabled}
              className={cn(
                "w-full justify-start text-left font-normal",
                !localDate && "text-muted-foreground",
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {localDate ? (
                format(localDate, "PPP")
              ) : (
                <span>{datePlaceholder}</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={localDate}
              onSelect={handleDateSelect}
              disabled={(date) => {
                if (minDate && date < minDate) return true;
                if (maxDate && date > maxDate) return true;
                return false;
              }}
              captionLayout="dropdown"
            />
          </PopoverContent>
        </Popover>
      </div>
      <div className="flex flex-1 flex-col gap-2">
        <Input
          id={timeId}
          type="time"
          value={timeString}
          onChange={handleTimeChange}
          disabled={disabled}
          step={showSeconds ? 1 : 60}
          placeholder={timePlaceholder}
          className="appearance-none [&::-webkit-calendar-picker-indicator]:hidden"
        />
      </div>
    </div>
  );
}
