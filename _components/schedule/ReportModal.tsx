"use client";
import { useState, useEffect } from "react";
import { XMarkIcon } from "@heroicons/react/24/solid";
import {
  ReportType,
  ScheduleType,
  TechnicianType,
} from "../../app/lib/typeDefinitions";
import {
  createOrUpdateReport,
  getReportByScheduleId,
  getReportsByJobNameAndLocation,
} from "../../app/lib/actions/scheduleJobs.actions";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { format } from "date-fns";
import ReportSelectionModal from "./ReportSelectionModal";


type FormStep = "basic" | "equipment" | "inspection" | "recommendations";

type InspectionItemType = {
  status?: "Yes" | "No" | "N/A";
};

interface ReportFormProps {
  schedule: ScheduleType;
  onClose: () => void;
  technicians: TechnicianType[];
}

interface FormData {
  _id?: string;
  scheduleId: string;
  invoiceId: string;
  jobTitle?: string;
  location?: string;
  dateCompleted: Date | string;
  technicianId: string;
  lastServiceDate?: Date | string;
  fuelType?: string;
  cookingVolume?: string;
  cookingEquipment?: string[];
  inspectionItems: InspectionItemType[];
  equipmentDetails: {
    hoodType: string;
    filterType: string;
    ductworkType: string;
    fanType: string;
  };
  cleaningDetails: {
    hoodCleaned: boolean;
    filtersCleaned: boolean;
    ductworkCleaned: boolean;
    fanCleaned: boolean;
  };
  recommendedCleaningFrequency?: number;
  comments?: string;
  recommendations?: string;
}

const ReportModal = ({ schedule, onClose, technicians }: ReportFormProps) => {
  const [step, setStep] = useState<FormStep>("basic");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isAutoFilling, setIsAutoFilling] = useState(false);
  const [autoFilledFields, setAutoFilledFields] = useState<string[]>([]);
  const [clientReports, setClientReports] = useState<any[]>([]);
  const [showReportSelector, setShowReportSelector] = useState(false);

  // Smart technician pre-selection
  const getDefaultTechnician = () => {
    // If only one technician, select them
    if (technicians.length === 1) {
      return technicians[0]?.id || "";
    }
    
    // If job has assigned technicians, try to match one
    if (schedule.assignedTechnicians && schedule.assignedTechnicians.length > 0) {
      const assignedTech = technicians.find(tech => 
        schedule.assignedTechnicians.includes(tech.id)
      );
      if (assignedTech) {
        return assignedTech.id;
      }
    }
    
    return "";
  };

  const [formData, setFormData] = useState<FormData>({
    scheduleId: schedule._id.toString(),
    invoiceId:
      typeof schedule.invoiceRef === "string"
        ? schedule.invoiceRef
        : schedule.invoiceRef.toString(),
    jobTitle: schedule.jobTitle,
    location: schedule.location,
    dateCompleted: new Date(),
    technicianId: getDefaultTechnician(),
    cookingEquipment: [],
    inspectionItems: [],
    equipmentDetails: {
      hoodType: "",
      filterType: "",
      ductworkType: "",
      fanType: "",
    },
    cleaningDetails: {
      hoodCleaned: false,
      filtersCleaned: false,
      ductworkCleaned: false,
      fanCleaned: false,
    },
  });

  // Add this after useState declarations
  const inspectionItems = [
    { name: "Filters are in place?" },
    { name: "Filters listed?" },
    { name: "Filters needs to be cleaned more often?" },
    { name: "Filters need to be replaced?" },
    { name: "Wash cycle working?" },
    { name: "Fire suppression nozzles clear?" },
    { name: "Fan tips and is accessible?" },
    { name: "Safe access to fan?" },
    { name: "Exhaust fan is operable?" },
    { name: "Ecology Unit requires cleaning?" },
    { name: "Ecology Unit deficiencies?" },
    { name: "Grease buildup on roof between cleanings?" },
    { name: "Entire system cleaned in accordance with applicable codes?" },
    { name: "Entire system interior accessible for cleaning?" },
    { name: "Multi storey vertical requires cleaning (Spinjets)?" },
    { name: "Adequate number of access panels?" },
  ];

  const cookingEquipmentOptions = [
    { value: "griddles", label: "Griddles" },
    { value: "deepFatFryers", label: "Deep Fat Fryers" },
    { value: "woks", label: "Woks" },
    { value: "ovens", label: "Ovens" },
    { value: "flattopGrills", label: "Flattop Grills" },
  ];

  // Fetch existing report data if available
  useEffect(() => {
    const fetchReport = async () => {
      try {
        const report = await getReportByScheduleId(schedule._id.toString());
        if (report) {
          // Convert inspection items from object to array format
          const arrayInspectionItems: InspectionItemType[] = [];

          // Use the same key mappings for consistency with better typing
          const keyMappings: { [key: string]: string } = {
            "0": "filtersInPlace",
            "1": "filtersListed",
            "2": "filtersNeedCleaningMoreOften",
            "3": "filtersNeedReplacement",
            "4": "washCycleWorking",
            "5": "fireSuppressionNozzlesClear",
            "6": "fanTipAccessible",
            "7": "safeAccessToFan",
            "8": "exhaustFanOperational",
            "9": "ecologyUnitRequiresCleaning",
            "10": "ecologyUnitDeficiencies",
            "11": "greaseBuildupOnRoof",
            "12": "systemCleanedPerCode",
            "13": "systemInteriorAccessible",
            "14": "multiStoreyVerticalCleaning",
            "15": "adequateAccessPanels",
          };

          // Map the backend object format to our array format
          if (report.inspectionItems) {
            // Ensure we have an array with the right length
            for (let i = 0; i < inspectionItems.length; i++) {
              arrayInspectionItems[i] = {};
            }

            // Map existing values with type-safe access
            Object.entries(keyMappings).forEach(([indexStr, key]) => {
              const index = parseInt(indexStr);
              const status = (report.inspectionItems as any)[key];
              if (status) {
                arrayInspectionItems[index] = { status };
              }
            });
          }

          // Convert cooking equipment from old boolean format to new array format
          const cookingEquipmentArray: string[] = [];
          if (typeof report.cookingEquipment === 'object' && report.cookingEquipment) {
            if ((report.cookingEquipment as any).griddles) cookingEquipmentArray.push("griddles");
            if ((report.cookingEquipment as any).deepFatFryers) cookingEquipmentArray.push("deepFatFryers");
            if ((report.cookingEquipment as any).woks) cookingEquipmentArray.push("woks");
            if ((report.cookingEquipment as any).ovens) cookingEquipmentArray.push("ovens");
            if ((report.cookingEquipment as any).flattopGrills) cookingEquipmentArray.push("flattopGrills");
          } else if (Array.isArray(report.cookingEquipment)) {
            cookingEquipmentArray.push(...report.cookingEquipment);
          }

          // Update the form data with the report and mapped inspection items
          setFormData(prevData => ({
            ...report,
            scheduleId: schedule._id.toString(),
            invoiceId:
              typeof schedule.invoiceRef === "string"
                ? schedule.invoiceRef
                : schedule.invoiceRef.toString(),
            jobTitle: schedule.jobTitle,
            location: schedule.location,
            cookingEquipment: cookingEquipmentArray,
            inspectionItems: arrayInspectionItems,
            // Ensure technicianId is preserved from the report
            technicianId: report.technicianId || prevData.technicianId,
          }));

        }

        // Always try to fetch previous reports for autofill (whether updating existing or creating new)
        if (schedule.jobTitle && schedule.location) {
          try {
            setIsAutoFilling(true);
            const reports = await getReportsByJobNameAndLocation(schedule.jobTitle, schedule.location);

            // Filter out the current report if it exists to show only previous reports
            const previousReports = reports.filter(r => r.scheduleId !== schedule._id.toString());

            if (previousReports.length > 0) {
              setClientReports(previousReports);
              // Only show selector if no existing report was found
              if (!report) {
                setShowReportSelector(true);
              }
            }
          } catch (error) {
            console.error("Error fetching reports by job name and location:", error);
          } finally {
            setIsAutoFilling(false);
          }
        }
      } catch (error) {
        console.error("Error fetching report:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [schedule._id, schedule.invoiceRef]);

  // Form helpers
  type FormField = string | boolean | number | Date | undefined;

  const handleNestedChange = (
    section: keyof FormData,
    field: string,
    value: FormField,
  ) => {
    setFormData((prev) => {
      // Create a new copy of the form data
      const result = { ...prev };

      // Initialize the section if it doesn't exist
      if (!result[section]) {
        // Initialize with the correct type based on the section name
        if (section === "equipmentDetails") {
          result.equipmentDetails = {
            hoodType: "",
            filterType: "",
            ductworkType: "",
            fanType: "",
          };
        } else if (section === "cleaningDetails") {
          result.cleaningDetails = {
            hoodCleaned: false,
            filtersCleaned: false,
            ductworkCleaned: false,
            fanCleaned: false,
          };
        }
      }

      // Now update the field safely
      if (section === "equipmentDetails" && result.equipmentDetails) {
        (result.equipmentDetails as any)[field] = value;
      } else if (section === "cleaningDetails" && result.cleaningDetails) {
        (result.cleaningDetails as any)[field] = value;
      }

      return result;
    });
  };

  const handleInspectionChange = (
    index: number,
    field: string,
    value: string,
  ) => {
    setFormData((prevData) => {
      const updatedFormData = { ...prevData };

      // Initialize inspectionItems array if it doesn't exist
      if (!updatedFormData.inspectionItems) {
        updatedFormData.inspectionItems = [];
      }

      // Initialize item at index if it doesn't exist
      if (!updatedFormData.inspectionItems[index]) {
        updatedFormData.inspectionItems[index] = {};
      }

      // Update the field
      updatedFormData.inspectionItems[index] = {
        ...updatedFormData.inspectionItems[index],
        [field]: value,
      };

      return updatedFormData;
    });
  };

  const handleReportSelect = (report: any) => {
    const fieldsToUpdate = [];

    // Convert inspection items from object to array format for form
    const arrayInspectionItems: InspectionItemType[] = [];
    const keyMappings: { [key: string]: string } = {
      "0": "filtersInPlace",
      "1": "filtersListed",
      "2": "filtersNeedCleaningMoreOften",
      "3": "filtersNeedReplacement",
      "4": "washCycleWorking",
      "5": "fireSuppressionNozzlesClear",
      "6": "fanTipAccessible",
      "7": "safeAccessToFan",
      "8": "exhaustFanOperational",
      "9": "ecologyUnitRequiresCleaning",
      "10": "ecologyUnitDeficiencies",
      "11": "greaseBuildupOnRoof",
      "12": "systemCleanedPerCode",
      "13": "systemInteriorAccessible",
      "14": "multiStoreyVerticalCleaning",
      "15": "adequateAccessPanels",
    };

    if (report.inspectionItems) {
      for (let i = 0; i < inspectionItems.length; i++) {
        arrayInspectionItems[i] = {};
      }

      Object.entries(keyMappings).forEach(([indexStr, key]) => {
        const index = parseInt(indexStr);
        const status = (report.inspectionItems as any)[key];
        if (status) {
          arrayInspectionItems[index] = { status };
        }
      });
    }

    // Convert cooking equipment from old boolean format to new array format
    const cookingEquipmentArray: string[] = [];
    if (typeof report.cookingEquipment === 'object' && report.cookingEquipment) {
      if ((report.cookingEquipment as any).griddles) cookingEquipmentArray.push("griddles");
      if ((report.cookingEquipment as any).deepFatFryers) cookingEquipmentArray.push("deepFatFryers");
      if ((report.cookingEquipment as any).woks) cookingEquipmentArray.push("woks");
      if ((report.cookingEquipment as any).ovens) cookingEquipmentArray.push("ovens");
      if ((report.cookingEquipment as any).flattopGrills) cookingEquipmentArray.push("flattopGrills");
    } else if (Array.isArray(report.cookingEquipment)) {
      cookingEquipmentArray.push(...report.cookingEquipment);
    }

    // Update form data with autofilled values
    setFormData(prevData => ({
      ...prevData,
      fuelType: report.fuelType || prevData.fuelType,
      cookingVolume: report.cookingVolume || prevData.cookingVolume,
      cookingEquipment: cookingEquipmentArray.length > 0 ? cookingEquipmentArray : prevData.cookingEquipment,
      equipmentDetails: {
        ...prevData.equipmentDetails,
        ...(report.equipmentDetails || {}),
      },
      cleaningDetails: {
        ...prevData.cleaningDetails,
        ...(report.cleaningDetails || {}),
      },
      inspectionItems: arrayInspectionItems.length > 0 ? arrayInspectionItems : prevData.inspectionItems,
      recommendedCleaningFrequency: report.recommendedCleaningFrequency || prevData.recommendedCleaningFrequency,
      comments: report.comments || prevData.comments,
      recommendations: report.recommendations || prevData.recommendations,
    }));

    // Track which fields were auto-filled
    const updatedFields = [];
    if (report.fuelType) updatedFields.push("fuelType");
    if (report.cookingVolume) updatedFields.push("cookingVolume");
    if (cookingEquipmentArray.length > 0) updatedFields.push("cookingEquipment");
    if (report.equipmentDetails) updatedFields.push("equipmentDetails");
    if (report.cleaningDetails) updatedFields.push("cleaningDetails");
    if (report.inspectionItems) updatedFields.push("inspectionItems");
    if (report.recommendedCleaningFrequency) updatedFields.push("recommendedCleaningFrequency");
    if (report.comments) updatedFields.push("comments");
    if (report.recommendations) updatedFields.push("recommendations");

    setAutoFilledFields(updatedFields);
    setShowReportSelector(false);
    toast.success(`Form auto-filled from previous report (${new Date(report.dateCompleted).toLocaleDateString()})`);
  };

  const handleSubmit = async () => {
    // Validate technician is selected
    if (!formData.technicianId) {
      toast.error("Please select a technician");
      setStep("basic");
      return;
    }

    setSaving(true);
    try {
      // Create a serialized version with ISO date strings
      const serializedData = {
        ...formData,
        dateCompleted:
          formData.dateCompleted instanceof Date
            ? formData.dateCompleted.toISOString()
            : formData.dateCompleted,
        lastServiceDate:
          formData.lastServiceDate instanceof Date
            ? formData.lastServiceDate.toISOString()
            : formData.lastServiceDate,
      };

      // Convert our array-based inspection items to an object format for the API
      const inspectionItemsObject: Record<string, string> = {};

      // Use a more reliable mapping between UI items and API keys with better typing
      const keyMappings: { [key: string]: string } = {
        "0": "filtersInPlace",
        "1": "filtersListed",
        "2": "filtersNeedCleaningMoreOften",
        "3": "filtersNeedReplacement",
        "4": "washCycleWorking",
        "5": "fireSuppressionNozzlesClear",
        "6": "fanTipAccessible",
        "7": "safeAccessToFan",
        "8": "exhaustFanOperational",
        "9": "ecologyUnitRequiresCleaning",
        "10": "ecologyUnitDeficiencies",
        "11": "greaseBuildupOnRoof",
        "12": "systemCleanedPerCode",
        "13": "systemInteriorAccessible",
        "14": "multiStoreyVerticalCleaning",
        "15": "adequateAccessPanels",
      };

      inspectionItems.forEach((_, index) => {
        // Safely access potentially undefined properties
        const status = serializedData.inspectionItems[index]?.status;
        if (status) {
          const key = keyMappings[index.toString()];
          if (key) {
            inspectionItemsObject[key] = status;
          }
        }
      });

      // Convert cooking equipment array back to object format for API compatibility
      const cookingEquipmentObject: Record<string, boolean> = {};
      if (serializedData.cookingEquipment && Array.isArray(serializedData.cookingEquipment)) {
        serializedData.cookingEquipment.forEach((item: string) => {
          cookingEquipmentObject[item] = true;
        });
      }

      // Create the final data to send to the API with a more specific type cast
      const apiData = {
        ...serializedData,
        cookingEquipment: cookingEquipmentObject,
        inspectionItems: inspectionItemsObject,
      };

      // Using 'unknown' as an intermediate step is safer than direct 'any' casting
      await createOrUpdateReport(apiData as unknown as ReportType);
      toast.success("Report saved successfully");
      onClose();
    } catch (error) {
      console.error("Error saving report:", error);
      toast.error("Failed to save report");
    } finally {
      setSaving(false);
    }
  };

  const nextStep = () => {
    if (step === "basic") setStep("equipment");
    else if (step === "equipment") setStep("inspection");
    else if (step === "inspection") setStep("recommendations");
  };

  const prevStep = () => {
    if (step === "recommendations") setStep("inspection");
    else if (step === "inspection") setStep("equipment");
    else if (step === "equipment") setStep("basic");
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white shadow-2xl p-8">
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <div className="h-12 w-12 rounded-full border-4 border-gray-200"></div>
              <div className="absolute top-0 left-0 h-12 w-12 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading Report</h3>
              <p className="text-sm text-gray-500">Please wait while we fetch the report data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-4xl rounded-xl border border-gray-200 bg-white shadow-2xl max-h-[90vh] overflow-hidden">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
        >
          <XMarkIcon className="h-6 w-6" />
        </button>

        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-gray-900">
              Kitchen Exhaust System Cleaning Report
            </h2>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="mb-4 h-2 w-full overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full bg-blue-600 transition-all duration-300 ease-in-out"
              style={{
                width:
                  step === "basic"
                    ? "25%"
                    : step === "equipment"
                      ? "50%"
                      : step === "inspection"
                        ? "75%"
                        : "100%",
              }}
            ></div>
          </div>

          <div className="flex justify-between">
            <button
              onClick={() => setStep("basic")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                step === "basic" 
                  ? "bg-blue-600 text-white" 
                  : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              Basic Info
            </button>
            <button
              onClick={() => setStep("equipment")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                step === "equipment" 
                  ? "bg-blue-600 text-white" 
                  : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              Equipment
            </button>
            <button
              onClick={() => setStep("inspection")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                step === "inspection" 
                  ? "bg-blue-600 text-white" 
                  : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              Inspection
            </button>
            <button
              onClick={() => setStep("recommendations")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                step === "recommendations" 
                  ? "bg-blue-600 text-white" 
                  : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              Recommendations
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* Auto-fill Status */}
          {isAutoFilling && (
            <div className="flex items-center justify-center bg-blue-50 p-3 rounded-lg border border-blue-200 mb-4">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-400 border-t-transparent"></div>
              <span className="ml-2 text-xs font-medium text-blue-700">
                Loading previous reports for auto-fill...
              </span>
            </div>
          )}

          {/* Report Selection Modal */}
          <ReportSelectionModal
            reports={clientReports}
            isOpen={showReportSelector}
            onClose={() => setShowReportSelector(false)}
            onSelect={handleReportSelect}
          />

          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="min-h-[400px]"
          >
            {step === "basic" && (
              <div className="space-y-4">
                <div>
                  <h3 className="mb-2 font-semibold">Job Information</h3>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Job Title
                      </label>
                      <input
                        type="text"
                        value={formData.jobTitle || ""}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            jobTitle: e.target.value,
                          }))
                        }
                        className="w-full rounded-md border border-gray-300 p-2"
                        placeholder="Enter job title"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Restaurant Location
                      </label>
                      <input
                        type="text"
                        value={formData.location || ""}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            location: e.target.value,
                          }))
                        }
                        className="w-full rounded-md border border-gray-300 p-2"
                        placeholder="Enter restaurant address"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="mb-2 font-semibold">Technician</h3>
                  {technicians.length === 1 ? (
                    <div className="flex items-center rounded-md border border-gray-300 bg-gray-50 p-2">
                      <span>{technicians[0]?.name}</span>
                      <input type="hidden" value={technicians[0]?.id} />
                    </div>
                  ) : (
                    <div>
                      <select
                        value={formData.technicianId}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            technicianId: e.target.value,
                          }))
                        }
                        className="w-full rounded-md border border-gray-300 p-2"
                      >
                        <option value="">Select Technician</option>
                        {technicians.map((tech) => (
                          <option key={tech.id} value={tech.id}>
                            {tech.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="mb-2 font-semibold">Date of Service</h3>
                  <input
                    type="date"
                    value={
                      formData.dateCompleted
                        ? new Date(formData.dateCompleted)
                            .toISOString()
                            .split("T")[0]
                        : ""
                    }
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        dateCompleted: e.target.value,
                      }))
                    }
                    className="w-full rounded-md border border-gray-300 p-2"
                  />
                </div>

                <div>
                  <h3 className="mb-2 font-semibold">Last Service Date</h3>
                  <input
                    type="date"
                    value={
                      formData.lastServiceDate
                        ? new Date(formData.lastServiceDate)
                            .toISOString()
                            .split("T")[0]
                        : ""
                    }
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        lastServiceDate: e.target.value,
                      }))
                    }
                    className="w-full rounded-md border border-gray-300 p-2"
                  />
                </div>

                <div>
                  <h3 className="mb-2 font-semibold">Fuel Type</h3>
                  <div className="flex flex-wrap gap-4">
                    {["Natural Gas", "Electric", "Solid Fuel", "Other"].map(
                      (type) => (
                        <label key={type} className="flex items-center gap-2">
                          <input
                            type="radio"
                            value={type}
                            checked={formData.fuelType === type}
                            onChange={() =>
                              setFormData((prev) => ({
                                ...prev,
                                fuelType: type as any,
                              }))
                            }
                            className="h-4 w-4"
                          />
                          {type}
                        </label>
                      ),
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="mb-2 font-semibold">Cooking Volume</h3>
                  <div className="flex gap-4">
                    {["High", "Medium", "Low"].map((volume) => (
                      <label key={volume} className="flex items-center gap-2">
                        <input
                          type="radio"
                          value={volume}
                          checked={formData.cookingVolume === volume}
                          onChange={() =>
                            setFormData((prev) => ({
                              ...prev,
                              cookingVolume: volume as any,
                            }))
                          }
                          className="h-4 w-4"
                        />
                        {volume}
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="mb-2 font-semibold">Cooking Equipment</h3>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">Select all cooking equipment present:</p>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {cookingEquipmentOptions.map((option) => (
                        <label key={option.value} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={formData.cookingEquipment?.includes(option.value) || false}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData((prev) => ({
                                  ...prev,
                                  cookingEquipment: [...(prev.cookingEquipment || []), option.value],
                                }));
                              } else {
                                setFormData((prev) => ({
                                  ...prev,
                                  cookingEquipment: (prev.cookingEquipment || []).filter(
                                    (item) => item !== option.value
                                  ),
                                }));
                              }
                            }}
                            className="h-4 w-4"
                          />
                          <span className="text-sm">{option.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === "equipment" && (
              <div className="space-y-4">
                <div>
                  <h3 className="mb-2 font-semibold">Hood Type</h3>
                  <input
                    type="text"
                    name="equipmentDetails.hoodType"
                    value={formData.equipmentDetails?.hoodType || ""}
                    onChange={(e) =>
                      handleNestedChange(
                        "equipmentDetails",
                        "hoodType",
                        e.target.value,
                      )
                    }
                    className="w-full rounded-md border border-gray-300 p-2"
                    placeholder="Enter hood type"
                  />
                </div>

                <div>
                  <h3 className="mb-2 font-semibold">Filter Type</h3>
                  <input
                    type="text"
                    name="equipmentDetails.filterType"
                    value={formData.equipmentDetails?.filterType || ""}
                    onChange={(e) =>
                      handleNestedChange(
                        "equipmentDetails",
                        "filterType",
                        e.target.value,
                      )
                    }
                    className="w-full rounded-md border border-gray-300 p-2"
                    placeholder="Enter filter type"
                  />
                </div>

                <div>
                  <h3 className="mb-2 font-semibold">Ductwork Type</h3>
                  <input
                    type="text"
                    name="equipmentDetails.ductworkType"
                    value={formData.equipmentDetails?.ductworkType || ""}
                    onChange={(e) =>
                      handleNestedChange(
                        "equipmentDetails",
                        "ductworkType",
                        e.target.value,
                      )
                    }
                    className="w-full rounded-md border border-gray-300 p-2"
                    placeholder="Enter ductwork type"
                  />
                </div>

                <div>
                  <h3 className="mb-2 font-semibold">Fan Type</h3>
                  <input
                    type="text"
                    name="equipmentDetails.fanType"
                    value={formData.equipmentDetails?.fanType || ""}
                    onChange={(e) =>
                      handleNestedChange(
                        "equipmentDetails",
                        "fanType",
                        e.target.value,
                      )
                    }
                    className="w-full rounded-md border border-gray-300 p-2"
                    placeholder="Enter fan type"
                  />
                </div>

                <div>
                  <h3 className="mb-2 font-semibold">Cleaning Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.cleaningDetails?.hoodCleaned || false}
                        onChange={(e) =>
                          handleNestedChange(
                            "cleaningDetails",
                            "hoodCleaned",
                            e.target.checked,
                          )
                        }
                        className="h-4 w-4"
                      />
                      Hood Cleaned
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={
                          formData.cleaningDetails?.filtersCleaned || false
                        }
                        onChange={(e) =>
                          handleNestedChange(
                            "cleaningDetails",
                            "filtersCleaned",
                            e.target.checked,
                          )
                        }
                        className="h-4 w-4"
                      />
                      Filters Cleaned
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={
                          formData.cleaningDetails?.ductworkCleaned || false
                        }
                        onChange={(e) =>
                          handleNestedChange(
                            "cleaningDetails",
                            "ductworkCleaned",
                            e.target.checked,
                          )
                        }
                        className="h-4 w-4"
                      />
                      Ductwork Cleaned
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.cleaningDetails?.fanCleaned || false}
                        onChange={(e) =>
                          handleNestedChange(
                            "cleaningDetails",
                            "fanCleaned",
                            e.target.checked,
                          )
                        }
                        className="h-4 w-4"
                      />
                      Fan Cleaned
                    </label>
                  </div>
                </div>
              </div>
            )}

            {step === "inspection" && (
              <div className="space-y-4">
                <div>
                  <h3 className="mb-2 font-semibold">Inspection</h3>
                  <div className="max-h-[300px] space-y-4 overflow-y-auto">
                    {inspectionItems.map((item, index) => (
                      <div
                        key={index}
                        className="flex flex-col rounded-md border border-gray-300 p-4"
                      >
                        <div className="flex justify-between">
                          <h4 className="font-medium">{item.name}</h4>
                          <div className="flex items-center space-x-4">
                            <label className="flex items-center space-x-2">
                              <input
                                type="radio"
                                value="Yes"
                                checked={
                                  (formData.inspectionItems?.[index]?.status ||
                                    "") === "Yes"
                                }
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    handleInspectionChange(
                                      index,
                                      "status",
                                      "Yes",
                                    );
                                  }
                                }}
                                className="h-4 w-4"
                              />
                              <span>Yes</span>
                            </label>
                            <label className="flex items-center space-x-2">
                              <input
                                type="radio"
                                value="No"
                                checked={
                                  (formData.inspectionItems?.[index]?.status ||
                                    "") === "No"
                                }
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    handleInspectionChange(index, "status", "No");
                                  }
                                }}
                                className="h-4 w-4"
                              />
                              <span>No</span>
                            </label>
                            <label className="flex items-center space-x-2">
                              <input
                                type="radio"
                                value="N/A"
                                checked={
                                  (formData.inspectionItems?.[index]?.status ||
                                    "") === "N/A"
                                }
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    handleInspectionChange(
                                      index,
                                      "status",
                                      "N/A",
                                    );
                                  }
                                }}
                                className="h-4 w-4"
                              />
                              <span>N/A</span>
                            </label>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {step === "recommendations" && (
              <div className="space-y-4">
                <div>
                  <h3 className="mb-2 font-semibold">
                    Recommended Cleaning Frequency (per year)
                  </h3>
                  <input
                    type="number"
                    value={formData.recommendedCleaningFrequency || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        recommendedCleaningFrequency:
                          parseInt(e.target.value) || undefined,
                      }))
                    }
                    min="1"
                    max="12"
                    className="w-full rounded-md border border-gray-300 p-2"
                  />
                </div>

                <div>
                  <h3 className="mb-2 font-semibold">Comments</h3>
                  <textarea
                    value={formData.comments || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        comments: e.target.value,
                      }))
                    }
                    rows={4}
                    className="w-full rounded-md border border-gray-300 p-2"
                    placeholder="Enter comments here..."
                  ></textarea>
                </div>

                <div>
                  <h3 className="mb-2 font-semibold">Recommendations</h3>
                  <textarea
                    value={formData.recommendations || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        recommendations: e.target.value,
                      }))
                    }
                    rows={4}
                    className="w-full rounded-md border border-gray-300 p-2"
                    placeholder="Enter recommendations here..."
                  ></textarea>
                </div>
              </div>
            )}
          </motion.div>
        </div>

        <div className="mt-6 flex justify-between items-center px-6 pb-6">
          {step !== "basic" ? (
            <button
              onClick={prevStep}
              className="rounded-lg bg-gray-100 px-4 py-2 text-gray-700 hover:bg-gray-200 transition-colors"
            >
              Previous
            </button>
          ) : (
            <div></div>
          )}

          {clientReports.length > 0 && !showReportSelector && (
            <button
              onClick={() => setShowReportSelector(true)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Auto-fill from Previous
            </button>
          )}

          {step !== "recommendations" ? (
            <button
              onClick={nextStep}
              className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 transition-colors"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
            >
              {saving ? "Saving..." : "Save Report"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportModal;
