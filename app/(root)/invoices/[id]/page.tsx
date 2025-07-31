import { Suspense } from "react";
import InvoiceDetailsContainer from "../../../../_components/invoices/InvoiceDetailsContainer";
import { InvoiceDetailedSkeleton } from "../../../../_components/Skeletons";
import { fetchClientById, fetchInvoiceById } from "../../../lib/data";
import { ClientType, InvoiceType } from "../../../lib/typeDefinitions";
import { formatDateStringUTC } from "../../../lib/utils";
import Link from "next/link";
import { FaChevronRight, FaFileInvoice, FaUser, FaReceipt } from "react-icons/fa";
import { notFound } from "next/navigation";
// @ts-ignore
import { auth } from "@clerk/nextjs/server";

const InvoiceDetailed = async ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  const { id } = await params;
  const invoiceId = id;
  
  try {
    const { sessionClaims } = await auth();
    const canManage = (sessionClaims as any)?.isManager?.isManager === true;

    const invoice = await fetchInvoiceById(invoiceId);
    if (!invoice) {
      notFound();
    }

    const client = await fetchClientById(invoice.clientId);
    if (!client) {
      notFound();
    }

    // Status styling helper
    const getStatusStyles = (status: string) => {
      switch (status) {
        case "paid":
          return "bg-green-100 text-green-800 ring-green-600/20";
        case "overdue":
          return "bg-red-100 text-red-800 ring-red-600/20";
        default:
          return "bg-yellow-100 text-yellow-800 ring-yellow-600/20";
      }
    };

    const getStatusText = (status: string) => {
      switch (status) {
        case "paid":
          return "Paid";
        case "overdue":
          return "Overdue";
        default:
          return "Pending";
      }
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        {/* Header Section */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {/* Breadcrumb Navigation */}
            <nav className="flex items-center space-x-2 py-4 text-sm" aria-label="Breadcrumb">
              <Link 
                href="/invoices" 
                className="flex items-center text-gray-500 hover:text-gray-700 transition-colors duration-200"
              >
                <FaReceipt className="mr-1 h-4 w-4" />
                Invoices
              </Link>
              <FaChevronRight className="h-3 w-3 text-gray-400" />
              <Link 
                href={`/database/${client._id}`}
                className="flex items-center text-gray-500 hover:text-gray-700 transition-colors duration-200"
              >
                <FaUser className="mr-1 h-4 w-4" />
                {client.clientName}
              </Link>
              <FaChevronRight className="h-3 w-3 text-gray-400" />
              <span className="flex items-center font-medium text-gray-900">
                <FaFileInvoice className="mr-1 h-4 w-4" />
                {invoice.invoiceId}
              </span>
            </nav>

            {/* Page Header */}
            <div className="pb-6 pt-2">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center">
                    <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl">
                      Invoice {invoice.invoiceId}
                    </h1>
                    <span className={`ml-3 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${getStatusStyles(invoice.status)}`}>
                      {getStatusText(invoice.status)}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-col sm:mt-0 sm:flex-row sm:flex-wrap sm:space-x-6">
                    <div className="mt-2 flex items-center text-sm text-gray-500">
                      <span className="font-medium">Job:</span>
                      <span className="ml-1 truncate">{invoice.jobTitle}</span>
                    </div>
                    <div className="mt-2 flex items-center text-sm text-gray-500">
                      <span className="font-medium">Client:</span>
                      <Link 
                        href={`/database/${client._id}`}
                        className="ml-1 text-blue-600 hover:text-blue-500 transition-colors duration-200"
                      >
                        {client.clientName}
                      </Link>
                    </div>
                    <div className="mt-2 flex items-center text-sm text-gray-500">
                      <span className="font-medium">Date Issued:</span>
                      <span className="ml-1">
                        {formatDateStringUTC(invoice.dateIssued)}
                      </span>
                    </div>
                  </div>
                </div>
                {invoice.status === "paid" && invoice.paymentInfo && (
                  <div className="mt-4 sm:mt-0">
                    <div className="flex items-center rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
                      <svg className="mr-1.5 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Paid via {invoice.paymentInfo.method.replace(/-/g, ' ').toUpperCase()}
                    </div>
                  </div>
                )}
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
                  <InvoiceDetailedSkeleton />
                </div>
              }
            >
              <InvoiceDetailsContainer
                invoice={invoice as InvoiceType}
                client={client as ClientType}
                canManage={canManage}
              />
            </Suspense>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error fetching invoice data:", error);
    notFound();
  }
};

export default InvoiceDetailed;
