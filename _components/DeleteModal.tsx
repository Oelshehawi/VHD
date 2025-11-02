"use client";
import { useState } from "react";
import { deleteClient, deleteInvoice } from "../app/lib/actions/actions";
import toast from "react-hot-toast";
import { FaTrash } from "react-icons/fa";
import { deleteJob } from "../app/lib/actions/scheduleJobs.actions";
import { deleteEstimate } from "../app/lib/actions/estimates.actions";
import { deleteAvailability } from "../app/lib/actions/availability.actions";

const DeleteModal = ({
  deleteText,
  deleteDesc,
  deletionId,
  deletingValue,
  isOpen,
  onClose,
}: {
  deleteText: String;
  deleteDesc: String;
  deletionId: string;
  deletingValue: string;
  isOpen?: boolean;
  onClose?: () => void;
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);

  // Use external control if provided, otherwise use internal state
  const isModalOpen = isOpen !== undefined ? isOpen : open;
  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      setOpen(false);
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
        handleClose();
        setIsLoading(false);
        toast.success("Client and associated invoices deleted successfully");
      } else if (deletingValue === "invoice") {
        const deleteInvoiceWithId = deleteInvoice.bind(
          null,
          deletionId.toString(),
        );
        await deleteInvoiceWithId();
        handleClose();
        setIsLoading(false);
        toast.success("Invoices deleted successfully");
      } else if (deletingValue === "job") {
        const deleteJobWithId = deleteJob.bind(null, deletionId.toString());
        await deleteJobWithId();
        setIsLoading(false);
        handleClose();
        toast.success("Job deleted successfully");
      } else if (deletingValue === "estimate") {
        const deleteEstimateWithId = deleteEstimate.bind(
          null,
          deletionId.toString(),
        );
        await deleteEstimateWithId();
        setIsLoading(false);
        handleClose();
        toast.success("Estimate deleted successfully");
      } else if (deletingValue === "availability") {
        const result = await deleteAvailability(deletionId.toString());
        if (!result.success) {
          toast.error(result.message || "Failed to delete availability");
        } else {
          handleClose();
          toast.success("Availability deleted successfully");
        }
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Error deleting item:", error);
      toast.error("Database Error: Failed to delete");
    }
    return;
  };

  function classNames(...classes: (string | boolean | undefined)[]) {
    return classes.filter(Boolean).join(" ");
  }

  if (!isModalOpen) {
    // If controlled externally, don't render anything when closed
    if (isOpen !== undefined) {
      return null;
    }

    // Only render the delete button for internal state management
    return (
      <div className="flex justify-center">
        <FaTrash
          className="size-8 rounded bg-red-600 p-2 text-white hover:cursor-pointer hover:bg-red-800"
          onClick={() => setOpen(true)}
        />
      </div>
    );
  }

  return (
    <>
      {/* Only show the trigger button when using internal state management */}
      {isOpen === undefined && (
        <div className="flex justify-center">
          <FaTrash
            className="size-8 rounded bg-red-600 p-2 text-white hover:cursor-pointer hover:bg-red-800"
            onClick={() => {
              setOpen(true);
            }}
          />
        </div>
      )}

      {/* Modal content */}
      <div
        className="fixed inset-0 z-[1000] flex h-full w-full flex-wrap items-center justify-center overflow-auto p-4 font-[sans-serif] text-darkGray before:fixed before:inset-0 before:h-full before:w-full before:bg-[rgba(0,0,0,0.5)]"
        onClick={handleClose}
      >
        <div
          className="relative mx-4 w-full max-w-lg rounded-md bg-white p-6 shadow-lg"
          onClick={(e) => e.stopPropagation()}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="fill-black float-right w-3.5 shrink-0 cursor-pointer hover:fill-red-500"
            viewBox="0 0 320.591 320.591"
            onClick={handleClose}
          >
            <path
              d="M30.391 318.583a30.37 30.37 0 0 1-21.56-7.288c-11.774-11.844-11.774-30.973 0-42.817L266.643 10.665c12.246-11.459 31.462-10.822 42.921 1.424 10.362 11.074 10.966 28.095 1.414 39.875L51.647 311.295a30.366 30.366 0 0 1-21.256 7.288z"
              data-original="#000000"
            ></path>
            <path
              d="M287.9 318.583a30.37 30.37 0 0 1-21.257-8.806L8.83 51.963C-2.078 39.225-.595 20.055 12.143 9.146c11.369-9.736 28.136-9.736 39.504 0l259.331 257.813c12.243 11.462 12.876 30.679 1.414 42.922-.456.487-.927.958-1.414 1.414a30.368 30.368 0 0 1-23.078 7.288z"
              data-original="#000000"
            ></path>
          </svg>
          <div className="my-8 text-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="inline w-16 fill-red-500"
              viewBox="0 0 24 24"
            >
              <path
                d="M19 7a1 1 0 0 0-1 1v11.191A1.92 1.92 0 0 1 15.99 21H8.01A1.92 1.92 0 0 1 6 19.191V8a1 1 0 0 0-2 0v11.191A3.918 3.918 0 0 0 8.01 23h7.98A3.918 3.918 0 0 0 20 19.191V8a1 1 0 0 0-1-1Zm1-3h-4V2a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v2H4a1 1 0 0 0 0 2h16a1 1 0 0 0 0-2ZM10 4V3h4v1Z"
                data-original="#000000"
              />
              <path
                d="M11 17v-7a1 1 0 0 0-2 0v7a1 1 0 0 0 2 0Zm4 0v-7a1 1 0 0 0-2 0v7a1 1 0 0 0 2 0Z"
                data-original="#000000"
              />
            </svg>
            <h4 className="text-black mt-6 break-words text-xl font-semibold">
              {deleteText}
            </h4>
            <p className="mt-4 break-words text-sm leading-relaxed text-gray-500">
              {deleteDesc}
            </p>
          </div>
          <div className="flex flex-col space-y-2">
            <button
              type="button"
              className="flex items-center justify-center rounded-md border-none bg-red-500 px-6 py-2.5 text-sm font-semibold text-white outline-none hover:bg-red-600 active:bg-red-500"
              onClick={() => handleDelete(deletionId)}
              disabled={isLoading}
            >
              {isLoading ? (
                <svg
                  className="mr-3 h-5 w-5 animate-spin text-white"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 2.42.878 4.628 2.322 6.291l1.678-1.659z"
                  ></path>
                </svg>
              ) : (
                "Delete"
              )}
            </button>
            <button
              type="button"
              className="text-black rounded-md border-none bg-gray-200 px-6 py-2.5 text-sm font-semibold outline-none hover:bg-gray-300 active:bg-gray-200"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default DeleteModal;
