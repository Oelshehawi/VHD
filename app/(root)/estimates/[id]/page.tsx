import { Suspense } from "react";
import { fetchEstimateById } from "../../../lib/estimates.data";
import { EstimateType } from "../../../lib/typeDefinitions";
import { formatDateStringUTC } from "../../../lib/utils";
import Link from "next/link";
import { FaChevronRight, FaFileInvoice, FaUser, FaCalculator } from "react-icons/fa";
import { notFound } from "next/navigation";
// @ts-ignore
import { auth } from "@clerk/nextjs/server";

const EstimateDetailed = async ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  const { id } = await params;
  const estimateId = id;
  
  try {
    const { sessionClaims } = await auth();
    const canManage = (sessionClaims as any)?.isManager?.isManager === true;

    const estimate = await fetchEstimateById(estimateId);
    if (!estimate) {
      notFound();
    }

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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        {/* Header Section */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="mx-auto max-w-[95%] px-4 sm:px-6 lg:px-8">
            {/* Breadcrumb Navigation */}
            <nav className="flex items-center space-x-2 py-4 text-sm" aria-label="Breadcrumb">
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
            <div className="pb-6 pt-2">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center">
                    <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl">
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
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="mx-auto max-w-[95%] px-4 py-8 sm:px-6 lg:px-8">
          <div className="overflow-hidden">
            <Suspense 
              fallback={
                <div className="space-y-6">
                  <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
                    <div className="space-y-3">
                      <div className="h-4 bg-gray-200 rounded"></div>
                      <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                      <div className="h-4 bg-gray-200 rounded w-4/6"></div>
                    </div>
                  </div>
                </div>
              }
            >
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Estimate Details */}
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Estimate Details</h2>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Business Name</label>
                        <p className="mt-1 text-sm text-gray-900">{estimate.prospectInfo?.businessName || "N/A"}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Project Location</label>
                        <p className="mt-1 text-sm text-gray-900">{estimate.prospectInfo?.projectLocation || "N/A"}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Notes</label>
                        <p className="mt-1 text-sm text-gray-900">{estimate.notes || "No notes provided"}</p>
                      </div>
                    </div>
                  </div>

                  {/* Prospect Information */}
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Prospect Information</h2>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Contact Person</label>
                        <p className="mt-1 text-sm text-gray-900">{estimate.prospectInfo?.contactPerson || "N/A"}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <p className="mt-1 text-sm text-gray-900">{estimate.prospectInfo?.email || "N/A"}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Phone</label>
                        <p className="mt-1 text-sm text-gray-900">{estimate.prospectInfo?.phone || "N/A"}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Items */}
                <div className="mt-8">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Items</h2>
                  <div className="overflow-hidden rounded-lg border border-gray-200">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Description
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Price
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {estimate.items.map((item, index) => (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {item.description}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                              ${item.price.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-gray-50">
                        <tr>
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">
                            Subtotal
                          </td>
                          <td className="px-6 py-4 text-sm font-medium text-gray-900 text-right">
                            ${estimate.subtotal.toFixed(2)}
                          </td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">
                            GST (5%)
                          </td>
                          <td className="px-6 py-4 text-sm font-medium text-gray-900 text-right">
                            ${estimate.gst.toFixed(2)}
                          </td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 text-lg font-bold text-gray-900">
                            Total
                          </td>
                          <td className="px-6 py-4 text-lg font-bold text-gray-900 text-right">
                            ${estimate.total.toFixed(2)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                {/* Actions */}
                {canManage && (
                  <div className="mt-8 flex justify-end space-x-4">
                    <Link
                      href={`/estimates/${estimateId}/pdf`}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <FaFileInvoice className="mr-2 h-4 w-4" />
                      Download PDF
                    </Link>
                  </div>
                )}
              </div>
            </Suspense>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error fetching estimate data:", error);
    notFound();
  }
};

export default EstimateDetailed; 