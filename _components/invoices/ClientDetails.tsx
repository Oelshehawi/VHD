import Link from "next/link";
import { FaPhone, FaEnvelope, FaUser, FaExternalLinkAlt } from "react-icons/fa";
import { ClientType } from "../../app/lib/typeDefinitions";
import { getEmailForPurpose } from "../../app/lib/utils";

const ClientDetails = ({
  client,
  canManage,
}: {
  client: ClientType;
  canManage: boolean;
}) => {
  // Get the primary email or fallback to the old email field
  const primaryEmail = getEmailForPurpose(client, "primary") || client.email || "";
  const accountingEmail = getEmailForPurpose(client, "accounting");
  const schedulingEmail = getEmailForPurpose(client, "scheduling");

  return (
    <div className="rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
      <div className="border-b border-gray-200 px-4 py-3">
        <div className="flex items-center">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100">
            <FaUser className="h-4 w-4 text-blue-600" />
          </div>
          <h3 className="ml-3 text-base font-semibold text-gray-900">Client Information</h3>
        </div>
      </div>
      
      <div className="p-4">
        <div className="space-y-3">
          {/* Client Name */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <FaUser className="mr-3 h-4 w-4 text-gray-400" />
              <div>
                <p className="text-xs font-medium text-gray-500">Client Name</p>
                <p className="text-sm font-semibold text-gray-900">{client.clientName}</p>
              </div>
            </div>
            {canManage && (
              <Link
                href={`/database/${client._id}`}
                className="inline-flex items-center rounded-lg bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-200"
              >
                <span className="mr-1">View Details</span>
                <FaExternalLinkAlt className="h-2 w-2" />
              </Link>
            )}
          </div>

          {/* Primary Email */}
          <div className="flex items-center">
            <FaEnvelope className="mr-3 h-4 w-4 text-gray-400" />
            <div>
              <p className="text-xs font-medium text-gray-500">Primary Email</p>
              <a 
                href={`mailto:${primaryEmail}`}
                className="text-sm text-blue-600 hover:text-blue-500 transition-colors"
              >
                {primaryEmail}
              </a>
            </div>
          </div>

          {/* Accounting Email - Always show if different from primary */}
          {accountingEmail && accountingEmail !== primaryEmail && (
            <div className="flex items-center">
              <FaEnvelope className="mr-3 h-4 w-4 text-gray-400" />
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-xs font-medium text-gray-500">Accounting Email</p>
                  <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                    Billing
                  </span>
                </div>
                <a 
                  href={`mailto:${accountingEmail}`}
                  className="text-sm text-blue-600 hover:text-blue-500 transition-colors"
                >
                  {accountingEmail}
                </a>
              </div>
            </div>
          )}

          {/* Scheduling Email - Only show if different from both primary and accounting */}
          {schedulingEmail && schedulingEmail !== primaryEmail && schedulingEmail !== accountingEmail && (
            <div className="flex items-center">
              <FaEnvelope className="mr-3 h-4 w-4 text-gray-400" />
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-xs font-medium text-gray-500">Scheduling Email</p>
                  <span className="inline-flex items-center rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-800">
                    Scheduling
                  </span>
                </div>
                <a 
                  href={`mailto:${schedulingEmail}`}
                  className="text-sm text-blue-600 hover:text-blue-500 transition-colors"
                >
                  {schedulingEmail}
                </a>
              </div>
            </div>
          )}

          {/* Phone Number */}
          <div className="flex items-center">
            <FaPhone className="mr-3 h-4 w-4 text-gray-400" />
            <div>
              <p className="text-xs font-medium text-gray-500">Phone Number</p>
              <a 
                href={`tel:${client.phoneNumber}`}
                className="text-sm text-blue-600 hover:text-blue-500 transition-colors"
              >
                {client.phoneNumber}
              </a>
            </div>
          </div>

          {/* Notes */}
          {client.notes && (
            <div className="border-t border-gray-200 pt-3">
              <p className="text-xs font-medium text-gray-500 mb-1">Notes</p>
              <p className="text-xs text-gray-600 bg-gray-50 p-2 rounded-lg">
                {client.notes}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientDetails;
