"use client";
import React, { useMemo, useState } from "react";
import {
  ScheduleType,
  TechnicianType,
  PayrollPeriodType,
} from "../../app/lib/typeDefinitions";
import { useForm, Controller } from "react-hook-form";
import toast from "react-hot-toast";
import { updateShiftHoursBatch } from "../../app/lib/actions/scheduleJobs.actions";
import { formatDateFns } from "../../app/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Card, CardContent } from "../ui/card";
import { Loader2 } from "lucide-react";

interface EmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  technician: TechnicianType;
  schedules: ScheduleType[];
  payrollPeriod: PayrollPeriodType;
}

interface FormValues {
  shifts: {
    scheduleId: string;
    hoursWorked: number;
  }[];
}

interface FormContentProps {
  assignedSchedules: ScheduleType[];
  defaultValues: FormValues;
  onClose: () => void;
}

const FormContent = ({
  assignedSchedules,
  defaultValues,
  onClose,
}: FormContentProps) => {
  const { control, handleSubmit } = useForm<FormValues>({
    defaultValues,
  });

  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    try {
      // Compare with default values to find changed shifts
      const changedShifts = data.shifts.filter((shift) => {
        const originalShift = defaultValues.shifts.find(
          (orig) => orig.scheduleId === shift.scheduleId,
        );
        return originalShift && originalShift.hoursWorked !== shift.hoursWorked;
      });

      if (changedShifts.length === 0) {
        toast.success("No changes to save");
        onClose();
        return;
      }

      // Single batch update call
      await updateShiftHoursBatch(changedShifts);
      toast.success(`Updated ${changedShifts.length} shift(s) successfully`);
      onClose();
    } catch (error) {
      console.error("Failed to update shifts:", error);
      toast.error("Failed to update shifts");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="max-h-96 space-y-4 overflow-y-auto">
        {assignedSchedules.map((schedule, index) => (
          <Card key={schedule._id.toString()}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-foreground font-medium">
                    {schedule.jobTitle}
                  </p>
                  <p className="text-muted-foreground text-sm">
                    {formatDateFns(schedule.startDateTime)}
                  </p>
                </div>
                <Controller
                  control={control}
                  name={`shifts.${index}.hoursWorked`}
                  render={({ field }) => (
                    <Input
                      type="number"
                      min="0"
                      step="0.5"
                      value={field.value ?? 0}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value) || 0;
                        field.onChange(value);
                      }}
                      onBlur={field.onBlur}
                      className="w-24 text-center"
                    />
                  )}
                />
                <Controller
                  control={control}
                  name={`shifts.${index}.scheduleId`}
                  render={({ field }) => (
                    <input
                      type="hidden"
                      {...field}
                      value={schedule._id.toString()}
                    />
                  )}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <DialogFooter className="mt-6">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Changes"
          )}
        </Button>
      </DialogFooter>
    </form>
  );
};

const EmployeeModal = ({
  isOpen,
  onClose,
  technician,
  schedules,
}: EmployeeModalProps) => {
  // Extract shifts assigned to the technician
  const assignedSchedules = useMemo(
    () =>
      schedules.filter((schedule) =>
        schedule.assignedTechnicians.includes(technician.id),
      ),
    [schedules, technician.id],
  );

  // Compute default form values based on assigned schedules
  const defaultValues = useMemo<FormValues>(() => {
    const shiftData = assignedSchedules.map((schedule) => ({
      scheduleId: schedule._id.toString(),
      hoursWorked: Number(schedule.hours) || 4,
    }));
    return { shifts: shiftData };
  }, [assignedSchedules]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Shifts for {technician.name}</DialogTitle>
        </DialogHeader>

        {assignedSchedules.length === 0 ? (
          <p className="text-muted-foreground">
            No shifts assigned for this period.
          </p>
        ) : (
          <FormContent
            key={`${technician.id}-${assignedSchedules.length}`}
            assignedSchedules={assignedSchedules}
            defaultValues={defaultValues}
            onClose={onClose}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default EmployeeModal;
