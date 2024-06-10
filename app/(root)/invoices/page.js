import { auth } from "@clerk/nextjs/server";
import InvoiceContainer from "../../../_components/invoices/InvoiceContainer";
import { fetchAllClients, fetchAllInvoices } from "../../lib/data";

const Invoice = async () => {
  const invoiceData = await fetchAllInvoices();
  const clients = await fetchAllClients();

  const { has } = auth();
  const canManage = has({ permission: "org:database:allow" });

  if (!canManage)
    return (
      <div className="flex min-h-[100vh] items-center justify-center text-3xl font-bold">
        You don't have correct permissions to access this page!
      </div>
    );

  return (
    <div className="flex min-h-full items-center justify-center">
      <InvoiceContainer invoiceData={invoiceData} clients={clients} />
    </div>
  );
};

export default Invoice;
