import { Suspense } from "react";
import { fetchClientById, fetchClientInvoices } from "../../../lib/data";
import ClientDetailedContainer from "../../../../_components/database/ClientDetailedContainer";
import { ClientDetailedSkeleton } from "../../../../_components/Skeletons";
import { ClientType } from "../../../lib/typeDefinitions";
import { notFound } from "next/navigation";
import { SetBreadcrumbName } from "../../../../_components/layout/SetBreadcrumbName";

const ClientDetailed = async ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  const { id } = await params;
  const clientId = id;

  const [client, invoices] = await Promise.all([
    fetchClientById(clientId),
    fetchClientInvoices(clientId),
  ]);

  if (!client) {
    notFound();
  }

  return (
    <>
      <SetBreadcrumbName name={client.clientName} />
      <div className="bg-background">


        {/* Main Content */}
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
    </>
  );
};

export default ClientDetailed;
