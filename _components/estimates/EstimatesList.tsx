"use client";

import { EstimateType } from "../../app/lib/typeDefinitions";
import EstimateStatusBadge from "./EstimateStatusBadge";
import EstimateActions from "./EstimateActions";
import Pagination from "../database/Pagination";

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
    <div className="space-y-4">
      <div className="rounded-lg border border-borderGreen bg-darkGreen/10 shadow-lg">
        <div className="flex flex-col overflow-hidden rounded-lg">
          <div className="flex-grow overflow-auto">
            <table className="relative w-full border-collapse">
              <thead className="sticky top-0 z-10">
                <tr className="bg-darkGreen text-white">
                  <th className="whitespace-nowrap px-4 py-3.5 text-left font-semibold">
                    Estimate #
                  </th>
                  <th className="whitespace-nowrap px-4 py-3.5 text-left font-semibold">
                    Client/Prospect
                  </th>
                  <th className="hidden whitespace-nowrap px-4 py-3.5 text-left font-semibold md:table-cell">
                    Created Date
                  </th>
                  <th className="hidden whitespace-nowrap px-4 py-3.5 text-left font-semibold md:table-cell">
                    Status
                  </th>
                  <th className="hidden whitespace-nowrap px-4 py-3.5 text-left font-semibold md:table-cell">
                    Total
                  </th>
                  <th className="whitespace-nowrap px-4 py-3.5 text-center font-semibold">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-darkGreen/20">
                {estimates.map((estimate: EstimateType, index: number) => (
                  <tr
                    key={estimate._id as string}
                    className={`bg-darkGreen/70 transition-colors hover:bg-darkGreen/90 ${
                      index === estimates.length - 1 ? "h-full" : ""
                    }`}
                  >
                    <td className="px-4 py-3 text-white">
                      <div className="font-medium">
                        {estimate.estimateNumber}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-white">
                      <div className="font-medium">
                        {getClientName(estimate)}
                      </div>
                      <div className="space-y-1 md:hidden">
                        <div className="text-gray-200">
                          {formatDate(estimate.createdDate)}
                        </div>
                        <div className="flex items-center gap-2">
                          <EstimateStatusBadge status={estimate.status} />
                          <span className="text-gray-200">
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
                        <div className="text-sm text-gray-200">
                          Attn: {estimate.prospectInfo.contactPerson}
                        </div>
                      )}
                    </td>
                    <td className="hidden px-4 py-3 text-white md:table-cell">
                      {formatDate(estimate.createdDate)}
                    </td>
                    <td className="hidden px-4 py-3 md:table-cell">
                      <EstimateStatusBadge status={estimate.status} />
                      {estimate.convertedToInvoice && (
                        <div className="mt-1">
                          <span className="inline-flex items-center rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-800">
                            Converted
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="hidden px-4 py-3 text-white md:table-cell">
                      <div className="font-medium">
                        {formatCurrency(estimate.total)}
                      </div>
                      <div className="text-sm text-gray-200">
                        +{formatCurrency(estimate.gst)} GST
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-3">
                        <EstimateActions
                          estimate={estimate}
                          onEdit={onEdit}
                          onRefresh={() => window.location.reload()}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
                {estimates.length < 10 && (
                  <tr className="h-full bg-darkGreen/70">
                    <td className="px-4 py-3" colSpan={6}></td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
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
