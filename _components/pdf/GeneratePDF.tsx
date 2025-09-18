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
}

const GeneratePDF: React.FC<GeneratePDFProps> = ({
  pdfData,
  fileName,
  buttonText = "Generate PDF",
  className = "inline-flex items-center rounded bg-darkBlue px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50",
}) => {
  const [isClient, setIsClient] = useState(false);

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
    switch (pdfData.type) {
      case "invoice":
        return <InvoicePdfDocument invoiceData={pdfData.data} />;
      case "clientInvoice":
        return <InvoicePdfDocument invoiceData={pdfData.data} />;
      case "estimate":
        return <EstimatePdfDocument estimateData={pdfData.data} />;
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
  );
};

export default GeneratePDF;
export type { PDFData, ReceiptData };
