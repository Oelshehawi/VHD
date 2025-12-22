"use client";
import { useState } from "react";
import { deleteClient, deleteInvoice } from "../app/lib/actions/actions";
import toast from "react-hot-toast";
import { FaTrash } from "react-icons/fa";
import { deleteJob } from "../app/lib/actions/scheduleJobs.actions";
import { deleteEstimate } from "../app/lib/actions/estimates.actions";
import { deleteAvailability } from "../app/lib/actions/availability.actions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Loader2 } from "lucide-react";

interface DeleteModalProps {
  deleteText: string;
  deleteDesc: string;
  deletionId: string;
  deletingValue: string;
  isOpen?: boolean;
  onClose?: () => void;
}

const DeleteModal = ({
  deleteText,
  deleteDesc,
  deletionId,
  deletingValue,
  isOpen,
  onClose,
}: DeleteModalProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);

  // Determine if we're in controlled or uncontrolled mode
  const isControlled = isOpen !== undefined;
  const isModalOpen = isControlled ? isOpen : open;

  const handleOpenChange = (open: boolean) => {
    if (isControlled) {
      if (!open && onClose) {
        onClose();
      }
    } else {
      setOpen(open);
    }
  };

  const handleDelete = async (deletionId: string) => {
    setIsLoading(true);
    try {
      if (deletingValue === "client") {
        const deleteClientWithId = deleteClient.bind(
          null,
          deletionId.toString(),
        );
        await deleteClientWithId();
        handleOpenChange(false);
        setIsLoading(false);
        toast.success("Client and associated invoices deleted successfully");
      } else if (deletingValue === "invoice") {
        const deleteInvoiceWithId = deleteInvoice.bind(
          null,
          deletionId.toString(),
        );
        await deleteInvoiceWithId();
        handleOpenChange(false);
        setIsLoading(false);
        toast.success("Invoices deleted successfully");
      } else if (deletingValue === "job") {
        const deleteJobWithId = deleteJob.bind(null, deletionId.toString());
        await deleteJobWithId();
        setIsLoading(false);
        handleOpenChange(false);
        toast.success("Job deleted successfully");
      } else if (deletingValue === "estimate") {
        const deleteEstimateWithId = deleteEstimate.bind(
          null,
          deletionId.toString(),
        );
        await deleteEstimateWithId();
        setIsLoading(false);
        handleOpenChange(false);
        toast.success("Estimate deleted successfully");
      } else if (deletingValue === "availability") {
        const result = await deleteAvailability(deletionId.toString());
        if (!result.success) {
          toast.error(result.message || "Failed to delete availability");
        } else {
          handleOpenChange(false);
          toast.success("Availability deleted successfully");
        }
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Error deleting item:", error);
      toast.error("Database Error: Failed to delete");
      setIsLoading(false);
    }
  };

  const triggerButton = (
    <div className="flex justify-center">
      <Button variant="destructive" size="icon" className="size-8">
        <FaTrash className="h-4 w-4" />
      </Button>
    </div>
  );

  const dialogContent = (
    <DialogContent className="sm:max-w-lg">
      <DialogHeader>
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 fill-red-500"
              viewBox="0 0 24 24"
            >
              <path d="M19 7a1 1 0 0 0-1 1v11.191A1.92 1.92 0 0 1 15.99 21H8.01A1.92 1.92 0 0 1 6 19.191V8a1 1 0 0 0-2 0v11.191A3.918 3.918 0 0 0 8.01 23h7.98A3.918 3.918 0 0 0 20 19.191V8a1 1 0 0 0-1-1Zm1-3h-4V2a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v2H4a1 1 0 0 0 0 2h16a1 1 0 0 0 0-2ZM10 4V3h4v1Z" />
              <path d="M11 17v-7a1 1 0 0 0-2 0v7a1 1 0 0 0 2 0Zm4 0v-7a1 1 0 0 0-2 0v7a1 1 0 0 0 2 0Z" />
            </svg>
          </div>
          <DialogTitle className="wrap-break-word">{deleteText}</DialogTitle>
          <DialogDescription className="mt-2 wrap-break-word">
            {deleteDesc}
          </DialogDescription>
        </div>
      </DialogHeader>

      <DialogFooter className="flex-col gap-2 sm:flex-row">
        <Button
          variant="outline"
          onClick={() => handleOpenChange(false)}
          disabled={isLoading}
          className="w-full sm:w-auto"
        >
          Cancel
        </Button>
        <Button
          variant="destructive"
          onClick={() => handleDelete(deletionId)}
          disabled={isLoading}
          className="w-full sm:w-auto"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Deleting...
            </>
          ) : (
            "Delete"
          )}
        </Button>
      </DialogFooter>
    </DialogContent>
  );

  return (
    <Dialog open={isModalOpen} onOpenChange={handleOpenChange}>
      {!isControlled && <DialogTrigger asChild>{triggerButton}</DialogTrigger>}
      {dialogContent}
    </Dialog>
  );
};

export default DeleteModal;
