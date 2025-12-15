"use client";
import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { FaPlus, FaTimes, FaFileInvoice, FaUser, FaCalendar, FaEdit, FaList, FaDollarSign, FaTrash } from "react-icons/fa";
import { createEstimate } from "../../app/lib/actions/estimates.actions";
import { ClientType } from "../../app/lib/typeDefinitions";
import { useDebounceSubmit } from "../../app/hooks/useDebounceSubmit";
import { toast } from "react-hot-toast";

interface AddEstimateProps {
  clients: ClientType[];
}

interface EstimateFormValues {
  clientId?: string;
  prospectInfo?: {
    businessName?: string;
    contactPerson?: string;
    email?: string;
    phone?: string;
    address?: string;
    projectLocation?: string;
  };
  services: string[];
  notes?: string;
  items: { description: string; details?: string; price: number }[];
}

const AddEstimate = ({ clients }: AddEstimateProps) => {
  const [open, setOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<ClientType | null>(null);
  const [showProspectFields, setShowProspectFields] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<EstimateFormValues>({
    defaultValues: {
      items: [{ description: "", details: "", price: 0 }],
      services: [
        "Hood from inside and outside",
        "All filters", 
        "Access panels to duct work (accessible area only)",
        "Rooftop fan (If safe access)",
        "Fire wall behind equipment",
        "ASTTBC Sticker",
        "Fire Dept Report",
        "Before/After pictures"
      ]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items"
  });

  const clientId = watch("clientId");
  const [selectedServices, setSelectedServices] = useState([
    "Hood from inside and outside",
    "All filters",
    "Access panels to duct work (accessible area only)",
    "Rooftop fan (If safe access)",
    "Fire wall behind equipment",
    "ASTTBC Sticker",
    "Fire Dept Report",
    "Before/After pictures"
  ]);

  const { isProcessing, debouncedSubmit } = useDebounceSubmit({
    onSubmit: async (data: EstimateFormValues) => {
      // Process the form data
      const processedData: any = { ...data };
      
      // Handle clientId - if empty string, set to undefined
      if (processedData.clientId === "" || processedData.clientId === null) {
        processedData.clientId = undefined;
      }
      
      // Extract prospect info fields
      const prospectInfo: any = {};
      Object.keys(data).forEach(key => {
        if (key.startsWith('prospectInfo.')) {
          const fieldName = key.replace('prospectInfo.', '');
          prospectInfo[fieldName] = data[key as keyof EstimateFormValues];
          delete processedData[key];
        }
      });
      
      // Also check if prospectInfo is directly in the data
      if (data.prospectInfo) {
        Object.assign(prospectInfo, data.prospectInfo);
        delete processedData.prospectInfo;
      }
      
      // Only include prospectInfo if there are values
      if (Object.keys(prospectInfo).length > 0) {
        processedData.prospectInfo = prospectInfo;
      }
      
      // Process services field (use selectedServices state)
      processedData.services = selectedServices;
      
      // Add default terms
      processedData.terms = "Payment is due upon completion of service. Prices subject to change if scope of work differs from initial assessment.";
      
      // Process items array - ensure proper structure and calculate totals
      if (data.items) {
        processedData.items = data.items.map((item: any) => ({
          description: item.description || '',
          details: item.details || '',
          price: Number(item.price) || 0
        }));
        
        // Calculate totals from items
        const subtotal = processedData.items.reduce((sum: number, item: any) => sum + (Number(item.price) || 0), 0);
        const gst = subtotal * 0.05; // 5% GST
        const total = subtotal + gst;
        
        processedData.subtotal = subtotal;
        processedData.gst = gst;
        processedData.total = total;
      }
      
      await createEstimate(processedData);
      setOpen(false);
      reset();
      setSelectedClient(null);
      setShowProspectFields(false);
      setSelectedServices([
        "Hood from inside and outside",
        "All filters",
        "Access panels to duct work (accessible area only)",
        "Rooftop fan (If safe access)",
        "Fire wall behind equipment",
        "ASTTBC Sticker",
        "Fire Dept Report",
        "Before/After pictures"
      ]);
    },
    successMessage: "Estimate has been successfully created",
  });

  const handleClientSelect = (client: ClientType | null) => {
    if (client) {
      setValue("clientId", client._id as string);
      setSelectedClient(client);
      setShowProspectFields(false);
    } else {
      setValue("clientId", "");
      setSelectedClient(null);
      setShowProspectFields(true);
    }
  };

  const handleServiceToggle = (service: string) => {
    setSelectedServices(prev => 
      prev.includes(service) 
        ? prev.filter(s => s !== service)
        : [...prev, service]
    );
  };

  // Watch for clientId changes to show/hide prospect fields
  useEffect(() => {
    if (!clientId) {
      setShowProspectFields(true);
    } else {
      setShowProspectFields(false);
    }
  }, [clientId]);

  const calculateTotal = () => {
    return fields.reduce((total, field, index) => {
      const price = Number(watch(`items.${index}.price`)) || 0;
      return total + price;
    }, 0);
  };

  const subtotal = Math.round(calculateTotal() * 100) / 100;
  const gst = Math.round(subtotal * 0.05 * 100) / 100;
  const total = Math.round((subtotal + gst) * 100) / 100;

  return (
    <>
      {/* Background Overlay */}
      <div
        className={`fixed inset-0 z-40 bg-black/70 backdrop-blur-md transition-all duration-300 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setOpen(false)}
      ></div>
      
      {/* Modal Content */}
      <div
        className={`fixed right-0 top-0 z-50 flex h-screen w-full max-w-2xl transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex w-full flex-col bg-white shadow-2xl">
          {/* Header */}
          <div className="flex w-full flex-row items-center justify-between bg-linear-to-r from-darkGreen to-green-600 p-4 shadow-lg">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
                <FaFileInvoice className="h-4 w-4 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Create New Estimate</h2>
                <p className="text-xs text-green-100">Generate estimate for client services</p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="group rounded-lg p-2 text-white hover:bg-white/20 transition-all duration-200 border border-white/20"
            >
              <FaTimes className="h-3 w-3 transition-transform group-hover:rotate-90" />
            </button>
          </div>
          
          <form
            onSubmit={handleSubmit(debouncedSubmit)}
            className="flex-1 overflow-auto bg-gray-50"
          >
            <div className="space-y-3 p-4">
              {/* Client Selection */}
              <div className="group">
                <label className="mb-1 block text-xs font-semibold text-gray-800">
                  Select Client
                </label>
                <p className="mb-2 text-xs text-gray-500 leading-relaxed">
                  Choose an existing client or leave empty for prospect
                </p>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-darkGreen transition-colors">
                    <FaUser className="h-3 w-3" />
                  </div>
                  <select
                    {...register("clientId")}
                    onChange={(e) => {
                      const client = clients.find(c => c._id.toString() === e.target.value);
                      handleClientSelect(client || null);
                    }}
                    className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-800 outline-none focus:border-darkGreen focus:ring-1 focus:ring-green-100 text-sm"
                  >
                    <option value="">No Client (Prospect)</option>
                    {clients.map(client => (
                      <option key={client._id.toString()} value={client._id.toString()}>
                        {client.clientName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Prospect Information Section */}
              {showProspectFields && (
                <div className="space-y-3 border-t border-gray-200 pt-4">
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-linear-to-r from-blue-500 to-blue-600">
                      <FaUser className="h-3 w-3 text-white" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-gray-800">Prospect Information</h3>
                      <p className="text-xs text-gray-600">Details for potential new client</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div className="group">
                      <label className="mb-1 block text-xs font-semibold text-gray-800">
                        Business Name
                      </label>
                      <input
                        {...register("prospectInfo.businessName")}
                        placeholder="Business or company name"
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-800 placeholder-gray-400 outline-none focus:border-darkGreen focus:ring-1 focus:ring-green-100 text-sm"
                      />
                    </div>
                    
                    <div className="group">
                      <label className="mb-1 block text-xs font-semibold text-gray-800">
                        Contact Person
                      </label>
                      <input
                        {...register("prospectInfo.contactPerson")}
                        placeholder="Primary contact name"
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-800 placeholder-gray-400 outline-none focus:border-darkGreen focus:ring-1 focus:ring-green-100 text-sm"
                      />
                    </div>
                    
                    <div className="group">
                      <label className="mb-1 block text-xs font-semibold text-gray-800">
                        Email
                      </label>
                      <input
                        {...register("prospectInfo.email")}
                        type="email"
                        placeholder="contact@business.com"
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-800 placeholder-gray-400 outline-none focus:border-darkGreen focus:ring-1 focus:ring-green-100 text-sm"
                      />
                    </div>
                    
                    <div className="group">
                      <label className="mb-1 block text-xs font-semibold text-gray-800">
                        Phone
                      </label>
                      <input
                        {...register("prospectInfo.phone")}
                        type="tel"
                        placeholder="(555) 123-4567"
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-800 placeholder-gray-400 outline-none focus:border-darkGreen focus:ring-1 focus:ring-green-100 text-sm"
                      />
                    </div>
                    
                    <div className="group md:col-span-2">
                      <label className="mb-1 block text-xs font-semibold text-gray-800">
                        Address
                      </label>
                      <input
                        {...register("prospectInfo.address")}
                        placeholder="Business address"
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-800 placeholder-gray-400 outline-none focus:border-darkGreen focus:ring-1 focus:ring-green-100 text-sm"
                      />
                    </div>
                    
                    <div className="group md:col-span-2">
                      <label className="mb-1 block text-xs font-semibold text-gray-800">
                        Project Location
                      </label>
                      <input
                        {...register("prospectInfo.projectLocation")}
                        placeholder="Where the work will be performed"
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-800 placeholder-gray-400 outline-none focus:border-darkGreen focus:ring-1 focus:ring-green-100 text-sm"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Services Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-linear-to-r from-blue-500 to-blue-600">
                    <FaList className="h-3 w-3 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-800">Our vent cleaning service includes:</h3>
                    <p className="text-xs text-gray-600">Select the services to be included</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {[
                    "Hood from inside and outside",
                    "All filters",
                    "Access panels to duct work (accessible area only)",
                    "Rooftop fan (If safe access)",
                    "Fire wall behind equipment",
                    "ASTTBC Sticker",
                    "Fire Dept Report",
                    "Before/After pictures"
                  ].map((service, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 bg-white hover:border-gray-300 transition-all duration-200">
                      <input
                        type="checkbox"
                        id={`service-${index}`}
                        checked={selectedServices.includes(service)}
                        onChange={() => handleServiceToggle(service)}
                        className="h-4 w-4 text-darkGreen border-gray-300 rounded focus:ring-darkGreen focus:ring-2"
                      />
                      <label htmlFor={`service-${index}`} className="text-sm text-gray-800 cursor-pointer">
                        {service}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Estimate Items Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-linear-to-r from-darkBlue to-blue-600">
                    <FaList className="h-3 w-3 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-800">Estimate Items</h3>
                    <p className="text-xs text-gray-600">Add services and their costs</p>
                  </div>
                </div>
                
                {fields.map((field, index) => (
                  <div
                    key={field.id}
                    className="p-3 rounded-lg border border-gray-200 bg-white hover:border-gray-300 transition-all duration-200"
                  >
                    <div className="flex items-center gap-2">
                      <div className="flex-1 space-y-2">
                        <div className="relative">
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                            <FaList className="h-3 w-3" />
                          </div>
                          <input
                            {...register(`items.${index}.description` as const, {
                              required: "Item description is required",
                            })}
                            placeholder="Service description (e.g., Kitchen hood cleaning)"
                            className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-800 placeholder-gray-400 outline-none focus:border-darkGreen focus:ring-1 focus:ring-green-100 text-sm"
                          />
                        </div>
                        <div className="relative">
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                            <FaEdit className="h-3 w-3" />
                          </div>
                          <input
                            {...register(`items.${index}.details` as const)}
                            placeholder="System details (e.g., 2 hoods 17 filters)"
                            className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-800 placeholder-gray-400 outline-none focus:border-darkGreen focus:ring-1 focus:ring-green-100 text-sm"
                          />
                        </div>
                        <div className="relative w-24">
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                            <FaDollarSign className="h-3 w-3" />
                          </div>
                          <input
                            {...register(`items.${index}.price` as const, {
                              required: "Price is required",
                              valueAsNumber: true,
                            })}
                            placeholder="0.00"
                            type="number"
                            step="0.01"
                            min="0"
                            className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-800 placeholder-gray-400 outline-none focus:border-darkGreen focus:ring-1 focus:ring-green-100 text-sm"
                          />
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        disabled={fields.length === 1}
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 border border-red-200 text-red-500 hover:bg-red-100 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <FaTrash className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
                
                <button
                  type="button"
                  onClick={() => append({ description: "", details: "", price: 0 })}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-gray-100 border border-dashed border-gray-300 px-3 py-2 font-medium text-gray-600 transition-all duration-200 hover:bg-gray-200 hover:border-gray-400 text-sm"
                >
                  <FaPlus className="h-3 w-3" />
                  Add Another Item
                </button>

                {/* Totals Display */}
                {fields.length > 0 && (
                  <div className="space-y-2 rounded-lg bg-darkGreen/10 border border-darkGreen/20 p-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Subtotal:</span>
                      <span className="text-sm font-medium text-gray-900">
                        ${subtotal.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">GST (5%):</span>
                      <span className="text-sm font-medium text-gray-900">
                        ${gst.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center border-t border-gray-200 pt-2">
                      <span className="text-sm font-medium text-gray-900">Total:</span>
                      <span className="text-lg font-bold text-darkGreen">
                        ${total.toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Additional Notes */}
              <div className="group">
                <label className="mb-1 block text-xs font-semibold text-gray-800">
                  Additional Notes
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-3 text-gray-400 group-focus-within:text-darkGreen transition-colors">
                    <FaEdit className="h-3 w-3" />
                  </div>
                  <textarea
                    {...register("notes")}
                    placeholder="Special instructions, scheduling notes, etc."
                    rows={3}
                    className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-800 placeholder-gray-400 outline-none focus:border-darkGreen focus:ring-1 focus:ring-green-100 text-sm resize-none"
                  />
                </div>
              </div>
            </div>
            
            {/* Submit Button */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4">
              <button
                type="submit"
                disabled={isProcessing}
                className={`w-full rounded-lg bg-linear-to-r from-darkBlue to-blue-600 py-3 text-white font-bold border border-blue-500/20 transition-all duration-300 shadow-lg text-sm
                  ${
                    isProcessing
                      ? "opacity-70 cursor-not-allowed"
                      : "hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                  }`}
              >
                <div className="flex items-center justify-center gap-2">
                  {isProcessing ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white"></div>
                      Creating Estimate...
                    </>
                  ) : (
                    <>
                      <FaFileInvoice className="h-3 w-3" />
                      Create Estimate
                    </>
                  )}
                </div>
              </button>
            </div>
          </form>
        </div>
      </div>
      
      {/* Trigger Button */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center justify-center gap-2 rounded-lg bg-darkGreen px-3 py-2 text-sm text-white transition-colors hover:bg-darkGreen/90 sm:w-auto"
      >
        <FaPlus className="h-4 w-4" />
        New Estimate
      </button>
    </>
  );
};

export default AddEstimate; 