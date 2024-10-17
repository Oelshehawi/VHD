"use client";
import React, { useEffect, useState } from "react";
import {
  ScheduleType,
  TechnicianType,
  PayrollPeriodType,
} from "../../app/lib/typeDefinitions";
import { useForm, Controller } from "react-hook-form";
import { AnimatePresence, motion } from "framer-motion";
import toast from "react-hot-toast";
import { updateShiftHours } from "../../app/lib/actions/scheduleJobs.actions";
import Select from "react-select";
import { formatDateFns } from "../../app/lib/utils";

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

const EmployeeModal = ({
  isOpen,
  onClose,
  technician,
  schedules,
}: EmployeeModalProps) => {
  const { control, handleSubmit, reset } = useForm<FormValues>({
    defaultValues: {
      shifts: [],
    },
  });

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const shiftData = schedules
        .filter((schedule) =>
          schedule.assignedTechnicians.includes(technician.id),
        )
        .map((schedule) => ({
          scheduleId: schedule._id.toString(),
          hoursWorked: schedule.hours || 4,
        }));

      reset({ shifts: shiftData });
    }
  }, [isOpen, technician, schedules, reset]);

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    try {
      const updatePromises = data.shifts.map((shift) =>
        updateShiftHours({
          scheduleId: shift.scheduleId,
          hoursWorked: shift.hoursWorked,
        }),
      );

      await Promise.all(updatePromises);
      toast.success("Shifts updated successfully");
      onClose();
    } catch (error) {
      console.error("Failed to update shifts:", error);
      toast.error("Failed to update shifts");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  // Define options for hours worked
  const hoursOptions = Array.from({ length: 8 }, (_, i) => ({
    value: i + 1,
    label: `${i + 1}`,
  }));

  // Extract shifts assigned to the technician
  const assignedSchedules = schedules.filter((schedule) =>
    schedule.assignedTechnicians.includes(technician.id),
  );

  if (assignedSchedules.length === 0) {
    // No shifts to display
    return (
      <AnimatePresence>
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black-2 bg-opacity-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="w-full max-w-lg rounded-lg bg-white p-6 shadow-lg"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.8 }}
          >
            <h2 className="mb-4 text-xl font-semibold text-darkGreen">
              Shifts for {technician.name}
            </h2>
            <p className="text-darkGray">No shifts assigned for this period.</p>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                className="rounded bg-darkGreen px-4 py-2 text-white"
                onClick={onClose}
              >
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black-2 bg-opacity-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-lg"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.8 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-4 text-xl font-semibold text-darkGreen">
              Shifts for {technician.name}
            </h2>
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="max-h-96 space-y-4 overflow-y-auto ">
                {assignedSchedules.map((schedule, index) => (
                  <div
                    key={schedule._id.toString()}
                    className="flex flex-col rounded border border-borderGreen bg-lightGray p-4"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-darkGreen">
                          {schedule.jobTitle}
                        </p>
                        <p className="text-sm text-darkGray">
                          {formatDateFns(schedule.startDateTime)}
                        </p>
                      </div>
                      <Controller
                        control={control}
                        name={`shifts.${index}.hoursWorked`}
                        render={({ field }) => (
                          <Select
                            options={hoursOptions}
                            value={
                              hoursOptions.find(
                                (option) => option.value === field.value,
                              ) || {
                                value: field.value,
                                label: `${field.value}`,
                              }
                            }
                            onChange={(selectedOption) => {
                              field.onChange(selectedOption?.value || 4);
                            }}
                            className="w-24"
                            styles={{
                              control: (provided) => ({
                                ...provided,
                                borderColor: "#003e29",
                                minHeight: "30px",
                                boxShadow: "none",
                                "&:hover": {
                                  borderColor: "#003e29",
                                },
                              }),
                              menu: (provided) => ({
                                ...provided,
                                zIndex: 1000,
                              }),
                              singleValue: (provided) => ({
                                ...provided,
                              }),
                            }}
                          />
                        )}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex justify-end space-x-4">
                <button
                  type="button"
                  className="rounded bg-darkGray px-4 py-2 text-white hover:bg-gray-700"
                  onClick={onClose}
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`flex items-center justify-center rounded bg-darkGreen px-4 py-2 text-white hover:bg-green-700 ${
                    isLoading ? "cursor-not-allowed opacity-50" : ""
                  }`}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <svg
                        className="-ml-1 mr-3 h-5 w-5 animate-spin text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v8H4z"
                        ></path>
                      </svg>
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </>
  );
};

export default EmployeeModal;
