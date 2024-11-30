import Link from "next/link";
import { FaPenSquare } from "react-icons/fa";
import DeleteModal from "../DeleteModal";
import { ClientType } from "../../app/lib/typeDefinitions";
import { fetchFilteredClients } from "../../app/lib/data";

const ClientTable = async ({
  query,
  currentPage,
  sort,
}: {
  query: string;
  currentPage: number;
  sort: 1 | -1;
}) => {
  const clientData = await fetchFilteredClients(query, currentPage, sort);

  if (!clientData.length) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center rounded bg-darkGreen/90">
        <p className="text-xl font-semibold text-white">No clients found</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-borderGreen bg-darkGreen/10 shadow-lg">
      <div className="flex flex-col overflow-hidden rounded-lg">
        <div className="flex-grow overflow-auto">
          <table className="relative w-full border-collapse">
            <thead className="sticky top-0 z-10">
              <tr className="bg-darkGreen text-white">
                <th className="whitespace-nowrap px-4 py-3.5 text-left font-semibold">Client Name</th>
                <th className="hidden whitespace-nowrap px-4 py-3.5 text-left font-semibold md:table-cell">
                  Email
                </th>
                <th className="hidden whitespace-nowrap px-4 py-3.5 text-left font-semibold md:table-cell">
                  Phone Number
                </th>
                <th className="whitespace-nowrap px-4 py-3.5 text-center font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-darkGreen/20">
              {clientData.map((client: ClientType, index: number) => (
                <tr
                  key={client._id as string}
                  className={`bg-darkGreen/70 transition-colors hover:bg-darkGreen/90 ${
                    index === clientData.length - 1 ? "h-full" : ""
                  }`}
                >
                  <td className="px-4 py-3 text-white">
                    <div className="font-medium">{client.clientName}</div>
                    <div className="md:hidden">
                      <div className="text-gray-200">{client.email}</div>
                      <div className="text-gray-200">{client.phoneNumber}</div>
                    </div>
                  </td>
                  <td className="hidden px-4 py-3 text-white md:table-cell">
                    {client.email}
                  </td>
                  <td className="hidden px-4 py-3 text-white md:table-cell">
                    {client.phoneNumber}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-3">
                      <Link 
                        href={`/database/${client._id}`}
                        className="transition-transform hover:scale-105"
                      >
                        <FaPenSquare className="size-8 rounded bg-green-600 p-1.5 text-white hover:bg-green-700" />
                      </Link>
                      <div className="hidden md:block">
                        <DeleteModal
                          deleteText="Are you sure you want to delete this client?"
                          deleteDesc="All associated invoices with this client will also be deleted"
                          deletionId={client._id.toString()}
                          deletingValue="client"
                        />
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
              {clientData.length < 10 && (
                <tr className="h-full bg-darkGreen/70">
                  <td className="px-4 py-3" colSpan={4}></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ClientTable;
