"use client";

import React, { useState } from "react";
import { Printer, Loader2 } from "lucide-react";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { toast } from "sonner";
import InvoicePdfDocument, { type InvoiceData } from "./InvoicePdfDocument";
import EstimatePdfDocument, { type EstimateData } from "./EstimatePdfDocument";
import ReceiptPdfDocument, { type ReceiptData } from "./ReceiptPdfDocument";
import ReportPdfDocument, {
  type ReportData,
  type TechnicianData,
} from "./ReportPdfDocument";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Label } from "../ui/label";
import { Button } from "../ui/button";

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
  className,
  showScaleSelector = false,
}) => {
  const [scale, setScale] = useState(80); // Default 90%

  // Handle undefined pdfData
  if (!pdfData) {
    return (
      <Button disabled variant="outline">
        <Printer className="mr-2 h-4 w-4" />
        <span>No Data</span>
      </Button>
    );
  }

  // Generate the appropriate document based on data type
  const generateDocument = () => {
    const scaleValue = scale / 100; // Convert percentage to decimal

    switch (pdfData.type) {
      case "invoice":
        return (
          <InvoicePdfDocument invoiceData={pdfData.data} scale={scaleValue} />
        );
      case "clientInvoice":
        return (
          <InvoicePdfDocument invoiceData={pdfData.data} scale={scaleValue} />
        );
      case "estimate":
        return (
          <EstimatePdfDocument estimateData={pdfData.data} scale={scaleValue} />
        );
      case "receipt":
        return <ReceiptPdfDocument receiptData={pdfData.data} />;
      case "report":
        return (
          <ReportPdfDocument
            report={pdfData.data.report}
            technician={pdfData.data.technician}
            scale={scaleValue}
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

  const document = generateDocument();
  if (!document) {
    return (
      <Button disabled variant="outline">
        <Printer className="mr-2 h-4 w-4" />
        <span>Error</span>
      </Button>
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
    <div className="flex flex-wrap items-center gap-2">
      {showScaleSelector &&
        (pdfData.type === "estimate" ||
          pdfData.type === "invoice" ||
          pdfData.type === "clientInvoice" ||
          pdfData.type === "report") && (
          <div className="flex items-center gap-2">
            <Label htmlFor="pdf-scale" className="text-sm font-medium">
              Size:
            </Label>
            <Select
              value={scale.toString()}
              onValueChange={(value) => setScale(Number(value))}
            >
              <SelectTrigger id="pdf-scale" className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="70">70%</SelectItem>
                <SelectItem value="75">75%</SelectItem>
                <SelectItem value="80">80%</SelectItem>
                <SelectItem value="85">85%</SelectItem>
                <SelectItem value="90">90%</SelectItem>
                <SelectItem value="95">95%</SelectItem>
                <SelectItem value="100">100%</SelectItem>
                <SelectItem value="105">105%</SelectItem>
                <SelectItem value="110">110%</SelectItem>
                <SelectItem value="115">115%</SelectItem>
                <SelectItem value="120">120%</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

      <PDFDownloadLink document={document} fileName={generateFileName()}>
        {({ loading }) => (
          <Button
            variant="default"
            disabled={loading}
            onClick={handleDownloadClick}
            className={className}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Printer className="mr-2 h-4 w-4" />
                <span>{buttonText}</span>
              </>
            )}
          </Button>
        )}
      </PDFDownloadLink>
    </div>
  );
};

export default GeneratePDF;
export type { PDFData, ReceiptData };
