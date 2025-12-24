"use client";

import React, { useState } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { FaReceipt } from "react-icons/fa";
import GeneratePDF, { type ReceiptData } from "../pdf/GeneratePDF";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Input } from "../ui/input";

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  receiptData: Omit<ReceiptData, "datePaid" | "paymentMethod">;
}

const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  receiptData,
}) => {
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [paymentDate, setPaymentDate] = useState(() => {
    // Get today's date in local timezone to avoid timezone issues
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  });

  const formatDate = (dateString: string) => {
    // Parse the date string as local date to avoid timezone issues
    const parts = dateString.split("-");
    if (parts.length !== 3) return dateString; // fallback if format is unexpected

    const year = parseInt(parts[0]!, 10);
    const month = parseInt(parts[1]!, 10);
    const day = parseInt(parts[2]!, 10);

    const date = new Date(year, month - 1, day); // month is 0-indexed
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const completeReceiptData: ReceiptData = {
    ...receiptData,
    datePaid: formatDate(paymentDate || ""),
    paymentMethod: paymentMethod,
  };

  const handleClose = () => {
    onClose();
    // Reset form
    setPaymentMethod("Cash");
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    setPaymentDate(`${year}-${month}-${day}`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="border-b pb-4">
          <div className="flex items-center">
            <FaReceipt className="text-primary mr-3 h-5 w-5" />
            <DialogTitle className="text-lg">Generate Receipt</DialogTitle>
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="space-y-4 py-4">
          <div>
            <p className="text-muted-foreground text-sm">
              Please provide payment details to generate the receipt for:
            </p>
            <p className="text-foreground mt-1 font-medium">
              {receiptData.jobTitle}
            </p>
            <p className="text-muted-foreground text-sm">
              {receiptData.location}
            </p>
          </div>

          {/* Payment Method */}
          <div>
            <Label htmlFor="payment-method" className="mb-2">
              Payment Method
            </Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger id="payment-method">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Cash">Cash</SelectItem>
                <SelectItem value="Check">Check</SelectItem>
                <SelectItem value="Credit Card">Credit Card</SelectItem>
                <SelectItem value="Debit Card">Debit Card</SelectItem>
                <SelectItem value="E-Transfer">E-Transfer</SelectItem>
                <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                <SelectItem value="Online Payment">Online Payment</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Payment Date */}
          <div>
            <Label htmlFor="payment-date" className="mb-2">
              Payment Date
            </Label>
            <Input
              id="payment-date"
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
            />
          </div>

          {/* Amount Summary */}
          <div className="bg-muted rounded-lg p-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal:</span>
              <span className="text-foreground">
                ${receiptData.subtotal.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">GST (5%):</span>
              <span className="text-foreground">
                ${receiptData.gst.toFixed(2)}
              </span>
            </div>
            <div className="border-border text-foreground mt-2 flex justify-between border-t pt-2 font-medium">
              <span>Total Amount:</span>
              <span className="text-primary">
                ${receiptData.totalAmount.toFixed(2)} CAD
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="gap-2">
          <Button onClick={handleClose} variant="outline" type="button">
            Cancel
          </Button>
          <GeneratePDF
            pdfData={{ type: "receipt", data: completeReceiptData }}
            fileName={`Receipt - ${receiptData.jobTitle}.pdf`}
            buttonText="Generate Receipt"
            className="inline-flex items-center justify-center"
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReceiptModal;
