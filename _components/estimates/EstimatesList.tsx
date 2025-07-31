"use client";

import { EstimateType } from "../../app/lib/typeDefinitions";
import EstimateStatusBadge from "./EstimateStatusBadge";
import EstimateActions from "./EstimateActions";
import Pagination from "../database/Pagination";
import Link from "next/link";

interface EstimatesListProps {
  estimates: EstimateType[];
  currentPage: number;
  totalPages: number;
  onEdit: (estimate: EstimateType) => void;
}

export default function EstimatesList({
  estimates,
  currentPage,
  totalPages,
  onEdit,
}: EstimatesListProps) {
  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString("en-CA");
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency: "CAD",
    }).format(amount);
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
      <div className="flex min-h-[70vh] items-center justify-center rounded bg-darkGreen/90">
        <p className="text-xl font-semibold text-white">No estimates found</p>
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
                        {formatDate(estimate.createdDate)}
                      </div>
                      <div className="flex items-center gap-3">
                        <EstimateStatusBadge status={estimate.status} />
                        <span className="text-sm font-medium text-white">
                          {formatCurrency(estimate.total)}
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
                  {formatDate(estimate.createdDate)}
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
                    {formatCurrency(estimate.total)}
                  </div>
                  <div className="text-sm text-lightGray">
                    +{formatCurrency(estimate.gst)} GST
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-center gap-3">
                    <EstimateActions
                      estimate={estimate}
                      onEdit={onEdit}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination totalPages={totalPages} />
        </div>
      )}
    </div>
  );
}
