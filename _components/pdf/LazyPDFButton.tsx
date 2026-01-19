"use client";

import React, { useState, useCallback } from "react";
import { Printer, Loader2, Download } from "lucide-react";
import { pdf } from "@react-pdf/renderer";
import { Button } from "../ui/button";
import InvoicePdfDocument, { type InvoiceData } from "./InvoicePdfDocument";
import EstimatePdfDocument, { type EstimateData } from "./EstimatePdfDocument";
import ReceiptPdfDocument, { type ReceiptData } from "./ReceiptPdfDocument";
import ReportPdfDocument, {
  type ReportData,
  type TechnicianData,
} from "./ReportPdfDocument";
import { toast } from "sonner";

const INVALID_FILENAME_CHARS = /[\/\\:*?"<>|\u0000-\u001F]/g;

const sanitizeFileName = (value: string, fallback: string) => {
  const trimmed = value.trim();
  const cleaned = trimmed.replace(INVALID_FILENAME_CHARS, "");
  const collapsed = cleaned.replace(/\s+/g, " ").trim();
  const baseName = collapsed || fallback;
  return baseName.toLowerCase().endsWith(".pdf")
    ? baseName
    : `${baseName}.pdf`;
};

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

interface LazyPDFButtonProps {
  pdfData?: PDFData;
  fileName?: string;
  buttonText?: string;
  className?: string;
  variant?: "default" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  showIcon?: boolean;
  iconType?: "printer" | "download";
}

/**
 * A lazy-loading PDF button that only generates the PDF when clicked.
 * This prevents the performance issue where PDFDownloadLink generates
 * PDFs on mount, causing multiple network requests.
 */
const LazyPDFButton: React.FC<LazyPDFButtonProps> = ({
  pdfData,
  fileName,
  buttonText = "Download PDF",
  className,
  variant = "default",
  size = "default",
  showIcon = true,
  iconType = "printer",
}) => {
  const [isGenerating, setIsGenerating] = useState(false);

  // Generate the appropriate document based on data type
  const generateDocument = useCallback(() => {
    if (!pdfData) return null;

    const scale = 1; // Default scale

    switch (pdfData.type) {
      case "invoice":
      case "clientInvoice":
        return (
          <InvoicePdfDocument invoiceData={pdfData.data} scale={scale} />
        );
      case "estimate":
        return (
          <EstimatePdfDocument estimateData={pdfData.data} scale={scale} />
        );
      case "receipt":
        return <ReceiptPdfDocument receiptData={pdfData.data} />;
      case "report":
        return (
          <ReportPdfDocument
            report={pdfData.data.report}
            technician={pdfData.data.technician}
            scale={scale}
          />
        );
      default:
        return null;
    }
  }, [pdfData]);

  // Generate filename based on data type
  const generateFileName = useCallback(() => {
    if (fileName) return sanitizeFileName(fileName, "document.pdf");
    if (!pdfData) return "document.pdf";

    switch (pdfData.type) {
      case "invoice":
      case "clientInvoice":
        return sanitizeFileName(
          `Invoice - ${pdfData.data.jobTitle.trim()}`,
          "invoice.pdf",
        );
      case "estimate":
        return sanitizeFileName(
          `Estimate - ${pdfData.data.clientName.trim()}`,
          "estimate.pdf",
        );
      case "receipt":
        return sanitizeFileName(
          `Receipt - ${pdfData.data.jobTitle.trim()}`,
          "receipt.pdf",
        );
      case "report":
        return sanitizeFileName(
          `Report - ${pdfData.data.report._id}`,
          "report.pdf",
        );
      default:
        return "document.pdf";
    }
  }, [fileName, pdfData]);

  const handleClick = async () => {
    if (!pdfData || isGenerating) return;

    setIsGenerating(true);

    try {
      const document = generateDocument();
      if (!document) {
        toast.error("Failed to generate PDF document");
        return;
      }

      // Generate the PDF blob
      const blob = await pdf(document).toBlob();

      // Create a download link and trigger it
      const url = URL.createObjectURL(blob);
      const link = window.document.createElement("a");
      link.href = url;
      link.download = generateFileName();
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);

      // Clean up the URL object
      URL.revokeObjectURL(url);

      // Show success toast
      const fileType =
        pdfData.type === "report"
          ? "Report"
          : pdfData.type === "receipt"
            ? "Receipt"
            : pdfData.type === "estimate"
              ? "Estimate"
              : "Invoice";
      toast.success(`${fileType} PDF downloaded successfully!`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle undefined pdfData
  if (!pdfData) {
    return (
      <Button disabled variant="outline" size={size} className={className}>
        {showIcon && <Printer className="mr-2 h-4 w-4" />}
        <span>No Data</span>
      </Button>
    );
  }

  const Icon = iconType === "download" ? Download : Printer;

  return (
    <Button
      variant={variant}
      size={size}
      disabled={isGenerating}
      onClick={handleClick}
      className={className}
    >
      {isGenerating ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          <span>Generating...</span>
        </>
      ) : (
        <>
          {showIcon && <Icon className="mr-2 h-4 w-4" />}
          <span>{buttonText}</span>
        </>
      )}
    </Button>
  );
};

export default LazyPDFButton;
export type { PDFData };
