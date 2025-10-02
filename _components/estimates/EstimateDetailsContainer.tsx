"use client";
import { useState } from "react";
import { FaChevronRight, FaFileInvoice, FaUser, FaCalculator, FaPenSquare } from "react-icons/fa";
import Link from "next/link";
import InlineEditEstimate from "./InlineEditEstimate";
import GeneratePDF from "../pdf/GeneratePDF";
import { type EstimateData } from "../pdf/EstimatePdfDocument";
import { EstimateType, ClientType } from "../../app/lib/typeDefinitions";
import { formatDateStringUTC } from "../../app/lib/utils";

interface EstimateDetailsContainerProps {
  estimate: EstimateType;
  clients: ClientType[];
  canManage: boolean;
  estimateId: string;
}

const EstimateDetailsContainer = ({
  estimate,
  clients,
  canManage,
  estimateId,
}: EstimateDetailsContainerProps) => {
  const [isEditing, setIsEditing] = useState(false);

  const toggleEdit = () => {
    setIsEditing(!isEditing);
  };

  // Calculate totals from items with proper rounding
  const subtotal = Math.round(estimate.items.reduce((sum, item) => sum + item.price, 0) * 100) / 100;
  const gst = Math.round(subtotal * 0.05 * 100) / 100; // 5% GST
  const total = Math.round((subtotal + gst) * 100) / 100;

  // Get client name
  const clientName = estimate.prospectInfo?.businessName || "Unknown Client";

  // Prepare estimate data for PDF generation
  const estimateData: EstimateData = {
    estimateNumber: estimate.estimateNumber,
    createdDate: new Date(estimate.createdDate).toLocaleDateString(),
    clientName,
    contactPerson: estimate.prospectInfo?.contactPerson,
    email: estimate.prospectInfo?.email,
    phone: estimate.prospectInfo?.phone,
    address: estimate.prospectInfo?.address,
    projectLocation: estimate.prospectInfo?.projectLocation,
    items: estimate.items.map((item) => ({
      description: item.description,
      details: item.details || "",
      price: item.price,
    })),
    subtotal,
    gst,
    total,
    services: estimate.services && estimate.services.length > 0
      ? estimate.services
      : [
          "Hood from inside and outside",
          "All filters",
          "Access panels to duct work (accessible area only)",
          "Rooftop fan (If safe access)",
          "Fire wall behind equipment",
          "ASTTBC Sticker",
          "Fire Dept Report",
          "Before/After pictures",
        ],
    terms: estimate.terms,
  };

  // Status styling helper
  const getStatusStyles = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800 ring-green-600/20";
      case "rejected":
        return "bg-red-100 text-red-800 ring-red-600/20";
      case "sent":
        return "bg-yellow-100 text-yellow-800 ring-yellow-600/20";
      case "draft":
      default:
        return "bg-gray-100 text-gray-800 ring-gray-600/20";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "approved":
        return "Approved";
      case "rejected":
        return "Rejected";
      case "sent":
        return "Sent";
      case "draft":
      default:
        return "Draft";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl h-full">
        {/* Header Section */}
        <div className="bg-white shadow-sm border-b border-gray-200 rounded-t-xl">
          <div className="px-4 sm:px-6 lg:px-8">
            {/* Breadcrumb Navigation */}
            <nav className="flex items-center space-x-2 py-3 text-sm" aria-label="Breadcrumb">
              <Link 
                href="/estimates" 
                className="flex items-center text-gray-500 hover:text-gray-700 transition-colors duration-200"
              >
                <FaCalculator className="mr-1 h-4 w-4" />
                Estimates
              </Link>
              <FaChevronRight className="h-3 w-3 text-gray-400" />
              <span className="flex items-center text-gray-500">
                <FaUser className="mr-1 h-4 w-4" />
                {estimate.prospectInfo?.businessName || "Prospect"}
              </span>
              <FaChevronRight className="h-3 w-3 text-gray-400" />
              <span className="flex items-center font-medium text-gray-900">
                <FaFileInvoice className="mr-1 h-4 w-4" />
                {estimate.estimateNumber}
              </span>
            </nav>

            {/* Page Header */}
            <div className="pb-4 pt-2">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center">
                    <h1 className="text-xl font-bold leading-7 text-gray-900 sm:truncate sm:text-2xl">
                      Estimate {estimate.estimateNumber}
                    </h1>
                    <span className={`ml-3 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${getStatusStyles(estimate.status)}`}>
                      {getStatusText(estimate.status)}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-col sm:mt-0 sm:flex-row sm:flex-wrap sm:space-x-6">
                    <div className="mt-2 flex items-center text-sm text-gray-500">
                      <span className="font-medium">Business:</span>
                      <span className="ml-1 truncate">{estimate.prospectInfo?.businessName || "N/A"}</span>
                    </div>
                    <div className="mt-2 flex items-center text-sm text-gray-500">
                      <span className="font-medium">Type:</span>
                      <span className="ml-1 text-gray-500">
                        {estimate.clientId ? "Existing Client" : "Prospect"}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center text-sm text-gray-500">
                      <span className="font-medium">Created:</span>
                      <span className="ml-1">
                        {formatDateStringUTC(estimate.createdDate)}
                      </span>
                    </div>
                    {estimate.convertedToInvoice && (
                      <div className="mt-2 flex items-center text-sm text-purple-600">
                        <span className="font-medium">Converted to Invoice</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Action Buttons */}
                {canManage && (
                  <div className="mt-4 sm:mt-0 flex gap-3">
                    <button
                      onClick={toggleEdit}
                      className="inline-flex items-center rounded-lg bg-gray-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                    >
                      <FaPenSquare className="mr-2 h-4 w-4" />
                      <span>{isEditing ? 'Cancel Edit' : 'Edit Estimate'}</span>
                    </button>
                    <GeneratePDF
                      pdfData={{ type: "estimate", data: estimateData }}
                      fileName={`${estimateData.clientName} - Estimate.pdf`}
                      buttonText="Download PDF"
                      className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      showScaleSelector={true}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-b-xl shadow-lg h-[calc(100vh-200px)] overflow-hidden">
          <div className="p-4 sm:p-6 lg:p-8 h-full overflow-y-auto">
            <div className="space-y-6">
              {/* Estimate Details */}
              <InlineEditEstimate
                estimate={estimate}
                isEditing={isEditing}
                toggleEdit={toggleEdit}
                canManage={canManage}
                clients={clients}
              />


            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EstimateDetailsContainer; 