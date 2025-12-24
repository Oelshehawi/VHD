"use client";

import { useForm } from "react-hook-form";
import { useState } from "react";
import { FaSave, FaTimes, FaFileInvoice } from "react-icons/fa";
import { toast } from "react-hot-toast";
import { updateEstimate } from "../../app/lib/actions/estimates.actions";
import { EstimateType } from "../../app/lib/typeDefinitions";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import { ScrollArea } from "../ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { MultiSelect } from "../ui/multi-select";
import { Separator } from "../ui/separator";

interface EditEstimateDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  estimate: EstimateType;
}

const DEFAULT_SERVICES = [
  "Hood from inside and outside",
  "All filters",
  "Access panels to duct work (accessible area only)",
  "Rooftop fan (If safe access)",
  "Fire wall behind equipment",
  "ASTTBC Sticker",
  "Fire Dept Report",
  "Before/After pictures",
];

interface FormData {
  status: EstimateType["status"];
  prospectInfo: {
    businessName?: string;
    contactPerson?: string;
    email?: string;
    phone?: string;
    address?: string;
    projectLocation?: string;
  };
  notes?: string;
  terms?: string;
}

export default function EditEstimateDetailsDialog({
  isOpen,
  onClose,
  estimate,
}: EditEstimateDetailsDialogProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedServices, setSelectedServices] = useState<string[]>(
    estimate.services?.length > 0 ? estimate.services : DEFAULT_SERVICES,
  );

  const updateEstimateWithId = updateEstimate.bind(
    null,
    estimate._id.toString(),
  );

  const { register, handleSubmit, setValue, watch } = useForm<FormData>({
    defaultValues: {
      status: estimate.status,
      prospectInfo: {
        businessName: estimate.prospectInfo?.businessName || "",
        contactPerson: estimate.prospectInfo?.contactPerson || "",
        email: estimate.prospectInfo?.email || "",
        phone: estimate.prospectInfo?.phone || "",
        address: estimate.prospectInfo?.address || "",
        projectLocation: estimate.prospectInfo?.projectLocation || "",
      },
      notes: estimate.notes || "",
      terms: estimate.terms || "",
    },
  });

  const onSubmit = async (formData: FormData) => {
    setIsUpdating(true);
    try {
      // prospectInfo is already nested by react-hook-form
      const prospectInfo = {
        businessName: formData.prospectInfo?.businessName || "",
        contactPerson: formData.prospectInfo?.contactPerson,
        email: formData.prospectInfo?.email,
        phone: formData.prospectInfo?.phone,
        address: formData.prospectInfo?.address,
        projectLocation: formData.prospectInfo?.projectLocation,
      };

      await updateEstimateWithId({
        status: formData.status,
        prospectInfo,
        services: selectedServices,
        notes: formData.notes,
        terms: formData.terms,
      });

      toast.success("Estimate updated successfully");
      onClose();
    } catch (error) {
      console.error("Error updating estimate:", error);
      toast.error("Failed to update estimate");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open && !isUpdating) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="flex max-h-[90vh] max-w-2xl flex-col p-0">
        <DialogHeader className="shrink-0 border-b px-6 pt-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg">
              <FaFileInvoice className="text-primary h-5 w-5" />
            </div>
            <div>
              <DialogTitle>Edit Estimate Details</DialogTitle>
              <DialogDescription>
                Estimate {estimate.estimateNumber}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex min-h-0 flex-1 flex-col"
        >
          <ScrollArea className="flex-1 overflow-y-auto px-6 py-4">
            <div className="space-y-6 pr-4">
              {/* Status */}
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={watch("status")}
                  onValueChange={(value) =>
                    setValue("status", value as EstimateType["status"])
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* Prospect Information */}
              <div className="space-y-4">
                <h4 className="text-foreground text-sm font-medium">
                  Prospect Information
                </h4>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="businessName">Business Name</Label>
                    <Input
                      id="businessName"
                      {...register("prospectInfo.businessName")}
                      placeholder="Company name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactPerson">Contact Person</Label>
                    <Input
                      id="contactPerson"
                      {...register("prospectInfo.contactPerson")}
                      placeholder="Primary contact"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      {...register("prospectInfo.email")}
                      placeholder="email@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      {...register("prospectInfo.phone")}
                      placeholder="(555) 123-4567"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      {...register("prospectInfo.address")}
                      placeholder="Street address"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="projectLocation">Project Location</Label>
                    <Input
                      id="projectLocation"
                      {...register("prospectInfo.projectLocation")}
                      placeholder="Where work will be performed"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Services */}
              <div className="space-y-2">
                <Label>Services Included</Label>
                <MultiSelect
                  options={DEFAULT_SERVICES.map((service) => ({
                    label: service,
                    value: service,
                  }))}
                  onValueChange={setSelectedServices}
                  defaultValue={selectedServices}
                  placeholder="Select services"
                  maxCount={3}
                />
              </div>

              <Separator />

              {/* Notes and Terms */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    {...register("notes")}
                    placeholder="Internal notes..."
                    rows={4}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="terms">Terms & Conditions</Label>
                  <Textarea
                    id="terms"
                    {...register("terms")}
                    placeholder="Payment terms, conditions..."
                    rows={4}
                  />
                </div>
              </div>
            </div>
          </ScrollArea>

          <DialogFooter className="shrink-0 gap-2 border-t px-6 py-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isUpdating}
            >
              <FaTimes className="mr-2 h-3 w-3" />
              Cancel
            </Button>
            <Button type="submit" disabled={isUpdating}>
              <FaSave className="mr-2 h-3 w-3" />
              {isUpdating ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
