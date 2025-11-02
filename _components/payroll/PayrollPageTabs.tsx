"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CreditCardIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import PayrollPeriodSelector from "./PayrollPeriodSelector";
import { AvailabilitySection } from "./AvailabilitySection";
import { TimeOffRequestsTable } from "./TimeOffRequestsTable";
import {
  PayrollPeriodType,
  ScheduleType,
  TechnicianType,
  AvailabilityType,
  TimeOffRequestType,
} from "../../app/lib/typeDefinitions";

interface PayrollPageTabsProps {
  payrollPeriods: PayrollPeriodType[];
  technicians: TechnicianType[];
  schedules: ScheduleType[];
  selectedPayrollPeriod: PayrollPeriodType | null;
  availability: AvailabilityType[];
  timeOffRequests: TimeOffRequestType[];
  pendingTimeOffCount: number;
  technicianMap: Record<string, string>;
}

const PayrollPageTabs = ({
  payrollPeriods,
  technicians,
  schedules,
  selectedPayrollPeriod,
  availability,
  timeOffRequests,
  pendingTimeOffCount,
  technicianMap,
}: PayrollPageTabsProps) => {
  const [activeTab, setActiveTab] = useState<"payroll" | "availability">(
    "payroll"
  );

  const tabs = [
    { id: "payroll", label: "Payroll", icon: CreditCardIcon },
    { id: "availability", label: "Availability", icon: UserGroupIcon },
  ];

  return (
    <div className="w-full bg-white shadow-sm">
      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`relative flex-1 px-4 py-4 text-center text-sm font-medium ${
                isActive
                  ? "text-gray-900"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <span className="flex items-center justify-center">
                <Icon className="mr-2 h-5 w-5" />
                {tab.label}
              </span>

              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 h-0.5 w-full bg-gray-900"
                  initial={false}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="p-6">
        <AnimatePresence mode="wait">
          {activeTab === "payroll" && (
            <motion.div
              key="payroll"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <PayrollPeriodSelector
                payrollPeriods={payrollPeriods}
                technicians={technicians}
                schedules={schedules}
                selectedPayrollPeriod={selectedPayrollPeriod}
              />
            </motion.div>
          )}

          {activeTab === "availability" && (
            <motion.div
              key="availability"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-8"
            >
              {/* Availability Section */}
              <AvailabilitySection
                availability={availability}
                technicians={technicianMap}
              />

              {/* Time-Off Requests Section */}
              <div>
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-800">
                    Time-Off Requests
                  </h2>
                  {pendingTimeOffCount > 0 && (
                    <span className="inline-flex items-center justify-center rounded-full bg-red-500 px-3 py-1 text-sm font-medium text-white">
                      {pendingTimeOffCount} Pending
                    </span>
                  )}
                </div>

                <TimeOffRequestsTable
                  requests={timeOffRequests}
                  technicians={technicianMap}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default PayrollPageTabs;
