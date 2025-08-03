"use client";

import { EstimateType } from "../../app/lib/typeDefinitions";
import EstimateStatusBadge from "./EstimateStatusBadge";
import Link from "next/link";
import { FaPenSquare, FaTrash } from "react-icons/fa";
import { formatDateStringUTC } from "../../app/lib/utils";

interface EstimatesListProps {
  estimates: EstimateType[];
  currentPage: number;
  totalPages: number;
  onEdit: (estimate: EstimateType) => void;
  onDelete: (estimate: EstimateType) => void;
}

export default function EstimatesList({
  estimates,
  currentPage,
  totalPages,
  onEdit,
  onDelete,
}: EstimatesListProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency: "CAD",
    }).format(amount);
  };

  const calculateTotals = (estimate: EstimateType) => {
    const subtotal = Math.round((estimate.items?.reduce((sum, item) => sum + (Number(item.price) || 0), 0) || 0) * 100) / 100;
    const gst = Math.round(subtotal * 0.05 * 100) / 100; // 5% GST
    const total = Math.round((subtotal + gst) * 100) / 100;
    return { subtotal, gst, total };
  };

  const getClientName = (estimate: EstimateType) => {
    if (estimate.clientId && (estimate as any).clientId?.clientName) {
      return (estimate as any).clientId.clientName;
    }
    return estimate.prospectInfo?.businessName || "Unknown";
  };

  const getContactInfo = (estimate: EstimateType) => {
    if (estimate.clientId && (estimate as any).clientId?.email) {
      return (estimate as any).clientId.email;
    }
    return estimate.prospectInfo?.email || estimate.prospectInfo?.phone || "-";
  };

  if (!estimates.length) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center rounded-xl bg-darkGray border border-borderGreen">
        <div className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-darkGreen flex items-center justify-center border border-borderGreen">
            <svg className="h-8 w-8 text-lightGray" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-xl font-semibold text-white mb-2">No estimates found</p>
          <p className="text-lightGray">Try adjusting your search or filters</p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-borderGreen bg-darkGreen shadow-lg">
      {/* Table Container */}
      <div className="overflow-auto">
        <table className="w-full">
          <thead className="bg-darkBlue border-b border-borderGreen">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                Estimate #
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                Client/Prospect
              </th>
              <th className="hidden px-6 py-4 text-left text-sm font-semibold text-white md:table-cell">
                Created Date
              </th>
              <th className="hidden px-6 py-4 text-left text-sm font-semibold text-white md:table-cell">
                Status
              </th>
              <th className="hidden px-6 py-4 text-left text-sm font-semibold text-white md:table-cell">
                Total
              </th>
              <th className="px-6 py-4 text-center text-sm font-semibold text-white">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-borderGreen">
            {estimates.map((estimate: EstimateType, index: number) => (
              <tr
                key={estimate._id as string}
                className="bg-darkGreen/70 transition-all duration-200 hover:bg-darkGreen"
              >
                <td className="px-6 py-4">
                  <Link
                    href={`/estimates/${estimate._id}`}
                    className="font-semibold text-white hover:text-blue-300 transition-colors duration-200"
                  >
                    {estimate.estimateNumber}
                  </Link>
                </td>
                <td className="px-6 py-4">
                  <div>
                    <div className="font-medium text-white mb-1">
                      {getClientName(estimate)}
                    </div>
                    <div className="md:hidden space-y-2">
                      <div className="text-sm text-lightGray">
                        {formatDateStringUTC(estimate.createdDate)}
                      </div>
                      <div className="flex items-center gap-3">
                        <EstimateStatusBadge status={estimate.status} />
                        <span className="text-sm font-medium text-white">
                          {formatCurrency(calculateTotals(estimate).total)}
                        </span>
                      </div>
                      {estimate.convertedToInvoice && (
                        <div className="mt-1">
                          <span className="inline-flex items-center rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-800">
                            Converted
                          </span>
                        </div>
                      )}
                    </div>
                    {estimate.prospectInfo?.contactPerson && (
                      <div className="text-sm text-lightGray">
                        Attn: {estimate.prospectInfo.contactPerson}
                      </div>
                    )}
                  </div>
                </td>
                <td className="hidden px-6 py-4 text-sm text-lightGray md:table-cell">
                  {formatDateStringUTC(estimate.createdDate)}
                </td>
                <td className="hidden px-6 py-4 md:table-cell">
                  <EstimateStatusBadge status={estimate.status} />
                  {estimate.convertedToInvoice && (
                    <div className="mt-1">
                      <span className="inline-flex items-center rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-800">
                        Converted
                      </span>
                    </div>
                  )}
                </td>
                <td className="hidden px-6 py-4 text-sm font-semibold text-white md:table-cell">
                  <div className="font-medium">
                    {formatCurrency(calculateTotals(estimate).total)}
                  </div>
                  <div className="text-sm text-lightGray">
                    +{formatCurrency(calculateTotals(estimate).gst)} GST
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-center gap-3">
                    <Link
                      href={`/estimates/${estimate._id}`}
                      className="flex h-9 w-9 items-center justify-center rounded-lg bg-darkBlue border border-borderGreen text-lightGray transition-all duration-200 hover:bg-darkGreen hover:scale-110"
                      title="Edit Estimate"
                    >
                      <FaPenSquare className="h-4 w-4" />
                    </Link>
                    <button
                      onClick={() => onDelete(estimate)}
                      className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-600 border border-red-500 text-white transition-all duration-200 hover:bg-red-700 hover:scale-110"
                      title="Delete Estimate"
                    >
                      <FaTrash className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
