"use client";
import toast from "react-hot-toast";
import { updateClient } from "../../app/lib/actions/actions";
import { useForm } from "react-hook-form";
import { getEmailForPurpose } from "../../app/lib/utils";
import { FaUser, FaEnvelope, FaPhone, FaStickyNote, FaSave, FaTimes } from "react-icons/fa";
import { ClientType } from "../../app/lib/typeDefinitions";

/**
 * @param {Object} props
 * @param {any} props.client
 * @param {boolean} props.isEditing
 * @param {() => void} props.toggleEdit
 */
const InlineEditClient = ({ client, isEditing, toggleEdit }: { client: ClientType, isEditing: boolean, toggleEdit: () => void }) => {
  const updateClientWithId = updateClient.bind(null, client._id as string);
  const { register, handleSubmit, formState: { errors } } = useForm();

  console.log(client);

  // Get current email values for display and defaults - Fixed the bug here
  const primaryEmail = getEmailForPurpose(client, "primary") || client.email || "";
  const schedulingEmail = client.emails?.scheduling || "";
  const accountingEmail = client.emails?.accounting || "";

  /**
   * @param {any} formData
   */
  const onSubmit = async (formData: any) => {
    try {
      // Transform the form data to include emails object
      const updateData = {
        ...formData,
        emails: {
          primary: formData.primaryEmail,
          scheduling: formData.schedulingEmail || formData.primaryEmail,
          accounting: formData.accountingEmail || formData.primaryEmail,
        },
        // Keep the old email field for backward compatibility
        email: formData.primaryEmail,
      };
      
      // Remove the individual email fields from the data
      delete updateData.primaryEmail;
      delete updateData.schedulingEmail;
      delete updateData.accountingEmail;
      
      await updateClientWithId(updateData);
      toast.success("Client updated successfully");
      toggleEdit();
    } catch (error) {
      console.error("Error updating client:", error);
      toast.error("Failed to update client");
    }
  };

  // Split fields into two columns for better layout
  const leftColumnFields = [
    {
      name: "clientName",
      label: "Client Name",
      type: "text",
      value: client.clientName,
      icon: FaUser,
      register: "clientName",
      required: true,
    },
    {
      name: "primaryEmail",
      label: "Primary Email",
      type: "email",
      value: primaryEmail,
      icon: FaEnvelope,
      register: "primaryEmail",
      required: true,
      description: "Main email for client portal access",
    },
    {
      name: "phoneNumber",
      label: "Phone Number",
      type: "tel",
      value: client.phoneNumber,
      icon: FaPhone,
      register: "phoneNumber",
      required: true,
    },
  ];

  const rightColumnFields = [
    {
      name: "accountingEmail",
      label: "Accounting Email",
      type: "email",
      value: accountingEmail,
      icon: FaEnvelope,
      register: "accountingEmail",
      required: false,
      placeholder: "Uses primary email if empty",
      description: "Email for payment reminders and invoices",
    },
    {
      name: "schedulingEmail",
      label: "Scheduling Email",
      type: "email",
      value: schedulingEmail,
      icon: FaEnvelope,
      register: "schedulingEmail",
      required: false,
      placeholder: "Uses primary email if empty",
      description: "Email for job scheduling notifications",
    },
    {
      name: "notes",
      label: "Notes",
      type: "textarea",
      value: client.notes,
      icon: FaStickyNote,
      register: "notes",
      required: false,
    },
  ];

  /**
   * @param {any} field
   */
  const renderField = (field: any) => (
    <div key={field.name} className="space-y-1">
      <div className="flex items-center">
        <field.icon className="mr-2 h-4 w-4 text-gray-400" />
        <label className="block text-sm font-medium text-gray-700">
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      </div>
      
      {field.description && (
        <p className="text-xs text-gray-500 ml-6">{field.description}</p>
      )}

      {isEditing ? (
        <div className="ml-6">
          {field.type === "textarea" ? (
            <textarea
              {...register(field.register, { required: field.required })}
              defaultValue={field.value}
              placeholder={field.placeholder}
              rows={2}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          ) : (
            <input
              type={field.type}
              {...register(field.register, { required: field.required })}
              defaultValue={field.value}
              placeholder={field.placeholder}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          )}
          {errors[field.register] && (
            <p className="mt-1 text-xs text-red-500">
              {field.label} is required
            </p>
          )}
        </div>
      ) : (
        <div className="ml-6">
          <div className="rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-900">
            {field.value || (
              <span className="text-gray-400 italic">Not provided</span>
            )}
            {/* Show email type indicators */}
            {field.name === "accountingEmail" && field.value && field.value !== primaryEmail && (
              <span className="ml-2 inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                Accounting
              </span>
            )}
            {field.name === "schedulingEmail" && field.value && field.value !== primaryEmail && field.value !== accountingEmail && (
              <span className="ml-2 inline-flex items-center rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-800">
                Scheduling
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
      <div className="border-b border-gray-200 px-4 py-3">
        <div className="flex items-center">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100">
            <FaUser className="h-4 w-4 text-blue-600" />
          </div>
          <div className="ml-3">
            <h3 className="text-base font-semibold text-gray-900">Client Information</h3>
            <p className="text-xs text-gray-500">
              {isEditing ? "Edit client details" : "View client information"}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="p-4">
        {/* Two-column layout */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="space-y-4">
            {leftColumnFields.map(renderField)}
          </div>
          <div className="space-y-4">
            {rightColumnFields.map(renderField)}
          </div>
        </div>

        {isEditing && (
          <div className="mt-4 flex space-x-3 border-t border-gray-200 pt-4">
            <button
              type="submit"
              className="flex-1 inline-flex items-center justify-center rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <FaSave className="mr-2 h-3 w-3" />
              Save Changes
            </button>
            <button
              type="button"
              onClick={toggleEdit}
              className="flex-1 inline-flex items-center justify-center rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              <FaTimes className="mr-2 h-3 w-3" />
              Cancel
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default InlineEditClient;
