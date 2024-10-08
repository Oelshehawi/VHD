"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { createClient } from "../../app/lib/actions/actions";
import toast from "react-hot-toast";
import { isTextKey, isNumberKey } from "../../app/lib/utils";

const AddClient = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  const inputFields = [
    {
      name: "clientName",
      type: "text",
      placeholder: "Client's Name",
      isRequired: true,
      minLength: false,
    },
    {
      name: "prefix",
      type: "text",
      placeholder: "Invoice Prefix",
      isRequired: true,
      minLength: 3,
      maxLength: 3,
      onKeyDown: isTextKey,
    },
    { name: "email", type: "email", placeholder: "Email", isRequired: true },
    {
      name: "phoneNumber",
      type: "tel",
      placeholder: "Phone Number",
      isRequired: true,
      onKeyDown: isNumberKey,
    },
    {
      name: "notes",
      type: "textarea",
      placeholder: "Notes",
      isRequired: false,
    },
  ];

  const handleSave = async (values) => {
    setIsLoading(true);
    try {
      await createClient(values);
      setOpen(false);
      reset();
      toast.success("New client has been successfully added.");
    } catch (error) {
      console.error("Error saving client:", error);
      toast.error("Error saving client. Please Check Input Fields");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="my-2 flex flex-row items-center justify-between">
        <div className="fw-bold text-xl">Clients</div>
        <button
          onClick={() => setOpen(true)}
          className="h-full rounded bg-darkGreen px-4 py-2 font-bold text-white shadow-sm hover:bg-darkBlue"
        >
          {"Add Client"}
        </button>
      </div>
      {/* Offcanvas Background Overlay */}
      <div
        className={` fixed inset-0 z-10 bg-[#1f293799] transition-opacity duration-300 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setOpen(false)}
      ></div>

      {/* Offcanvas Content */}
      <div
        className={`fixed right-0 top-0 z-30 flex h-screen w-3/4 max-w-full transition-transform duration-300 lg:w-1/3 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex w-full flex-col bg-white shadow-lg">
          <div className="flex w-full flex-row items-center justify-between bg-darkGreen p-2">
            <h2 className="text-lg font-medium text-white">Add New Client</h2>
            <button
              onClick={() => setOpen(false)}
              className="rounded-md p-2 text-white hover:text-gray-500"
            >
              <span className="sr-only">Close</span>X
            </button>
          </div>

          {/* Form */}
          <form
            onSubmit={handleSubmit(handleSave)}
            className="mt-4 space-y-6 p-4"
          >
            {inputFields.map(
              ({
                name,
                type,
                placeholder,
                isRequired,
                maxLength,
                minLength,
                onKeyDown,
              }) => (
                <div key={name} className="field">
                  {type === "textarea" ? (
                    <textarea
                      {...register(name, { required: isRequired })}
                      placeholder={placeholder}
                      className=" h-24 w-full rounded border-2 border-gray-400 p-2 text-gray-700 outline-none focus:border-darkGreen focus:ring-2 focus:ring-darkGreen"
                    />
                  ) : (
                    <input
                      {...register(name, {
                        required: isRequired,
                        minLength: minLength,
                        maxLength: maxLength,
                      })}
                      type={type}
                      placeholder={placeholder}
                      onKeyDown={onKeyDown}
                      className={
                        name === "prefix"
                          ? "w-full rounded border-2 border-gray-400 p-2 uppercase text-black outline-none focus:border-darkGreen focus:ring-2 focus:ring-darkGreen"
                          : "w-full rounded border-2 border-gray-400 p-2 text-black outline-none focus:border-darkGreen focus:ring-2 focus:ring-darkGreen"
                      }
                    />
                  )}
                  {errors[name] && errors[name].type === "required" && (
                    <p className="mt-1 text-xs text-red-500">
                      {name} is required
                    </p>
                  )}
                  {errors[name] && errors[name].type === "minLength" && (
                    <p className="mt-1 text-xs text-red-500">
                      {name} must be at least 3 characters
                    </p>
                  )}
                  {errors[name] && errors[name].type === "maxLength" && (
                    <p className="mt-1 text-xs text-red-500">
                      {name} Cannot be more than 3 characters
                    </p>
                  )}
                </div>
              ),
            )}
            <div className="flex justify-center">
              <button
                type="submit"
                className={`btn ${
                  isLoading ? "loading" : ""
                } w-full rounded bg-darkGreen p-2 text-white hover:bg-darkBlue`}
              >
                {isLoading ? "Adding..." : "Add Client"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default AddClient;
