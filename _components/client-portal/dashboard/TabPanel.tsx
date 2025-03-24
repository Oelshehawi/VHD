"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarIcon,
  DocumentTextIcon,
  CreditCardIcon,
  DocumentDuplicateIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";
import ServiceCard, {
  ScheduleType as ServiceCardScheduleType,
} from "./ServiceCard";
import ReportModal from "./ReportViewModal";
import { formatDateFns, formatAmount } from "../../../app/lib/utils";
import {
  ScheduleType as AppScheduleType,
  ReportType,
} from "../../../app/lib/typeDefinitions";

interface Invoice {
  _id: string;
  invoiceId: string;
  dateIssued: string | Date;
  totalAmount: number;
  status: string;
  jobTitle?: string;
}

interface TabPanelProps {
  upcomingServices: AppScheduleType[];
  recentServices: AppScheduleType[];
  recentInvoices: Invoice[];
  recentReports: ReportType[];
}

const TabPanel = ({
  upcomingServices,
  recentServices,
  recentInvoices,
  recentReports,
}: TabPanelProps) => {
  const [activeTab, setActiveTab] = useState<
    "schedules" | "invoices" | "reports"
  >("schedules");

  const [selectedReport, setSelectedReport] = useState<ReportType | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Sort invoices by invoice number (assuming invoiceId is a string that can be parsed as a number)
  const sortedInvoices = [...recentInvoices].sort((a, b) => {
    // Extract numbers from invoice IDs (assuming format like "INV-123")
    const aNum = parseInt(a.invoiceId.replace(/\D/g, ""));
    const bNum = parseInt(b.invoiceId.replace(/\D/g, ""));

    return bNum - aNum; // Descending order (newest first)
  });

  // Convert AppScheduleType to ServiceCardScheduleType
  const convertToServiceCardSchedule = (
    service: AppScheduleType,
  ): ServiceCardScheduleType => {
    return {
      _id:
        typeof service._id === "string" ? service._id : service._id.toString(),
      jobTitle: service.jobTitle,
      startDateTime: service.startDateTime,
      location: service.location,
      confirmed: service.confirmed,
      photos: service.photos
        ? service.photos.map((photo) => ({
            _id:
              typeof photo._id === "string" ? photo._id : photo._id.toString(),
            url: photo.url,
            timestamp: photo.timestamp,
            technicianId: photo.technicianId,
            type: photo.type,
          }))
        : undefined,
    };
  };

  const openReportModal = (report: ReportType) => {
    setSelectedReport(report);
    setIsReportModalOpen(true);
  };

  const closeReportModal = () => {
    setIsReportModalOpen(false);
  };

  const tabs = [
    {
      id: "schedules",
      label: "Services",
      icon: CalendarIcon,
    },
    {
      id: "invoices",
      label: "Invoices",
      icon: CreditCardIcon,
    },
    {
      id: "reports",
      label: "Reports",
      icon: DocumentTextIcon,
    },
  ];

  const calculateTotalAmount = (totalAmount: number) => {
    return totalAmount * 0.05;
  };

  return (
    <div className="w-full overflow-hidden rounded-xl bg-white shadow-sm">
      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`relative flex-1 px-2 py-3 text-center text-xs font-medium sm:px-4 sm:text-sm ${
                isActive
                  ? "text-green-900"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <span className="flex items-center justify-center">
                <Icon className="mr-1 h-4 w-4 sm:mr-2 sm:h-5 sm:w-5" />
                <span className="xs:inline hidden md:flex">{tab.label}</span>
              </span>

              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 h-0.5 w-full bg-gradient-to-r from-green-700 to-green-900"
                  initial={false}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="p-2 sm:p-4">
        <AnimatePresence mode="wait">
          {activeTab === "schedules" && (
            <motion.div
              key="schedules"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4 p-2 sm:space-y-6 sm:p-4"
            >
              {/* Upcoming Services */}
              <div>
                <h3 className="mb-2 text-base font-semibold text-gray-900 sm:mb-4 sm:text-lg">
                  Upcoming Services
                </h3>
                <div className="divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white">
                  {upcomingServices.length > 0 ? (
                    upcomingServices.map((service) => (
                      <ServiceCard
                        key={
                          typeof service._id === "string"
                            ? service._id
                            : service._id.toString()
                        }
                        service={convertToServiceCardSchedule(service)}
                        upcoming={true}
                      />
                    ))
                  ) : (
                    <div className="p-4 text-center text-gray-500">
                      No upcoming services scheduled.
                    </div>
                  )}
                </div>
              </div>

              {/* Recent Services */}
              <div>
                <h3 className="mb-2 mt-6 border-t border-gray-200 pt-4 text-base font-semibold text-gray-900 sm:mb-4 sm:mt-8 sm:pt-6 sm:text-lg">
                  Recent Services
                </h3>
                <div className="divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white">
                  {recentServices.length > 0 ? (
                    recentServices.map((service) => (
                      <ServiceCard
                        key={
                          typeof service._id === "string"
                            ? service._id
                            : service._id.toString()
                        }
                        service={convertToServiceCardSchedule(service)}
                        upcoming={false}
                      />
                    ))
                  ) : (
                    <div className="p-4 text-center text-gray-500">
                      No recent services found.
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "invoices" && (
            <motion.div
              key="invoices"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="px-2 sm:px-0"
            >
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-base font-medium text-gray-900 sm:text-lg">
                  Recent Invoices
                </h3>
              </div>
              {sortedInvoices.length > 0 ? (
                <div className="-mx-2 overflow-x-auto sm:mx-0">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-2 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500 sm:px-4 sm:py-3">
                          Invoice #
                        </th>
                        <th className="px-2 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500 sm:px-4 sm:py-3">
                          Date
                        </th>
                        <th className="px-2 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500 sm:px-4 sm:py-3">
                          Amount
                        </th>
                        <th className="px-2 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500 sm:px-4 sm:py-3">
                          Status
                        </th>
                        <th className="px-2 py-2 text-right text-xs font-medium uppercase tracking-wider text-gray-500 sm:px-4 sm:py-3">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {sortedInvoices.map((invoice, idx) => (
                        <motion.tr
                          key={invoice._id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2, delay: idx * 0.05 }}
                          className="hover:bg-gray-50"
                        >
                          <td className="whitespace-nowrap px-2 py-2 text-xs font-medium text-gray-900 sm:px-4 sm:py-3 sm:text-sm">
                            {invoice.invoiceId}
                          </td>
                          <td className="whitespace-nowrap px-2 py-2 text-xs text-gray-500 sm:px-4 sm:py-3 sm:text-sm">
                            {formatDateFns(invoice.dateIssued)}
                          </td>
                          <td className="whitespace-nowrap px-2 py-2 text-xs text-gray-500 sm:px-4 sm:py-3 sm:text-sm">
                            {formatAmount(
                              invoice.totalAmount +
                                calculateTotalAmount(invoice.totalAmount),
                            )}
                          </td>
                          <td className="whitespace-nowrap px-2 py-2 sm:px-4 sm:py-3">
                            <span
                              className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold leading-5 ${
                                invoice.status === "paid"
                                  ? "bg-green-100 text-green-800"
                                  : invoice.status === "overdue"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-yellow-100 text-yellow-800"
                              }`}
                            >
                              {invoice.status}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-2 py-2 text-right text-xs sm:px-4 sm:py-3 sm:text-sm">
                            <Link
                              href={`/client-portal/invoices/${invoice._id}/pdf`}
                              className="inline-flex items-center text-blue-600 hover:text-blue-900"
                            >
                              <ArrowDownTrayIcon className="mr-1 h-4 w-4" />
                              <span className="hidden sm:inline">PDF</span>
                            </Link>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500">No invoices available.</p>
              )}
            </motion.div>
          )}

          {activeTab === "reports" && (
            <AnimatePresence mode="wait">
              <motion.div
                key="reports"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="p-2 sm:p-4"
              >
                <h3 className="mb-3 text-base font-semibold text-gray-900 sm:mb-4 sm:text-lg">
                  Service Reports
                </h3>

                <div className="divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white">
                  {recentReports.length > 0 ? (
                    recentReports.map((report) => (
                      <div
                        key={report._id?.toString()}
                        className="flex flex-col p-3 hover:bg-gray-50 sm:flex-row sm:items-center sm:justify-between sm:p-4"
                      >
                        <div className="mb-3 flex-1 sm:mb-0">
                          <div className="font-medium text-gray-900">
                            Exhaust Hood System Cleaning -{" "}
                            {formatDateFns(report.dateCompleted)}
                          </div>
                          <div className="mt-1 text-xs text-gray-500 sm:text-sm">
                            {report.cleaningDetails && (
                              <span>
                                {Object.values(report.cleaningDetails).some(
                                  (val) => val,
                                )
                                  ? "Cleaning completed"
                                  : "Inspection only"}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* <Link
                            href={`/client-portal/reports/${report._id}/pdf`}
                            passHref
                            className="flex items-center rounded-md border border-gray-200 bg-white px-2 py-1 text-xs font-medium text-darkGreen hover:bg-gray-100 sm:px-3 sm:py-1.5 sm:text-sm"
                          >
                            <ArrowDownTrayIcon className="mr-1 h-3 w-3 sm:h-4 sm:w-4" />
                            <span className="xs:inline hidden">Download</span>
                          </Link> */}
                          <button
                            onClick={() => openReportModal(report)}
                            className="hover:bg-darkGreen-2 flex items-center rounded-md bg-darkGreen px-2 py-1 text-xs font-medium text-white sm:px-3 sm:py-1.5 sm:text-sm"
                          >
                            <DocumentDuplicateIcon className="mr-1 hidden h-3 w-3 sm:block sm:h-4 sm:w-4" />
                            <span className="xs:inline">View Report</span>
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-gray-500">
                      No service reports found.
                    </div>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          )}
        </AnimatePresence>
      </div>

      {/* Report Modal */}
      {selectedReport && (
        <ReportModal
          report={selectedReport}
          isOpen={isReportModalOpen}
          onClose={closeReportModal}
        />
      )}
    </div>
  );
};

export default TabPanel;
