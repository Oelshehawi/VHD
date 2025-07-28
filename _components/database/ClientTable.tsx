import Link from "next/link";
import { FaPenSquare, FaUser, FaUsers } from "react-icons/fa";
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
      <div className="flex max-h-[70vh] items-center justify-center rounded-xl bg-darkGray border border-borderGreen">
        <div className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-darkGreen flex items-center justify-center border border-borderGreen">
            <FaUsers className="h-8 w-8 text-lightGray" />
          </div>
          <p className="text-xl font-semibold text-white mb-2">No clients found</p>
          <p className="text-lightGray">Try adjusting your search or add new clients</p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-borderGreen bg-darkGreen shadow-lg">
      {/* Table Container */}
      <div className="overflow-auto">
        <table className="w-full">
          <thead className="bg-darkBlue border-b border-borderGreen">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                <div className="flex items-center gap-2">
                  <FaUser className="h-4 w-4" />
                  Client Name
                </div>
              </th>
              <th className="hidden px-6 py-4 text-left text-sm font-semibold text-white md:table-cell">
                Email Address
              </th>
              <th className="hidden px-6 py-4 text-left text-sm font-semibold text-white md:table-cell">
                Phone Number
              </th>
              <th className="px-6 py-4 text-center text-sm font-semibold text-white">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-borderGreen">
            {clientData.map((client: ClientType) => (
              <tr
                key={client._id as string}
                className="bg-darkGreen/70 transition-all duration-200 hover:bg-darkGreen"
              >
                <td className="px-6 py-4">
                  <div>
                    <div className="font-semibold text-white mb-1">{client.clientName}</div>
                    <div className="md:hidden space-y-2">
                      <div className="text-sm text-lightGray">{client.email}</div>
                      <div className="text-sm text-lightGray">{client.phoneNumber}</div>
                    </div>
                  </div>
                </td>
                <td className="hidden px-6 py-4 text-sm text-lightGray md:table-cell">
                  <div className="flex items-center gap-2">
                    <span>{client.email}</span>
                  </div>
                </td>
                <td className="hidden px-6 py-4 text-sm text-lightGray md:table-cell">
                  <div className="flex items-center gap-2">
                    <span>{client.phoneNumber}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-center gap-3">
                    <Link 
                      href={`/database/${client._id}`}
                      className="flex h-9 w-9 items-center justify-center rounded-lg bg-darkBlue border border-borderGreen text-lightGray transition-all duration-200 hover:bg-darkGreen hover:scale-110"
                      title="Edit Client"
                    >
                      <FaPenSquare className="h-4 w-4" />
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
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ClientTable;
