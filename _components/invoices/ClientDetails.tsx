import Link from "next/link";
import { FaPhone, FaEnvelope, FaUser } from "react-icons/fa";
import { ClientType } from "../../app/lib/typeDefinitions";

const ClientDetails = ({
  client,
  canManage,
}: {
  client: ClientType;
  canManage: boolean;
}) => {
  return (
    <div className="mb-4 w-full px-2 lg:w-[40%]">
      <div className="rounded border shadow">
        <div className="border-b px-4 py-2 text-xl">Client Information</div>
        <div className="p-4">
          <ul className="flex w-full flex-col space-y-2 p-1">
            <li className="flex w-full flex-row items-center py-2">
              {canManage ? (
                <Link
                  href={`/database/${client._id}`}
                  className=" text-blue-600 hover:underline"
                >
                  <div className=" flex items-center font-bold">
                    <FaUser className="mr-2 size-6 text-darkGreen" />
                    {client.clientName}
                  </div>
                </Link>
              ) : (
                <div className=" flex items-center font-bold">
                  <FaUser className="mr-2 size-6 text-darkGreen" />
                  {client.clientName}
                </div>
              )}
            </li>
            <li className="flex w-full flex-row items-center py-2 font-bold">
              <div className=" flex items-center">
                <FaEnvelope className="mr-2 size-6 text-darkGreen" />
                {client.email}
              </div>
            </li>
            <li className="flex w-full flex-row items-center py-2 font-bold">
              <div className=" flex items-center">
                <FaPhone className="mr-2 size-6 text-darkGreen" />
                {client.phoneNumber}
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ClientDetails;
