import ClientContainer from "../../components/database/ClientContainer";
import { fetchAllClients } from "../lib/data";
import { auth } from "@clerk/nextjs/server";

const Database = async () => {
  const clientData = await fetchAllClients();
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
      <ClientContainer clientData={clientData} />
    </div>
  );
};

export default Database;
