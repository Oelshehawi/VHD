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
import GoogleReviewCard from "../../../../_components/client-portal/dashboard/GoogleReviewCard";
import TabPanel from "../../../../_components/client-portal/dashboard/TabPanel";

// Google review URL
const GOOGLE_REVIEW_URL = "https://g.page/r/CRLDtlapvtO3EAE/review";

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
        {/* Left Column - Client Info and Google Review */}
        <div className="flex flex-col md:col-span-1">
          {/* Client Info Card */}
          <ClientInfoCard
            clientName={client.clientName}
            phoneNumber={client.phoneNumber}
            email={client.email}
          />

          {/* Google Review Card */}
          <GoogleReviewCard reviewUrl={GOOGLE_REVIEW_URL} />
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
