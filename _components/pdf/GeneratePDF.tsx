"use client";

import React, { useState, useEffect } from "react";
import { FaPrint } from "react-icons/fa";
import { PDFDownloadLink } from "@react-pdf/renderer";
import toast from "react-hot-toast";
import InvoicePdfDocument, { type InvoiceData } from "./InvoicePdfDocument";
import EstimatePdfDocument, { type EstimateData } from "./EstimatePdfDocument";
import ReceiptPdfDocument, { type ReceiptData } from "./ReceiptPdfDocument";
import ReportPdfDocument, {
  type ReportData,
  type TechnicianData,
} from "./ReportPdfDocument";

// Union type for all possible PDF data types
type PDFData =
  | { type: "invoice"; data: InvoiceData }
  | { type: "clientInvoice"; data: InvoiceData }
  | { type: "estimate"; data: EstimateData }
  | { type: "receipt"; data: ReceiptData }
  | {
      type: "report";
      data: { report: ReportData; technician: TechnicianData };
    };

interface GeneratePDFProps {
  pdfData?: PDFData;
  fileName?: string;
  buttonText?: string;
  className?: string;
  showScaleSelector?: boolean; // Show scale selector for estimates
}

const GeneratePDF: React.FC<GeneratePDFProps> = ({
  pdfData,
  fileName,
  buttonText = "Generate PDF",
  className = "inline-flex items-center rounded bg-darkBlue px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50",
  showScaleSelector = false,
}) => {
  const [isClient, setIsClient] = useState(false);
  const [scale, setScale] = useState(100); // Default 100%

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Handle undefined pdfData
  if (!pdfData) {
    return (
      <button className={className} disabled>
        <FaPrint className="lg:mr-2" />
        <span>No Data</span>
      </button>
    );
  }

  // Generate the appropriate document based on data type
  const generateDocument = () => {
    const scaleValue = scale / 100; // Convert percentage to decimal

    switch (pdfData.type) {
      case "invoice":
        return <InvoicePdfDocument invoiceData={pdfData.data} />;
      case "clientInvoice":
        return <InvoicePdfDocument invoiceData={pdfData.data} />;
      case "estimate":
        return <EstimatePdfDocument estimateData={pdfData.data} scale={scaleValue} />;
      case "receipt":
        return <ReceiptPdfDocument receiptData={pdfData.data} />;
      case "report":
        return (
          <ReportPdfDocument
            report={pdfData.data.report}
            technician={pdfData.data.technician}
          />
        );
      default:
        return null;
    }
  };

  // Generate filename based on data type
  const generateFileName = () => {
    if (fileName) return fileName;

    switch (pdfData.type) {
      case "invoice":
        return `Invoice - ${pdfData.data.jobTitle.trim()}.pdf`;
      case "clientInvoice":
        return `Invoice - ${pdfData.data.jobTitle.trim()}.pdf`;
      case "estimate":
        return `Estimate - ${pdfData.data.clientName.trim()}.pdf`;
      case "receipt":
        return `Receipt - ${pdfData.data.jobTitle.trim()}.pdf`;
      case "report":
        return `Report - ${pdfData.data.report._id}.pdf`;
      default:
        return "document.pdf";
    }
  };

  // Show loading button during SSR and initial client render
  if (!isClient) {
    return (
      <button className={className} disabled>
        <FaPrint className="lg:mr-2" />
        <span>Loading...</span>
      </button>
    );
  }

  const document = generateDocument();
  if (!document) {
    return (
      <button className={className} disabled>
        <FaPrint className="lg:mr-2" />
        <span>Error</span>
      </button>
    );
  }

  const handleDownloadClick = () => {
    // Show success toast after a short delay to allow download to start
    setTimeout(() => {
      const fileType =
        pdfData.type === "report"
          ? "Report"
          : pdfData.type === "receipt"
            ? "Receipt"
            : "Invoice";
      toast.success(`${fileType} PDF downloaded successfully!`);
    }, 500);
  };

  return (
    <div className="flex items-center gap-2">
      {showScaleSelector && pdfData.type === "estimate" && (
        <div className="flex items-center gap-2">
          <label htmlFor="pdf-scale" className="text-sm font-medium text-gray-700">
            Size:
          </label>
          <select
            id="pdf-scale"
            value={scale}
            onChange={(e) => setScale(Number(e.target.value))}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value={70}>70%</option>
            <option value={75}>75%</option>
            <option value={80}>80%</option>
            <option value={85}>85%</option>
            <option value={90}>90%</option>
            <option value={95}>95%</option>
            <option value={100}>100%</option>
            <option value={105}>105%</option>
            <option value={110}>110%</option>
            <option value={115}>115%</option>
            <option value={120}>120%</option>
          </select>
        </div>
      )}

      <PDFDownloadLink document={document} fileName={generateFileName()}>
        {({ loading, error }) => (
          <button
            className={className}
            disabled={loading}
            onClick={handleDownloadClick}
          >
            {loading ? (
              <>
                <FaPrint className="lg:mr-2" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <FaPrint className="lg:mr-2" />
                <span>{buttonText}</span>
              </>
            )}
          </button>
        )}
      </PDFDownloadLink>
    </div>
  );
};

export default GeneratePDF;
export type { PDFData, ReceiptData };
