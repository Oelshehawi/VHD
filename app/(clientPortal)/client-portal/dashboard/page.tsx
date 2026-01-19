import {
  fetchClientData,
  fetchClientUpcomingSchedules,
  fetchClientPastSchedules,
  fetchClientInvoices,
  fetchClientReports,
  fetchTechnicianByClerkId,
} from "../../../lib/clientPortalData";
// @ts-ignore
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

// Import shadcn components
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "../../../../_components/ui/alert";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";

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

  // Fetch all data in parallel to avoid waterfall pattern
  const [client, upcomingServices, recentServices, allInvoices, allReports] =
    await Promise.all([
      fetchClientData(clientId),
      fetchClientUpcomingSchedules(clientId),
      fetchClientPastSchedules(clientId),
      fetchClientInvoices(clientId, 1000),
      fetchClientReports(clientId, 1000),
    ]);

  // Get unique technician IDs from reports
  const uniqueTechnicianIds = [
    ...new Set(allReports.map((report) => report.technicianId)),
  ].filter(Boolean);

  // Fetch all technician data in parallel
  const technicianResults = await Promise.all(
    uniqueTechnicianIds.map(async (technicianId) => {
      try {
        const technicianData = await fetchTechnicianByClerkId(technicianId);
        return { technicianId, data: technicianData };
      } catch (error) {
        console.error(
          `Error fetching technician data for ${technicianId}:`,
          error,
        );
        return { technicianId, data: null };
      }
    }),
  );

  // Build technician data map from parallel results
  const technicianDataMap: Record<string, any> = {};
  for (const result of technicianResults) {
    if (result.data) {
      technicianDataMap[result.technicianId] = result.data;
    }
  }

  // Add admin viewing banner if needed
  const isAdminView = isAdmin && resolvedSearchParams.clientId;

  return (
    <div className="mx-auto flex h-full max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
      {/* Admin Viewing Banner */}
      {isAdminView && (
        <Alert className="mb-4 shrink-0 border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30">
          <ExclamationTriangleIcon className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          <AlertTitle className="text-amber-800 dark:text-amber-200">
            Admin View
          </AlertTitle>
          <AlertDescription className="text-amber-700 dark:text-amber-300">
            You are currently viewing the client portal as {client.clientName}.
          </AlertDescription>
        </Alert>
      )}

      {/* Welcome Banner */}
      <div className="shrink-0">
        <WelcomeBanner clientName={client.clientName} />
      </div>

      {/* Main Content Grid - Responsive Layout */}
      <div className="mt-6 grid flex-1 grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column - Client Info and Google Review */}
        <div className="flex flex-col gap-0 lg:col-span-4 xl:col-span-3">
          {/* Client Info Card */}
          <ClientInfoCard
            clientName={client.clientName}
            phoneNumber={client.phoneNumber}
            email={client.email}
          />

          {/* Google Review Card */}
          <GoogleReviewCard reviewUrl={GOOGLE_REVIEW_URL} />
        </div>

        {/* Right Column - Tab Panel for Services, Invoices, Reports */}
        <div className="min-h-[600px] lg:col-span-8 xl:col-span-9">
          <TabPanel
            upcomingServices={upcomingServices}
            recentServices={recentServices}
            allInvoices={allInvoices}
            allReports={allReports}
            clientData={{
              clientName: client.clientName,
              email: client.email,
              phoneNumber: client.phoneNumber,
            }}
            technicianDataMap={technicianDataMap}
          />
        </div>
      </div>
    </div>
  );
}
