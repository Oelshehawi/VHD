import { fetchClientById, fetchClientInvoices } from "../../../lib/data";
import ClientDetailedContainer from "../../../../_components/database/ClientDetailedContainer";
import { Suspense } from "react";
import { ClientDetailedSkeleton } from "../../../../_components/Skeletons";
import { ClientType } from "../../../lib/typeDefinitions";

const ClientDetailed = async ({ params }: { params: { id: string } }) => {
  const clientId = params.id;
  const client = await fetchClientById(clientId);
  const invoices = await fetchClientInvoices(clientId);

  return (
    <>
      <div className="mt-4 px-2 lg:!px-5">
        <Suspense fallback={<ClientDetailedSkeleton />}>
          <ClientDetailedContainer
            client={client as ClientType}
            invoices={invoices}
          />
        </Suspense>
      </div>
    </>
  );
};

export default ClientDetailed;
