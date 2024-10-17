"use client";

import axios from "axios";
import { useState } from "react";
import { FaEllipsisV, FaPrint } from "react-icons/fa";
import toast from "react-hot-toast";

interface GeneratePaystubProps {
  technicianId: string;
  payrollPeriodId: string;
  technicianName: string;
}

const GeneratePaystub = ({
  technicianName,
  technicianId,
  payrollPeriodId,
}: GeneratePaystubProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleGeneratePaystub = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`/payroll/pdf`, {
        params: { technicianId, payrollPeriodId },
        responseType: "blob",
      });

      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${technicianName.trim()} - Paystub.pdf`);

      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("Paystub downloaded successfully!");
    } catch (error) {
      console.error("Error generating paystub:", error);
      toast.error("Failed to generate paystub.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleGeneratePaystub}
      className={`flex items-center p-2 text-gray-500 hover:text-gray-700 focus:outline-none ${isLoading ? "cursor-not-allowed opacity-50" : ""}`}
      disabled={isLoading}
    >
      <FaPrint className="mr-2 h-4 w-4" aria-hidden="true" />
      {isLoading ? "Generating..." : "Generate Paystub"}
    </button>
  );
};

export default GeneratePaystub;
