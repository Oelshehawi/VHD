// components/Payroll/EmployeesTable.tsx

"use client";

import { ScheduleType, TechnicianType } from "../../app/lib/typeDefinitions";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { updateTechnicianDepotAddress } from "../../app/lib/actions/scheduleJobs.actions";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";

interface EmployeesTableProps {
  schedules: ScheduleType[];
  technicians: TechnicianType[];
  onViewShifts: (technician: TechnicianType) => void;
}

interface EmployeePayrollData {
  technician: TechnicianType;
  totalHours: number;
  hourlyRate: number;
  grossPay: number;
}

const EmployeesTable = ({
  schedules,
  technicians,
  onViewShifts,
}: EmployeesTableProps) => {
  const router = useRouter();
  const [selectedTechnician, setSelectedTechnician] =
    useState<TechnicianType | null>(null);
  const [depotAddressInput, setDepotAddressInput] = useState("");
  const [isSavingDepotAddress, setIsSavingDepotAddress] = useState(false);

  // Calculate payroll data for each technician
  const employeeData: EmployeePayrollData[] = useMemo(() => {
    return technicians.map((tech) => {
      const techSchedules = schedules.filter((schedule) =>
        schedule.assignedTechnicians.includes(tech.id),
      );
      const totalHours = techSchedules.reduce(
        (acc, schedule) => acc + (schedule.hours || 0),
        0,
      );
      const grossPay = totalHours * (tech.hourlyRate || 0);

      return {
        technician: tech,
        totalHours,
        hourlyRate: tech.hourlyRate || 0,
        grossPay,
      };
    });
  }, [technicians, schedules]);

  const openDepotAddressDialog = (technician: TechnicianType) => {
    setSelectedTechnician(technician);
    setDepotAddressInput(technician.depotAddress || "");
  };

  const resetDepotAddressDialog = () => {
    setSelectedTechnician(null);
    setDepotAddressInput("");
  };

  const saveDepotAddress = async () => {
    if (!selectedTechnician) return;

    setIsSavingDepotAddress(true);
    try {
      const result = await updateTechnicianDepotAddress(
        selectedTechnician.id,
        depotAddressInput,
      );

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      resetDepotAddressDialog();
      router.refresh();
    } catch (error) {
      console.error("Failed to update depot address:", error);
      toast.error("Failed to update depot address");
    } finally {
      setIsSavingDepotAddress(false);
    }
  };

  return (
    <>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Employees Payroll Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Hours Worked</TableHead>
                  <TableHead>Hourly Rate ($)</TableHead>
                  <TableHead>Depot Address</TableHead>
                  <TableHead>Gross Pay (CAD)</TableHead>
                  <TableHead>Actions</TableHead>
                  <TableHead>Shifts</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employeeData.map(
                  ({ technician, totalHours, hourlyRate, grossPay }) => (
                    <TableRow key={technician.id}>
                      <TableCell className="font-medium">
                        {technician.name}
                      </TableCell>
                      <TableCell>{totalHours}</TableCell>
                      <TableCell>${hourlyRate.toFixed(2)}</TableCell>
                      <TableCell className="max-w-64">
                        {technician.depotAddress ? (
                          <span>{technician.depotAddress}</span>
                        ) : (
                          <span className="text-muted-foreground">Not set</span>
                        )}
                      </TableCell>
                      <TableCell>
                        $
                        {grossPay.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openDepotAddressDialog(technician)}
                        >
                          Edit Depot
                        </Button>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="link"
                          className="h-auto p-0"
                          onClick={() => onViewShifts(technician)}
                        >
                          View Shifts
                        </Button>
                      </TableCell>
                    </TableRow>
                  ),
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={selectedTechnician !== null}
        onOpenChange={(open) => {
          if (!open && !isSavingDepotAddress) {
            resetDepotAddressDialog();
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Depot Address</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="text-sm">
              <span className="font-medium">{selectedTechnician?.name}</span>
            </div>
            <div className="space-y-2">
              <Label htmlFor="depot-address">Depot Address</Label>
              <Input
                id="depot-address"
                value={depotAddressInput}
                onChange={(event) => setDepotAddressInput(event.target.value)}
                placeholder="123 Main St, City, Province"
                disabled={isSavingDepotAddress}
              />
              <p className="text-muted-foreground text-xs">
                Saved to Clerk public metadata as depotAddress.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={resetDepotAddressDialog}
              disabled={isSavingDepotAddress}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={saveDepotAddress}
              disabled={isSavingDepotAddress}
            >
              {isSavingDepotAddress ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default EmployeesTable;
