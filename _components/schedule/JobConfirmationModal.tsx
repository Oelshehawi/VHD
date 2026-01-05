"use client";
import { useForm, Controller } from "react-hook-form";
import { OnSiteContactType } from "../../app/lib/typeDefinitions";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Checkbox } from "../ui/checkbox";
import { Loader2 } from "lucide-react";

interface AccessInfoFormData {
  onSiteContact: OnSiteContactType;
  accessInstructions: string;
}

interface JobConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (accessInfo: AccessInfoFormData) => Promise<void>;
  initialData?: {
    onSiteContact?: OnSiteContactType;
    accessInstructions?: string;
  };
  isLoading?: boolean;
}

interface ChecklistItem {
  id: string;
  label: string;
}

const CHECKLIST_ITEMS: ChecklistItem[] = [
  {
    id: "payment",
    label: "Payment - Verify if client pays on day of service",
  },
  {
    id: "parking",
    label: "Parking information",
  },
  {
    id: "fanAccess",
    label: "Fan access",
  },
];

export default function JobConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  initialData,
  isLoading = false,
}: JobConfirmationModalProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isValid },
    reset,
  } = useForm<AccessInfoFormData>({
    defaultValues: {
      onSiteContact: initialData?.onSiteContact ?? {
        name: "",
        phone: "",
        email: "",
      },
      accessInstructions: initialData?.accessInstructions ?? "",
    },
    mode: "onChange",
    values: initialData
      ? {
          onSiteContact: initialData.onSiteContact ?? {
            name: "",
            phone: "",
            email: "",
          },
          accessInstructions: initialData.accessInstructions ?? "",
        }
      : undefined,
  });

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      reset();
      onClose();
    }
  };

  const onSubmit = async (data: AccessInfoFormData) => {
    await onConfirm(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Confirm Job & Verify Access Information</DialogTitle>
          <DialogDescription>
            Please verify access information and confirm details with the client
            before scheduling.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
          {/* Access Information Section */}
          <div className="space-y-4">
            <h3 className="text-muted-foreground text-sm font-semibold tracking-wide uppercase">
              Access Information
            </h3>

            {/* Contact Name & Phone - 2 columns */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="confirmContactName">
                  Contact Name<span className="text-destructive">*</span>
                </Label>
                <Input
                  id="confirmContactName"
                  {...register("onSiteContact.name", {
                    required: "Contact Name is required",
                  })}
                  placeholder="John Smith"
                  className={
                    errors.onSiteContact?.name ? "border-destructive" : ""
                  }
                />
                {errors.onSiteContact?.name && (
                  <p className="text-destructive text-sm">
                    {errors.onSiteContact.name.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmContactPhone">
                  Phone<span className="text-destructive">*</span>
                </Label>
                <Input
                  id="confirmContactPhone"
                  {...register("onSiteContact.phone", {
                    required: "Phone number is required",
                  })}
                  placeholder="604-555-1234"
                  type="tel"
                  className={
                    errors.onSiteContact?.phone ? "border-destructive" : ""
                  }
                />
                {errors.onSiteContact?.phone && (
                  <p className="text-destructive text-sm">
                    {errors.onSiteContact.phone.message}
                  </p>
                )}
              </div>
            </div>

            {/* Email - Full Width */}
            <div className="space-y-2">
              <Label htmlFor="confirmContactEmail">Email (optional)</Label>
              <Input
                id="confirmContactEmail"
                {...register("onSiteContact.email")}
                placeholder="contact@example.com"
                type="email"
              />
            </div>

            {/* Access Instructions - Full Width */}
            <div className="space-y-2">
              <Label htmlFor="confirmAccessInstructions">
                Access Instructions<span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="confirmAccessInstructions"
                {...register("accessInstructions", {
                  required: "Access Instructions are required",
                })}
                rows={3}
                placeholder="e.g., Use back entrance, gate code is 1234, ask for manager on duty"
                className={
                  errors.accessInstructions ? "border-destructive" : ""
                }
              />
              {errors.accessInstructions && (
                <p className="text-destructive text-sm">
                  {errors.accessInstructions.message}
                </p>
              )}
            </div>
          </div>

          {/* Client Verification Checklist */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="text-muted-foreground text-sm font-semibold tracking-wide uppercase">
              Client Verification Checklist
            </h3>
            <p className="text-muted-foreground text-sm">
              Please verify the following with the client:
            </p>
            <div className="space-y-3">
              {CHECKLIST_ITEMS.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center space-x-3 rounded-lg border p-3"
                >
                  <Controller
                    control={control}
                    name={`checklist.${item.id}` as any}
                    render={({ field }) => (
                      <Checkbox
                        checked={field.value ?? false}
                        onCheckedChange={field.onChange}
                      />
                    )}
                  />
                  <Label
                    htmlFor={item.id}
                    className="text-sm leading-none font-normal peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {item.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <DialogFooter className="gap-2 border-t pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !isValid}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Confirming...
                </>
              ) : (
                "Confirm Job"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
