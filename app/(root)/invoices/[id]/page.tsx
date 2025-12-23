import { Suspense } from "react";
import InvoiceDetailsContainer from "../../../../_components/invoices/InvoiceDetailsContainer";
import { InvoiceDetailedSkeleton } from "../../../../_components/Skeletons";
import { fetchClientById, fetchInvoiceById } from "../../../lib/data";
import { ClientType, InvoiceType } from "../../../lib/typeDefinitions";
// @ts-ignore
import { auth } from "@clerk/nextjs/server";
import { SetBreadcrumbName } from "../../../../_components/layout/SetBreadcrumbName";

const InvoiceDetailed = async ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  const { id } = await params;
  const invoiceId = id;

  const { sessionClaims } = await auth();
  const canManage = (sessionClaims as any)?.isManager?.isManager === true;

  const invoice = await fetchInvoiceById(invoiceId);
  const client = await fetchClientById(invoice.clientId);

  return (
    <div className="bg-background min-h-screen">
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
            <SetBreadcrumbName name={` ${invoice.jobTitle}`} />
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
};

export default InvoiceDetailed;
