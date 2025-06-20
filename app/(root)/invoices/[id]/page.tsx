import { Suspense } from "react";
import InvoiceDetailsContainer from "../../../../_components/invoices/InvoiceDetailsContainer";
import { InvoiceDetailedSkeleton } from "../../../../_components/Skeletons";
import { fetchClientById, fetchInvoiceById } from "../../../lib/data";
import { ClientType, InvoiceType } from "../../../lib/typeDefinitions";
// @ts-ignore
import { auth } from "@clerk/nextjs/server";

const InvoiceDetailed = async ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  const { id } = await params;
  const invoiceId = id;
  const invoice = await fetchInvoiceById(invoiceId);
  const client = await fetchClientById(invoice?.clientId);
  const { sessionClaims } = await auth();

  const canManage =
    (sessionClaims as any)?.isManager?.isManager === true ? true : false;

  return (
    <div className="mt-4 px-3 lg:!px-5">
      <Suspense fallback={<InvoiceDetailedSkeleton />}>
        <InvoiceDetailsContainer
          invoice={invoice as InvoiceType}
          client={client as ClientType}
          canManage={canManage}
        />
      </Suspense>
    </div>
  );
};

export default InvoiceDetailed;
