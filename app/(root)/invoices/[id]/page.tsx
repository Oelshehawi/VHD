import { Suspense } from "react";
import InvoiceDetailsContainer from "../../../../_components/invoices/InvoiceDetailsContainer";
import { InvoiceDetailedSkeleton } from "../../../../_components/Skeletons";
import { fetchClientById, fetchInvoiceById } from "../../../lib/data";
import { ClientType, InvoiceType } from "../../../lib/typeDefinitions";
import { auth } from "@clerk/nextjs/server";

const InvoiceDetailed = async ({ params }: { params: { id: string } }) => {
  const invoiceId = params.id;
  const invoice = (await fetchInvoiceById(invoiceId)) as InvoiceType;
  const client = (await fetchClientById(invoice?.clientId as string)) as ClientType;
  const { orgPermissions } = await auth();

  const canManage = orgPermissions?.includes("org:database:allow") ? true : false;

  return (
    <>
      <div className="mt-4 px-3 lg:!px-5">
        <Suspense fallback={<InvoiceDetailedSkeleton />}>
          <InvoiceDetailsContainer invoice={invoice} client={client} canManage={canManage as boolean} />
        </Suspense>
      </div>
    </>
  );
};

export default InvoiceDetailed;
