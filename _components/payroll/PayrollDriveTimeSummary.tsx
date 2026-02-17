"use client";

import { PayrollDriveMetricsType } from "../../app/lib/typeDefinitions";
import { formatDateFns } from "../../app/lib/utils";
import { Badge } from "../ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";

interface PayrollDriveTimeSummaryProps {
  payrollDriveMetrics: PayrollDriveMetricsType | null;
}

function formatHours(value: number): string {
  return `${value.toFixed(2)}h`;
}

const PayrollDriveTimeSummary = ({
  payrollDriveMetrics,
}: PayrollDriveTimeSummaryProps) => {
  if (!payrollDriveMetrics) {
    return null;
  }

  return (
    <Card className="mb-6">
      <CardHeader className="space-y-2">
        <CardTitle className="text-lg">
          Drive Time + Actual Duration Review
        </CardTitle>
        <p className="text-muted-foreground text-sm">
          Compare actual logged duration (from{" "}
          <code>actualServiceDurationMinutes</code>) against scheduled hours +
          drive time for this payroll period.
        </p>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <div className="bg-muted/30 rounded-md p-3">
            <p className="text-muted-foreground text-xs">Scheduled + Drive</p>
            <p className="text-lg font-semibold">
              {formatHours(payrollDriveMetrics.totalScheduledPlusDriveHours)}
            </p>
          </div>
          <div className="bg-muted/30 rounded-md p-3">
            <p className="text-muted-foreground text-xs">Actual + Drive</p>
            <p className="text-lg font-semibold">
              {formatHours(payrollDriveMetrics.totalActualPlusDriveHours)}
            </p>
          </div>
          <div className="bg-muted/30 rounded-md p-3">
            <p className="text-muted-foreground text-xs">Drive Time Total</p>
            <p className="text-lg font-semibold">
              {formatHours(payrollDriveMetrics.totalDriveHours)}
            </p>
          </div>
          <div className="bg-muted/30 rounded-md p-3">
            <p className="text-muted-foreground text-xs">
              Missing Actual Duration Jobs
            </p>
            <p className="text-lg font-semibold">
              {payrollDriveMetrics.totalMissingActualDurationJobs}
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Jobs</TableHead>
                <TableHead>Scheduled</TableHead>
                <TableHead>Actual</TableHead>
                <TableHead>Drive</TableHead>
                <TableHead>Scheduled + Drive</TableHead>
                <TableHead>Actual + Drive</TableHead>
                <TableHead>Delta (A+D minus S+D)</TableHead>
                <TableHead>Missing Actual</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payrollDriveMetrics.technicians.map((technician) => (
                <TableRow key={technician.technicianId}>
                  <TableCell className="font-medium">
                    <div className="flex flex-col gap-1">
                      <span>{technician.technicianName}</span>
                      {!technician.hasDepotAddress && (
                        <Badge variant="outline" className="w-fit text-xs">
                          Depot Missing
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{technician.totalJobs}</TableCell>
                  <TableCell>
                    {formatHours(technician.scheduledHours)}
                  </TableCell>
                  <TableCell>{formatHours(technician.actualHours)}</TableCell>
                  <TableCell>{formatHours(technician.driveHours)}</TableCell>
                  <TableCell>
                    {formatHours(technician.scheduledPlusDriveHours)}
                  </TableCell>
                  <TableCell>
                    {formatHours(technician.actualPlusDriveHours)}
                  </TableCell>
                  <TableCell>
                    <span
                      className={
                        technician.actualVsScheduledPlusDriveHours >= 0
                          ? "text-emerald-600"
                          : "text-destructive"
                      }
                    >
                      {technician.actualVsScheduledPlusDriveHours >= 0
                        ? "+"
                        : ""}
                      {formatHours(technician.actualVsScheduledPlusDriveHours)}
                    </span>
                  </TableCell>
                  <TableCell>
                    {technician.missingActualDurationJobs.length}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {payrollDriveMetrics.totalMissingActualDurationJobs > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">
              Jobs Missing <code>actualServiceDurationMinutes</code>
            </p>
            <div className="space-y-2">
              {payrollDriveMetrics.technicians
                .filter(
                  (technician) =>
                    technician.missingActualDurationJobs.length > 0,
                )
                .map((technician) => (
                  <div
                    key={technician.technicianId}
                    className="bg-muted/30 rounded-md p-3"
                  >
                    <p className="mb-1 text-sm font-medium">
                      {technician.technicianName} (
                      {technician.missingActualDurationJobs.length})
                    </p>
                    <ul className="text-muted-foreground list-disc space-y-1 pl-5 text-xs">
                      {technician.missingActualDurationJobs.map((job) => (
                        <li key={job.scheduleId}>
                          {job.jobTitle} ({formatDateFns(job.startDateTime)})
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PayrollDriveTimeSummary;
