import {
  fetchClientData,
  fetchClientUpcomingSchedules,
  fetchClientPastSchedules,
  fetchClientInvoices,
  fetchClientReports,
} from "../../../lib/clientPortalData";
import { auth } from "@clerk/nextjs/server";

// Import components
import WelcomeBanner from "../../../../_components/client-portal/dashboard/WelcomeBanner";
import ClientInfoCard from "../../../../_components/client-portal/dashboard/ClientInfoCard";
import TabPanel from "../../../../_components/client-portal/dashboard/TabPanel";

export default async function ClientDashboardPage() {
  // Verify client access and get client ID
  const { sessionClaims } = await auth();
  const clientId = (sessionClaims as any)?.metadata?.clientId;

  // Fetch client data and other information
  const client = await fetchClientData(clientId || "");
  const upcomingServices = await fetchClientUpcomingSchedules(clientId || "");
  const recentServices = await fetchClientPastSchedules(clientId || "");
  const recentInvoices = await fetchClientInvoices(clientId || "");
  const recentReports = await fetchClientReports(clientId || "");

  return (
    <div className="mx-auto max-w-7xl">
      {/* Welcome Banner */}
      <WelcomeBanner clientName={client.clientName} />

      {/* Main Content Grid */}
      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Client Info Card */}
        <div className="md:col-span-1">
          <ClientInfoCard
            clientName={client.clientName}
            phoneNumber={client.phoneNumber}
            email={client.email}
          />
        </div>

        {/* Tab Panel for Services, Invoices, Reports */}
        <div className="md:col-span-2">
          <TabPanel
            upcomingServices={upcomingServices}
            recentServices={recentServices}
            recentInvoices={recentInvoices}
            recentReports={recentReports}
          />
        </div>
      </div>
    </div>
  );
}
