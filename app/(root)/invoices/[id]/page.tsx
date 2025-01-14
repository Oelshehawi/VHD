import { Suspense } from "react";
import InvoiceDetailsContainer from "../../../../_components/invoices/InvoiceDetailsContainer";
import { InvoiceDetailedSkeleton } from "../../../../_components/Skeletons";
import { fetchClientById, fetchInvoiceById } from "../../../lib/data";
import { ClientType, InvoiceType } from "../../../lib/typeDefinitions";
import { auth } from "@clerk/nextjs/server";

const InvoiceDetailed = async ({ params }: { params: { id: string } }) => {
  const invoiceId = params.id;
  const invoice = await fetchInvoiceById(invoiceId);
  const client = await fetchClientById(invoice?.clientId);
  const { orgPermissions } = await auth();

  const canManage = orgPermissions?.includes("org:database:allow") ?? false;

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
