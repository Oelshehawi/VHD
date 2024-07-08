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

  return (
    <div>
      <div className="max-h-[70vh] min-h-[70vh] overflow-auto rounded">
        <table className="w-full text-left ">
          <thead className=" bg-darkGreen text-white">
            <tr className="">
              <th className="px-3.5 py-3 capitalize">Client Name</th>
              <th className="hidden px-3.5 py-3 capitalize md:table-cell ">
                Email
              </th>
              <th className=" hidden px-3.5 py-3 capitalize md:table-cell ">
                Phone Number
              </th>
              <th className="px-3.5 py-3   capitalize ">Edit Client</th>
              <th className=" hidden px-3.5 py-3 capitalize md:table-cell ">
                Delete Client
              </th>
            </tr>
          </thead>
          <tbody className="rounded font-bold">
            {clientData.map((client: ClientType) => (
              <tr
                key={client._id as string}
                className="bg-borderGreen text-white"
              >
                <td className="px-3.5 py-2.5 ">{client.clientName}</td>
                <td className=" hidden  px-3.5 py-2.5 md:table-cell ">
                  {client.email}
                </td>
                <td className=" hidden  px-3.5 py-2.5 md:table-cell">
                  {client.phoneNumber}
                </td>
                <td className="flex justify-center px-3.5 py-2.5">
                  <Link href={`/database/${client._id}`}>
                    <FaPenSquare className="size-8 rounded bg-darkGreen text-white hover:bg-green-800" />
                  </Link>
                </td>
                <td className=" hidden  px-3.5 py-2.5 md:table-cell">
                  <DeleteModal
                    deleteText={"Are you sure you want to delete this client?"}
                    deleteDesc={
                      "All associated invoices with this client will also be deleted"
                    }
                    deletionId={client._id.toString()}
                    deletingValue="client"
                  />
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
