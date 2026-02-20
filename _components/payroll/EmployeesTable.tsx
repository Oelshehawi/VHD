// components/Payroll/EmployeesTable.tsx

"use client";

import { ScheduleType, TechnicianType } from "../../app/lib/typeDefinitions";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { updateTechnicianDetails } from "../../app/lib/actions/scheduleJobs.actions";
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
  DialogDescription,
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

interface EditFormValues {
  hourlyRate: number;
  depotAddress: string;
  phoneNumber: string;
  email: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
}

const EditEmployeeFormContent = ({
  technician,
  onClose,
}: {
  technician: TechnicianType;
  onClose: () => void;
}) => {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);

  const { register, handleSubmit } = useForm<EditFormValues>({
    defaultValues: {
      hourlyRate: technician.hourlyRate ?? 0,
      depotAddress: technician.depotAddress ?? "",
      phoneNumber: technician.phoneNumber ?? "",
      email: technician.email ?? "",
      emergencyContactName: technician.emergencyContactName ?? "",
      emergencyContactPhone: technician.emergencyContactPhone ?? "",
    },
  });

  const onSubmit = async (data: EditFormValues) => {
    setIsSaving(true);
    try {
      const result = await updateTechnicianDetails(technician.id, {
        hourlyRate: data.hourlyRate,
        depotAddress: data.depotAddress || null,
        phoneNumber: data.phoneNumber || null,
        email: data.email || null,
        emergencyContactName: data.emergencyContactName || null,
        emergencyContactPhone: data.emergencyContactPhone || null,
      });

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      onClose();
      router.refresh();
    } catch (error) {
      console.error("Failed to update employee details:", error);
      toast.error("Failed to update employee details");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="space-y-5 py-2">
        <div className="text-sm">
          <span className="font-medium">{technician.name}</span>
        </div>

        {/* Compensation & Location */}
        <div className="space-y-3">
          <h4 className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">
            Compensation & Location
          </h4>
          <div className="space-y-1.5">
            <Label htmlFor="hourlyRate">Hourly Rate ($)</Label>
            <Input
              id="hourlyRate"
              type="number"
              step="0.01"
              disabled={isSaving}
              {...register("hourlyRate", { valueAsNumber: true, min: 0 })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="depotAddress">Depot Address</Label>
            <Input
              id="depotAddress"
              placeholder="123 Main St, City, Province"
              disabled={isSaving}
              {...register("depotAddress")}
            />
          </div>
        </div>

        {/* Contact Information */}
        <div className="space-y-3">
          <h4 className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">
            Contact Information
          </h4>
          <div className="space-y-1.5">
            <Label htmlFor="phoneNumber">Phone Number</Label>
            <Input
              id="phoneNumber"
              type="tel"
              placeholder="604-555-0123"
              disabled={isSaving}
              {...register("phoneNumber")}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="employee@example.com"
              disabled={isSaving}
              {...register("email")}
            />
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="space-y-3">
          <h4 className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">
            Emergency Contact
          </h4>
          <div className="space-y-1.5">
            <Label htmlFor="emergencyContactName">Name</Label>
            <Input
              id="emergencyContactName"
              placeholder="Contact name"
              disabled={isSaving}
              {...register("emergencyContactName")}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="emergencyContactPhone">Phone</Label>
            <Input
              id="emergencyContactPhone"
              type="tel"
              placeholder="604-555-0123"
              disabled={isSaving}
              {...register("emergencyContactPhone")}
            />
          </div>
        </div>
      </div>

      <DialogFooter className="mt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={isSaving}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSaving}>
          {isSaving ? (
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

const EmployeesTable = ({
  schedules,
  technicians,
  onViewShifts,
}: EmployeesTableProps) => {
  const [selectedTechnician, setSelectedTechnician] =
    useState<TechnicianType | null>(null);

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
                          onClick={() => setSelectedTechnician(technician)}
                        >
                          Edit
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
          if (!open) setSelectedTechnician(null);
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Employee Details</DialogTitle>
            <DialogDescription>
              Update compensation, contact info, and emergency contact.
            </DialogDescription>
          </DialogHeader>
          {selectedTechnician && (
            <EditEmployeeFormContent
              key={selectedTechnician.id}
              technician={selectedTechnician}
              onClose={() => setSelectedTechnician(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default EmployeesTable;
