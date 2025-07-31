import { Suspense } from "react";
import { fetchClientById, fetchClientInvoices } from "../../../lib/data";
import ClientDetailedContainer from "../../../../_components/database/ClientDetailedContainer";
import { ClientDetailedSkeleton } from "../../../../_components/Skeletons";
import { ClientType } from "../../../lib/typeDefinitions";
import Link from "next/link";
import { FaChevronRight, FaUser, FaBuilding } from "react-icons/fa";
import { notFound } from "next/navigation";

const ClientDetailed = async ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  const { id } = await params;
  const clientId = id;
  
  try {
    const [client, invoices] = await Promise.all([
      fetchClientById(clientId),
      fetchClientInvoices(clientId),
    ]);

    if (!client) {
      notFound();
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        {/* Header Section */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {/* Breadcrumb Navigation */}
            <nav className="flex items-center space-x-2 py-4 text-sm" aria-label="Breadcrumb">
              <Link 
                href="/database" 
                className="flex items-center text-gray-500 hover:text-gray-700 transition-colors duration-200"
              >
                <FaBuilding className="mr-1 h-4 w-4" />
                Clients
              </Link>
              <FaChevronRight className="h-3 w-3 text-gray-400" />
              <span className="flex items-center font-medium text-gray-900">
                <FaUser className="mr-1 h-4 w-4" />
                {client.clientName}
              </span>
            </nav>

            {/* Page Header */}
            <div className="pb-6 pt-2">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 flex-1">
                  <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl">
                    {client.clientName}
                  </h1>
                  <div className="mt-1 flex flex-col sm:mt-0 sm:flex-row sm:flex-wrap sm:space-x-6">
                    {invoices && (
                      <div className="mt-2 flex items-center text-sm text-gray-500">
                        <span className="font-medium">Total Invoices:</span>
                        <span className="ml-1">{invoices.length}</span>
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
                  <ClientDetailedSkeleton />
                </div>
              }
            >
              <ClientDetailedContainer
                client={client as ClientType}
                invoices={invoices}
              />
            </Suspense>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error fetching client data:", error);
    notFound();
  }
};

export default ClientDetailed;
