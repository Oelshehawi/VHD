"use client";

import { useForm } from "react-hook-form";
import { PaymentInfo } from "../../app/lib/typeDefinitions";
import { FaCreditCard, FaStickyNote } from "react-icons/fa";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
import { Button } from "../ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { DatePickerWithTime } from "../ui/date-picker-with-time";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (paymentData: PaymentInfo) => void;
  isLoading?: boolean;
}

export default function PaymentModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
}: PaymentModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PaymentInfo>({
    defaultValues: {
      method: "e-transfer",
      datePaid: new Date(),
      notes: "",
    },
  });

  const watchedDatePaid = watch("datePaid");

  const onFormSubmit = (data: PaymentInfo) => {
    if (!data.datePaid) {
      toast.error("Please select a date and time");
      return;
    }

    // Convert local date to UTC for storage
    const localDate = new Date(data.datePaid);
    const utcDate = new Date(
      localDate.getTime() - localDate.getTimezoneOffset() * 60000,
    );

    const finalPaymentData: PaymentInfo = {
      ...data,
      datePaid: utcDate,
    };

    onSubmit(finalPaymentData);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleOpenChange = (open: boolean) => {
    if (open) {
      // Reset form with fresh date when modal opens
      reset({
        method: "e-transfer",
        datePaid: new Date(),
        notes: "",
      });
    } else {
      handleClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg">
              <FaCreditCard className="text-primary h-5 w-5" />
            </div>
            <div>
              <DialogTitle>Payment Details</DialogTitle>
              <p className="text-muted-foreground text-sm">
                Record payment information
              </p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4 py-2">
          {/* Payment Method */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              <FaCreditCard className="text-muted-foreground h-4 w-4" />
              Payment Method <span className="text-destructive">*</span>
            </label>
            <Select
              value={watch("method")}
              onValueChange={(val) =>
                setValue("method", val as PaymentInfo["method"], {
                  shouldValidate: true,
                })
              }
              disabled={isLoading}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="e-transfer">E-Transfer</SelectItem>
                <SelectItem value="eft">EFT</SelectItem>
                <SelectItem value="cheque">Cheque</SelectItem>
                <SelectItem value="credit-card">Credit Card</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date Paid */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Date & Time Paid <span className="text-destructive">*</span>
            </label>
            <DatePickerWithTime
              date={watchedDatePaid}
              onSelect={(date) => {
                if (date) {
                  setValue("datePaid", date, { shouldValidate: true });
                }
              }}
              datePlaceholder="Select date"
              timePlaceholder="Select time"
              disabled={isLoading}
            />
            {errors.datePaid && (
              <p className="text-destructive text-xs">
                Please select a date and time
              </p>
            )}
            <p className="text-muted-foreground text-xs">
              Time shown in your local timezone, saved as UTC
            </p>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              <FaStickyNote className="text-muted-foreground h-4 w-4" />
              Notes <span className="text-muted-foreground">(optional)</span>
            </label>
            <textarea
              {...register("notes")}
              placeholder="Transaction ID, check number, reference, etc."
              rows={3}
              className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[80px] w-full resize-none rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isLoading}
            />
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full sm:w-auto"
            >
              {isLoading ? "Saving..." : "Mark as Paid"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
