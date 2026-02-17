"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Badge } from "../ui/badge";
import { CreditCard, Users } from "lucide-react";
import PayrollPeriodSelector from "./PayrollPeriodSelector";
import { AvailabilitySection } from "./AvailabilitySection";
import { TimeOffRequestsTable } from "./TimeOffRequestsTable";
import {
  PayrollPeriodType,
  ScheduleType,
  TechnicianType,
  AvailabilityType,
  TimeOffRequestType,
  PayrollDriveMetricsType,
} from "../../app/lib/typeDefinitions";

interface PayrollPageTabsProps {
  payrollPeriods: PayrollPeriodType[];
  technicians: TechnicianType[];
  schedules: ScheduleType[];
  selectedPayrollPeriod: PayrollPeriodType | null;
  payrollDriveMetrics: PayrollDriveMetricsType | null;
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
  payrollDriveMetrics,
  availability,
  timeOffRequests,
  pendingTimeOffCount,
  technicianMap,
}: PayrollPageTabsProps) => {
  return (
    <div className="w-full">
      <Tabs defaultValue="payroll" className="w-full">
        <TabsList className="bg-card grid w-full grid-cols-2 border">
          <TabsTrigger value="payroll" className="gap-2">
            <CreditCard className="h-4 w-4" />
            Payroll
          </TabsTrigger>
          <TabsTrigger value="availability" className="gap-2">
            <Users className="h-4 w-4" />
            Availability
            {pendingTimeOffCount > 0 && (
              <Badge
                variant="destructive"
                className="ml-1 flex h-5 w-5 items-center justify-center rounded-full p-0 text-xs"
              >
                {pendingTimeOffCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="payroll" className="mt-6 space-y-6">
          <PayrollPeriodSelector
            payrollPeriods={payrollPeriods}
            technicians={technicians}
            schedules={schedules}
            selectedPayrollPeriod={selectedPayrollPeriod}
            payrollDriveMetrics={payrollDriveMetrics}
          />
        </TabsContent>

        <TabsContent value="availability" className="mt-6 space-y-8">
          {/* Availability Section */}
          <AvailabilitySection
            availability={availability}
            technicians={technicianMap}
          />

          {/* Time-Off Requests Section */}
          <div>
            <div className="mb-6 flex items-center gap-3">
              <h2 className="text-foreground text-2xl font-bold">
                Time-Off Requests
              </h2>
              {pendingTimeOffCount > 0 && (
                <Badge variant="destructive" className="gap-1.5">
                  <span className="bg-destructive-foreground inline-flex h-2 w-2 animate-pulse rounded-full"></span>
                  {pendingTimeOffCount} Pending
                </Badge>
              )}
            </div>

            <TimeOffRequestsTable
              requests={timeOffRequests}
              technicians={technicianMap}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PayrollPageTabs;
