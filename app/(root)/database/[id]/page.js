import { fetchClientById, fetchClientInvoices } from "../../../lib/data";
import ClientDetailedContainer from "../../../../_components/database/ClientDetailedContainer";
import { Suspense } from "react";
import { ClientDetailedSkeleton } from "../../../../_components/Skeletons";

const ClientDetailed = async ({ params }) => {
  const clientId = params.id;
  const [client, invoices] = await Promise.all([
    await fetchClientById(clientId),
    await fetchClientInvoices(clientId),
  ]);

  return (
    <>
      <div className="mt-4 px-2 lg:!px-5">
        <Suspense fallback={<ClientDetailedSkeleton />}>
          <ClientDetailedContainer client={client} invoices={invoices} />
        </Suspense>
      </div>
    </>
  );
};

export default ClientDetailed;
