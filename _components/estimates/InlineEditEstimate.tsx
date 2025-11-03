"use client";
import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { updateEstimate } from "../../app/lib/actions/estimates.actions";
import { toast } from "react-hot-toast";
import { FaFileInvoice, FaUser, FaCalendar, FaEdit, FaSave, FaTimes, FaPlus, FaTrash } from "react-icons/fa";
import { EstimateType, ClientType } from "../../app/lib/typeDefinitions";
import { formatDateStringUTC } from "../../app/lib/utils";

const InlineEditEstimate = ({
  estimate,
  isEditing,
  toggleEdit,
  canManage,
  clients,
}: {
  estimate: EstimateType;
  isEditing: boolean;
  toggleEdit?: () => void;
  canManage: boolean;
  clients: ClientType[];
}) => {
  const updateEstimateWithId = updateEstimate.bind(null, estimate._id.toString());
  const [isUpdating, setIsUpdating] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
  } = useForm({
    defaultValues: {
      items: estimate.items || []
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items"
  });

  const onSubmit = async (formData: any) => {
    setIsUpdating(true);
    try {
      // Process nested prospect info fields
      const processedData: any = { ...formData };
      
      // Handle clientId - if empty string, set to undefined
      if (processedData.clientId === "" || processedData.clientId === null) {
        processedData.clientId = undefined;
      }
      
      // Extract prospect info fields
      const prospectInfo: any = {};
      Object.keys(formData).forEach(key => {
        if (key.startsWith('prospectInfo.')) {
          const fieldName = key.replace('prospectInfo.', '');
          prospectInfo[fieldName] = formData[key];
          delete processedData[key];
        }
      });
      
      // Only include prospectInfo if there are values
      if (Object.keys(prospectInfo).length > 0) {
        processedData.prospectInfo = prospectInfo;
      }
      
      // Process services field (convert string to array)
      if (formData.services) {
        processedData.services = formData.services
          .split('\n')
          .map((service: string) => service.trim())
          .filter((service: string) => service.length > 0);
      }
      
      // Process items array - ensure proper structure and calculate totals
      if (formData.items) {
        processedData.items = formData.items.map((item: any) => ({
          description: item.description || '',
          details: item.details || '',
          price: Number(item.price) || 0
        }));
        
        // Calculate totals from items with proper rounding
        const subtotal = Math.round(processedData.items.reduce((sum: number, item: any) => sum + (Number(item.price) || 0), 0) * 100) / 100;
        const gst = Math.round(subtotal * 0.05 * 100) / 100; // 5% GST
        const total = Math.round((subtotal + gst) * 100) / 100;
        
        processedData.subtotal = subtotal;
        processedData.gst = gst;
        processedData.total = total;
      }
      
      await updateEstimateWithId(processedData);
      toast.success("Estimate updated successfully");
      toggleEdit && toggleEdit();
    } catch (error) {
      console.error("Error updating estimate", error);
      toast.error("Failed to update estimate");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleStatusChange = async (newStatus: EstimateType["status"]) => {
    setIsUpdating(true);
    try {
      await updateEstimateWithId({ status: newStatus });
      toast.success("Status updated successfully!");
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Error updating status!");
    } finally {
      setIsUpdating(false);
    }
  };

  // Split fields into two columns for better layout
  const leftColumnFields = [
    {
      name: "estimateNumber",
      type: "text",
      label: "Estimate Number",
      isRequired: true,
      readOnly: true,
      icon: FaFileInvoice,
    },
    {
      name: "status",
      type: "select",
      label: "Status",
      isRequired: true,
      icon: FaEdit,
      options: [
        { value: "draft", label: "Draft" },
        { value: "sent", label: "Sent" },
        { value: "approved", label: "Approved" },
        { value: "rejected", label: "Rejected" },
      ],
    },
    {
      name: "createdDate",
      type: "text",
      label: "Created Date",
      isRequired: true,
      readOnly: true,
      icon: FaCalendar,
    },
    {
      name: "clientId",
      type: "select",
      label: "Client",
      isRequired: false,
      icon: FaUser,
      options: [
        { value: "", label: "No Client (Prospect)" },
        ...clients.map(client => ({ value: client._id.toString(), label: client.clientName }))
      ],
    },
  ];

  const rightColumnFields = [
    {
      name: "notes",
      type: "textarea",
      label: "Notes",
      isRequired: false,
      icon: FaEdit,
    },
    {
      name: "terms",
      type: "textarea",
      label: "Terms & Conditions",
      isRequired: false,
      icon: FaEdit,
    },
    {
      name: "services",
      type: "textarea",
      label: "Services (one per line)",
      isRequired: false,
      icon: FaEdit,
    },
  ];

  // Prospect info fields (only show if no clientId is selected)
  const prospectFields = [
    {
      name: "prospectInfo.businessName",
      type: "text",
      label: "Business Name",
      isRequired: false,
      icon: FaUser,
    },
    {
      name: "prospectInfo.contactPerson",
      type: "text",
      label: "Contact Person",
      isRequired: false,
      icon: FaUser,
    },
    {
      name: "prospectInfo.email",
      type: "email",
      label: "Email",
      isRequired: false,
      icon: FaUser,
    },
    {
      name: "prospectInfo.phone",
      type: "tel",
      label: "Phone",
      isRequired: false,
      icon: FaUser,
    },
    {
      name: "prospectInfo.address",
      type: "text",
      label: "Address",
      isRequired: false,
      icon: FaUser,
    },
    {
      name: "prospectInfo.projectLocation",
      type: "text",
      label: "Project Location",
      isRequired: false,
      icon: FaUser,
    },
  ];

  const getClientName = (estimate: EstimateType) => {
    if (estimate.clientId && (estimate as any).clientId?.clientName) {
      return (estimate as any).clientId.clientName;
    }
    return estimate.prospectInfo?.businessName || "Unknown";
  };

  // Helper function to get nested object value
  const getNestedValue = (obj: any, path: string) => {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  };

  const renderField = (field: any) => (
    <div key={field.name} className="space-y-1">
      <div className="flex items-center">
        <field.icon className="mr-2 h-4 w-4 text-gray-400" />
        <label className="block text-sm font-medium text-gray-700">
          {field.label}
          {field.isRequired && <span className="text-red-500 ml-1">*</span>}
        </label>
      </div>

      {isEditing ? (
        <div className="ml-6">
          {field.type === "textarea" ? (
            <textarea
              {...register(field.name, { required: field.isRequired })}
              placeholder={field.label}
              defaultValue={field.name === "services" 
                ? (getNestedValue(estimate, field.name) || []).join('\n')
                : getNestedValue(estimate, field.name)
              }
              readOnly={field.readOnly}
              rows={field.name === "services" ? 6 : 2}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 disabled:bg-gray-50 disabled:text-gray-500"
            />
          ) : field.type === "select" ? (
                         <select
               {...register(field.name, { required: field.isRequired })}
               defaultValue={field.name === "clientId" ? (getNestedValue(estimate, field.name) || "") : getNestedValue(estimate, field.name)}
               className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
             >
               <option value="">Select {field.label.toLowerCase()}...</option>
              {field.options?.map((option: any) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          ) : (
            <input
              {...register(field.name, { required: field.isRequired })}
              type={field.type}
              placeholder={field.label}
              defaultValue={field.name === "createdDate" ? formatDateStringUTC(estimate.createdDate) : getNestedValue(estimate, field.name)}
              readOnly={field.readOnly}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 disabled:bg-gray-50 disabled:text-gray-500"
            />
          )}
          {(errors as any)[field.name] && (errors as any)[field.name]?.type === "required" && (
            <p className="mt-1 text-xs text-red-500">
              {field.label} is required
            </p>
          )}
        </div>
      ) : (
        <div className="ml-6">
          <div className="rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-900">
            {field.name === "createdDate" ? (
              formatDateStringUTC(estimate.createdDate)
            ) : field.name === "status" ? (
              <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                estimate.status === "approved" ? "bg-green-100 text-green-800" :
                estimate.status === "rejected" ? "bg-red-100 text-red-800" :
                estimate.status === "sent" ? "bg-yellow-100 text-yellow-800" :
                "bg-gray-100 text-gray-800"
              }`}>
                {estimate.status.charAt(0).toUpperCase() + estimate.status.slice(1)}
              </span>
            ) : field.name === "clientId" ? (
              estimate.clientId ? getClientName(estimate) : "No Client (Prospect)"
            ) : field.name === "services" ? (
              <div className="space-y-1">
                {(getNestedValue(estimate, field.name) || []).map((service: string, index: number) => (
                  <div key={index} className="text-sm">• {service}</div>
                ))}
              </div>
            ) : (
              getNestedValue(estimate, field.name) || (
                <span className="text-gray-400 italic">Not provided</span>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
      <div className="border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100">
              <FaFileInvoice className="h-4 w-4 text-green-600" />
            </div>
            <div className="ml-3">
              <h3 className="text-base font-semibold text-gray-900">Estimate Information</h3>
              <p className="text-xs text-gray-500">
                {isEditing ? "Edit estimate details" : "View estimate information"}
              </p>
            </div>
          </div>
          {canManage && (
            <EstimateStatusUpdate
              onStatusChange={handleStatusChange}
              estimateStatus={estimate.status}
              isLoading={isUpdating}
            />
          )}
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

        {/* Prospect Information Section - Only show if no client is selected or when editing */}
        {(!estimate.clientId || isEditing) && (
          <div className="mt-6 border-t border-gray-200 pt-6">
            <h4 className="mb-4 text-sm font-medium text-gray-900">Prospect Information</h4>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {prospectFields.map(renderField)}
            </div>
          </div>
        )}

        {/* Items Section */}
        <div className="mt-6 border-t border-gray-200 pt-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-medium text-gray-900">Items</h4>
            {isEditing && (
              <button
                type="button"
                onClick={() => append({ description: '', details: '', price: 0 })}
                className="inline-flex items-center rounded-md bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              >
                <FaPlus className="mr-2 h-3 w-3" />
                Add Item
              </button>
            )}
          </div>
          
          {isEditing ? (
            <div className="space-y-4">
              {fields.map((field, index) => (
                <div key={field.id} className="rounded-lg border border-gray-200 p-4">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-4">
                      <div className="flex-1">
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Description
                        </label>
                        <input
                          {...register(`items.${index}.description` as const)}
                          type="text"
                          placeholder="Service description"
                          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                        />
                      </div>
                      <div className="w-32">
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Price
                        </label>
                        <input
                          {...register(`items.${index}.price` as const)}
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="mt-6 inline-flex items-center rounded-md bg-red-100 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                      >
                        <FaTrash className="h-3 w-3" />
                      </button>
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        System Details
                      </label>
                      <input
                        {...register(`items.${index}.details` as const)}
                        type="text"
                        placeholder="System specifications (e.g., 2 hoods 17 filters)"
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                      />
                    </div>
                  </div>
                </div>
              ))}
              {fields.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>No items added yet.</p>
                  <p className="text-sm">Click "Add Item" to start adding items to this estimate.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {estimate.items && estimate.items.length > 0 ? (
                estimate.items.map((item, index) => (
                  <div key={index} className="rounded-lg bg-gray-50 px-4 py-3">
                    <div className="flex justify-between items-center">
                      <div className="flex-1">
                        <span className="text-sm text-gray-900">{item.description}</span>
                        {item.details && (
                          <div className="text-xs text-gray-600 mt-1">
                            {item.details}
                          </div>
                        )}
                      </div>
                      <span className="text-sm font-medium text-gray-900">${item.price.toFixed(2)}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No items added to this estimate.</p>
                </div>
              )}
            </div>
                     )}
         </div>

         {/* Totals Section */}
         <div className="mt-6 border-t border-gray-200 pt-6">
           <h4 className="mb-4 text-sm font-medium text-gray-900">Totals</h4>
           <div className="space-y-2">
             <div className="flex justify-between items-center">
               <span className="text-sm text-gray-600">Subtotal:</span>
               <span className="text-sm font-medium text-gray-900">
                 ${(estimate.items?.reduce((sum: number, item: any) => sum + (Number(item.price) || 0), 0) || 0).toFixed(2)}
               </span>
             </div>
             <div className="flex justify-between items-center">
               <span className="text-sm text-gray-600">GST (5%):</span>
               <span className="text-sm font-medium text-gray-900">
                 ${((estimate.items?.reduce((sum: number, item: any) => sum + (Number(item.price) || 0), 0) || 0) * 0.05).toFixed(2)}
               </span>
             </div>
             <div className="flex justify-between items-center border-t border-gray-200 pt-2">
               <span className="text-sm font-medium text-gray-900">Total:</span>
               <span className="text-sm font-bold text-gray-900">
                 ${((estimate.items?.reduce((sum: number, item: any) => sum + (Number(item.price) || 0), 0) || 0) * 1.05).toFixed(2)}
               </span>
             </div>
           </div>
         </div>
 
         {isEditing && (
          <div className="mt-4 flex space-x-3 border-t border-gray-200 pt-4">
            <button
              type="submit"
              disabled={isUpdating}
              className="flex-1 inline-flex items-center justify-center rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
            >
              <FaSave className="mr-2 h-3 w-3" />
              {isUpdating ? "Saving..." : "Save Changes"}
            </button>
            <button
              type="button"
              onClick={toggleEdit || (() => {})}
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

const EstimateStatusUpdate = ({ 
  onStatusChange, 
  estimateStatus, 
  isLoading 
}: { 
  onStatusChange: (status: EstimateType["status"]) => void, 
  estimateStatus: string, 
  isLoading?: boolean 
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onStatusChange(e.target.value as EstimateType["status"]);
  };

  const getStatusStyles = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800 ring-green-600/20";
      case "rejected":
        return "bg-red-100 text-red-800 ring-red-600/20";
      case "sent":
        return "bg-yellow-100 text-yellow-800 ring-yellow-600/20";
      case "draft":
      default:
        return "bg-gray-100 text-gray-800 ring-gray-600/20";
    }
  };

  return (
    <div className="flex items-center space-x-3">
      <select
        value={estimateStatus}
        onChange={handleChange}
        disabled={isLoading}
        className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 disabled:opacity-50"
      >
        <option value="draft">Draft</option>
        <option value="sent">Sent</option>
        <option value="approved">Approved</option>
        <option value="rejected">Rejected</option>
      </select>
      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${getStatusStyles(estimateStatus)}`}>
        {estimateStatus.charAt(0).toUpperCase() + estimateStatus.slice(1)}
      </span>
    </div>
  );
};

export default InlineEditEstimate; 