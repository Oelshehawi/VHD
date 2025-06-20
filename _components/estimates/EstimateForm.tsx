"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { toast } from "react-hot-toast";
import { EstimateType, ClientType } from "../../app/lib/typeDefinitions";
import {
  createEstimate,
  updateEstimate,
} from "../../app/lib/actions/estimates.actions";
import { generateEstimateNumber } from "../../app/lib/estimates.data";
import { FaPlus, FaTimes, FaSave, FaFileImage } from "react-icons/fa";

interface EstimateFormProps {
  estimate?: EstimateType | null;
  clients: ClientType[];
  onClose: () => void;
}

interface EstimateFormData {
  clientId?: string;
  prospectInfo?: {
    businessName: string;
    contactPerson?: string;
    email?: string;
    phone?: string;
    address?: string;
    projectLocation?: string;
  };
  status: EstimateType["status"];
  items: { description: string; price: number }[];
  services: string[];
  terms?: string;
  notes?: string;
}

const defaultServices = [
  "Hood from inside and outside",
  "All filters",
  "Access panels to duct work (accessible area only)",
  "Rooftop fan (If safe access)",
  "Fire wall behind equipment",
  "ASTTBC Sticker",
  "Fire Dept Report",
  "Before/After pictures",
];

const defaultTerms =
  "Payment is due upon completion of service. Prices subject to change if scope of work differs from initial assessment.";

export default function EstimateForm({
  estimate,
  clients,
  onClose,
}: EstimateFormProps) {
  const [loading, setLoading] = useState(false);
  const [isProspect, setIsProspect] = useState(!estimate?.clientId);
  const [estimateNumber, setEstimateNumber] = useState("");

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<EstimateFormData>({
    defaultValues: {
      clientId: estimate?.clientId?.toString() || "",
      prospectInfo: estimate?.prospectInfo || {
        businessName: "",
        contactPerson: "",
        email: "",
        phone: "",
        address: "",
        projectLocation: "",
      },
      status: estimate?.status || "draft",
      items: estimate?.items || [
        { description: "Initial Deep Cleaning", price: 960 },
      ],
      services: estimate?.services || defaultServices,
      terms: estimate?.terms || defaultTerms,
      notes: estimate?.notes || "",
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });

  const watchedItems = watch("items");
  const subtotal = watchedItems.reduce((sum, item) => {
    const price = parseFloat(item.price?.toString() || "0") || 0;
    return sum + price;
  }, 0);
  const gst = subtotal * 0.05;
  const total = subtotal + gst;

  useEffect(() => {
    if (!estimate) {
      // Generate estimate number for new estimates
      generateEstimateNumber().then(setEstimateNumber);
    } else {
      setEstimateNumber(estimate.estimateNumber);
    }
  }, [estimate]);

  const onSubmit = async (data: EstimateFormData) => {
    setLoading(true);
    try {
      const estimateData = {
        ...data,
        subtotal,
        gst,
        total,
        clientId: isProspect ? undefined : data.clientId,
        prospectInfo: isProspect ? data.prospectInfo : undefined,
      };

      if (estimate) {
        await updateEstimate(estimate._id.toString(), estimateData);
        toast.success("Estimate updated successfully");
      } else {
        await createEstimate(estimateData);
        toast.success("Estimate created successfully");
      }

      onClose();
    } catch (error) {
      console.error("Error saving estimate:", error);
      toast.error("Failed to save estimate");
    } finally {
      setLoading(false);
    }
  };

  const addItem = () => {
    append({ description: "", price: 0 });
  };

  const removeItem = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Company Header */}
      <div className="rounded-lg bg-darkGreen p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">VANCOUVER HOOD DOCTORS</h2>
            <p className="text-lg">Kitchen Exhaust Cleaning Specialists</p>
          </div>
          <div className="text-right">
            <div className="rounded bg-white/20 px-3 py-1">
              <span className="text-sm font-medium">Estimate No:</span>
              <div className="text-lg font-bold">{estimateNumber}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Company Information */}
      <div className="rounded-lg border p-4">
        <h3 className="mb-4 text-lg font-semibold">Company Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Company Name
            </label>
            <input
              type="text"
              value="Vancouver Hood Doctors"
              readOnly
              className="mt-1 block w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Phone
            </label>
            <input
              type="text"
              value="604-273-8717"
              readOnly
              className="mt-1 block w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              value="adam@vancouverventcleaning.ca"
              readOnly
              className="mt-1 block w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Address
            </label>
            <input
              type="text"
              value="51-11020 Williams Rd., Richmond BC V7A1X8"
              readOnly
              className="mt-1 block w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2"
            />
          </div>
        </div>
      </div>

      {/* Client/Prospect Toggle */}
      <div className="rounded-lg border p-4">
        <div className="mb-4 flex items-center space-x-4">
          <label className="flex items-center">
            <input
              type="radio"
              checked={!isProspect}
              onChange={() => setIsProspect(false)}
              className="mr-2"
            />
            Existing Client
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              checked={isProspect}
              onChange={() => setIsProspect(true)}
              className="mr-2"
            />
            New Prospect
          </label>
        </div>

        {!isProspect ? (
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Select Client
            </label>
            <select
              {...register("clientId", { required: !isProspect })}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            >
              <option value="">Select a client...</option>
              {clients.map((client) => (
                <option
                  key={client._id.toString()}
                  value={client._id.toString()}
                >
                  {client.clientName}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Business Name *
              </label>
              <input
                type="text"
                {...register("prospectInfo.businessName", {
                  required: isProspect,
                })}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Contact Person
              </label>
              <input
                type="text"
                {...register("prospectInfo.contactPerson")}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                {...register("prospectInfo.email")}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Phone
              </label>
              <input
                type="tel"
                {...register("prospectInfo.phone")}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Address
              </label>
              <input
                type="text"
                {...register("prospectInfo.address")}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Project Location (if different)
              </label>
              <input
                type="text"
                {...register("prospectInfo.projectLocation")}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </div>
          </div>
        )}
      </div>

      {/* Items */}
      <div className="rounded-lg border p-4">
        <h3 className="mb-4 text-lg font-semibold">Estimated Costs</h3>
        <div className="space-y-3">
          {fields.map((field, index) => (
            <div key={field.id} className="flex items-center gap-3">
              <div className="w-16">
                <input
                  type="text"
                  value={index + 1}
                  readOnly
                  className="w-full rounded border border-gray-300 bg-gray-50 px-2 py-1 text-center text-sm"
                />
              </div>
              <div className="flex-1">
                <input
                  type="text"
                  {...register(`items.${index}.description`, {
                    required: true,
                  })}
                  placeholder="Item description"
                  className="w-full rounded border border-gray-300 px-3 py-2"
                />
              </div>
              <div className="w-32">
                <input
                  type="number"
                  step="0.01"
                  {...register(`items.${index}.price`, {
                    required: true,
                    min: 0,
                  })}
                  placeholder="0.00"
                  className="w-full rounded border border-gray-300 px-3 py-2"
                />
              </div>
              {fields.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  className="rounded bg-red-500 p-2 text-white hover:bg-red-600"
                >
                  <FaTimes className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addItem}
          className="mt-3 flex items-center gap-2 rounded bg-darkGreen px-3 py-2 text-white hover:bg-darkGreen/90"
        >
          <FaPlus className="h-3 w-3" />
          Add Item
        </button>

        {/* Totals */}
        <div className="mt-6 space-y-2 border-t pt-4">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span className="font-medium">${(subtotal || 0).toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>GST (5%):</span>
            <span className="font-medium">${(gst || 0).toFixed(2)}</span>
          </div>
          <div className="flex justify-between border-t pt-2 text-lg font-bold">
            <span>Total:</span>
            <span>${(total || 0).toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Services */}
      <div className="rounded-lg border p-4">
        <h3 className="mb-4 text-lg font-semibold">
          Our vent cleaning service includes:
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {defaultServices.map((service, index) => (
            <label key={index} className="flex items-center">
              <input
                type="checkbox"
                {...register("services")}
                value={service}
                defaultChecked={true}
                className="mr-2"
              />
              <span className="text-sm">{service}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Terms and Notes */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Terms & Conditions
          </label>
          <textarea
            {...register("terms")}
            rows={4}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Notes
          </label>
          <textarea
            {...register("notes")}
            rows={4}
            placeholder="Additional notes..."
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className="rounded-md border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 rounded-md bg-darkGreen px-4 py-2 text-white hover:bg-darkGreen/90 disabled:opacity-50"
        >
          <FaSave className="h-4 w-4" />
          {loading
            ? "Saving..."
            : estimate
              ? "Update Estimate"
              : "Create Estimate"}
        </button>
      </div>
    </form>
  );
}
