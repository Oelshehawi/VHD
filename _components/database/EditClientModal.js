"use client";
import toast from "react-hot-toast";
import { updateClient } from "../../app/lib/actions/actions";
import { useForm } from "react-hook-form";

const InlineEditClient = ({ client, isEditing, toggleEdit }) => {
  const updateClientWithId = updateClient.bind(null, client._id);
  const { register, handleSubmit } = useForm();

  const onSubmit = async (formData) => {
    try {
      await updateClientWithId(formData);
      toast.success("Client updated successfully");
      toggleEdit();
    } catch (error) {
      console.error("Error updating client:", error);
      toast.error("Failed to update client");
    }
  };

  return (
    <div className="mb-4 w-full px-2 md:w-1/2">
      <div className="rounded border shadow">
        <div className="border-b px-4 py-2 text-xl">Client Information</div>
        <form onSubmit={handleSubmit(onSubmit)} className="p-4">
          <ul className="flex w-full flex-col justify-between space-y-2">
            <li className="flex w-full  flex-row lg:w-3/4">
              <strong className={isEditing ? "w-[30%] lg:w-1/6" : "lg:w-[10%]"}>
                Name:
              </strong>
              {isEditing ? (
                <input
                  type="text"
                  className="ml-2 w-full rounded border-2 border-gray-400 p-2 text-black outline-none focus:border-darkGreen focus:ring-2 focus:ring-darkGreen"
                  defaultValue={client.clientName}
                  {...register("clientName")}
                />
              ) : (
                <div className="ml-2">{client.clientName}</div>
              )}
            </li>
            <li className="flex w-full  flex-row lg:w-3/4">
              <strong className={isEditing ? "w-[30%] lg:w-1/6" : "lg:w-[10%]"}>
                Email:
              </strong>
              {isEditing ? (
                <input
                  type="email"
                  className="ml-2 w-full rounded border-2 border-gray-400 p-2 text-black outline-none focus:border-darkGreen focus:ring-2 focus:ring-darkGreen"
                  defaultValue={client.email}
                  {...register("email")}
                />
              ) : (
                <div className="ml-2">{client.email}</div>
              )}
            </li>
            <li className="flex w-full flex-row lg:w-3/4">
              <strong className={isEditing ? "w-[30%] lg:w-1/6" : "lg:w-[10%]"}>
                Phone:
              </strong>
              {isEditing ? (
                <input
                  type="tel"
                  className="ml-2 w-full rounded border-2 border-gray-400 p-2 text-black outline-none focus:border-darkGreen focus:ring-2 focus:ring-darkGreen"
                  defaultValue={client.phoneNumber}
                  {...register("phoneNumber")}
                />
              ) : (
                <div className="ml-2">{client.phoneNumber}</div>
              )}
            </li>
            <li className="flex w-full flex-row lg:w-3/4">
              <strong className={isEditing ? "w-[30%] lg:w-1/6" : "lg:w-[10%]"}>
                Notes:
              </strong>
              {isEditing ? (
                <textarea
                  className="ml-2 h-24 w-full rounded border-2 border-gray-400 p-2 text-gray-700 outline-none focus:border-darkGreen focus:ring-2 focus:ring-darkGreen"
                  defaultValue={client.notes}
                  {...register("notes")}
                />
              ) : (
                <div className="ml-2">{client.notes}</div>
              )}
            </li>
          </ul>
          {isEditing && (
            <div className="mt-4 flex justify-end space-x-2">
              <button
                type="button"
                onClick={toggleEdit}
                className="rounded bg-gray-200 px-4 py-2 text-gray-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded bg-darkGreen px-4 py-2 text-white"
              >
                Save Changes
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default InlineEditClient;
