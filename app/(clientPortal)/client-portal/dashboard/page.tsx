import {
  fetchClientData,
  fetchClientUpcomingSchedules,
  fetchClientPastSchedules,
  fetchClientInvoices,
  fetchClientReports,
} from "../../../lib/clientPortalData";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

// Import components
import WelcomeBanner from "../../../../_components/client-portal/dashboard/WelcomeBanner";
import ClientInfoCard from "../../../../_components/client-portal/dashboard/ClientInfoCard";
import GoogleReviewCard from "../../../../_components/client-portal/dashboard/GoogleReviewCard";
import TabPanel from "../../../../_components/client-portal/dashboard/TabPanel";

// Google review URL
const GOOGLE_REVIEW_URL = "https://g.page/r/CRLDtlapvtO3EAE/review";

interface ClientDashboardPageProps {
  searchParams: Promise<{ clientId?: string }>;
}

export default async function ClientDashboardPage({
  searchParams,
}: ClientDashboardPageProps) {
  // Verify user authentication
  const { sessionClaims } = await auth();
  const isAdmin = (sessionClaims as any)?.metadata?.isManager === true;

  let clientId: string;

  const resolvedSearchParams = await searchParams;
  // If admin is viewing as client (with clientId query param)
  if (resolvedSearchParams.clientId && isAdmin) {
    clientId = resolvedSearchParams.clientId;
  } else {
    // Regular client portal user flow
    clientId = (sessionClaims as any)?.metadata?.clientId;

    // If not admin and no clientId in claims, redirect to login
    if (!clientId) {
      redirect("/sign-in");
    }
  }

  // Fetch client data and other information
  const client = await fetchClientData(clientId);
  const upcomingServices = await fetchClientUpcomingSchedules(clientId);
  const recentServices = await fetchClientPastSchedules(clientId);
  const recentInvoices = await fetchClientInvoices(clientId);
  const recentReports = await fetchClientReports(clientId);

  // Add admin viewing banner if needed
  const isAdminView = isAdmin && resolvedSearchParams.clientId;

  return (
    <div className="mx-auto max-w-7xl">
      {/* Admin Viewing Banner */}
      {isAdminView && (
        <div className="mb-4 rounded-md bg-amber-100 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-amber-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8.485 3.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 3.495zM10 6a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 6zm0 9a1 1 0 100-2 1 1 0 000 2z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-amber-800">Admin View</h3>
              <div className="mt-2 text-sm text-amber-700">
                <p>
                  You are currently viewing the client portal as{" "}
                  {client.clientName}.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

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
