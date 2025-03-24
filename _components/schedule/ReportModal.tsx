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
} from "../../app/lib/actions/scheduleJobs.actions";
import toast from "react-hot-toast";
import { motion } from "framer-motion";

type FormStep = "basic" | "equipment" | "inspection" | "recommendations";

type InspectionItemType = {
  status?: "Yes" | "No" | "N/A";
};

interface ReportFormProps {
  schedule: ScheduleType;
  onClose: () => void;
  technician: TechnicianType;
}

interface FormData {
  _id?: string;
  scheduleId: string;
  invoiceId: string;
  dateCompleted: Date | string;
  technicianId: string;
  lastServiceDate?: Date | string;
  fuelType?: string;
  cookingVolume?: string;
  cookingEquipment?: {
    griddles?: boolean;
    deepFatFryers?: boolean;
    woks?: boolean;
  };
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

const ReportModal = ({ schedule, onClose, technician }: ReportFormProps) => {
  const [step, setStep] = useState<FormStep>("basic");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    scheduleId: schedule._id.toString(),
    invoiceId:
      typeof schedule.invoiceRef === "string"
        ? schedule.invoiceRef
        : schedule.invoiceRef.toString(),
    dateCompleted: new Date(),
    technicianId: technician.id,
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

          // Update the form data with the report and mapped inspection items
          setFormData({
            ...report,
            scheduleId: schedule._id.toString(),
            invoiceId:
              typeof schedule.invoiceRef === "string"
                ? schedule.invoiceRef
                : schedule.invoiceRef.toString(),
            inspectionItems: arrayInspectionItems,
          });
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
        } else if (section === "cookingEquipment") {
          result.cookingEquipment = {};
        }
      }

      // Now update the field safely
      if (section === "equipmentDetails" && result.equipmentDetails) {
        (result.equipmentDetails as any)[field] = value;
      } else if (section === "cleaningDetails" && result.cleaningDetails) {
        (result.cleaningDetails as any)[field] = value;
      } else if (section === "cookingEquipment" && result.cookingEquipment) {
        (result.cookingEquipment as any)[field] = value;
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

  const handleSubmit = async () => {
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

      // Create the final data to send to the API with a more specific type cast
      const apiData = {
        ...serializedData,
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
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black-2 bg-opacity-50 p-4 md:p-0">
        <div className="w-full max-w-3xl rounded-md border-4 border-darkGreen bg-white p-6">
          <div className="flex h-40 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-darkGreen border-t-transparent"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black-2 bg-opacity-50 p-4 md:p-0">
      <div className="relative w-full max-w-3xl rounded-md border-4 border-darkGreen bg-white p-6">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-600 hover:text-gray-900"
        >
          <XMarkIcon className="h-6 w-6" />
        </button>

        <h2 className="mb-4 text-xl font-semibold text-darkGreen">
          Kitchen Exhaust System Cleaning Report
        </h2>

        {/* Progress Bar */}
        <div className="mb-6 h-2 w-full overflow-hidden rounded-full bg-gray-200">
          <div
            className="h-full bg-darkGreen transition-all duration-300 ease-in-out"
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

        <div className="mb-4 flex justify-between">
          <div
            onClick={() => setStep("basic")}
            className={`cursor-pointer rounded-full px-3 py-1 text-sm ${step === "basic" ? "bg-darkGreen text-white" : "bg-gray-200 text-gray-600"}`}
          >
            Basic Info
          </div>
          <div
            onClick={() => setStep("equipment")}
            className={`cursor-pointer rounded-full px-3 py-1 text-sm ${step === "equipment" ? "bg-darkGreen text-white" : "bg-gray-200 text-gray-600"}`}
          >
            Equipment
          </div>
          <div
            onClick={() => setStep("inspection")}
            className={`cursor-pointer rounded-full px-3 py-1 text-sm ${step === "inspection" ? "bg-darkGreen text-white" : "bg-gray-200 text-gray-600"}`}
          >
            Inspection Items
          </div>
          <div
            onClick={() => setStep("recommendations")}
            className={`cursor-pointer rounded-full px-3 py-1 text-sm ${step === "recommendations" ? "bg-darkGreen text-white" : "bg-gray-200 text-gray-600"}`}
          >
            Recommendations
          </div>
        </div>

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
                <div className="grid grid-cols-3 gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.cookingEquipment?.griddles || false}
                      onChange={(e) =>
                        handleNestedChange(
                          "cookingEquipment",
                          "griddles",
                          e.target.checked,
                        )
                      }
                      className="h-4 w-4"
                    />
                    Griddles
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={
                        formData.cookingEquipment?.deepFatFryers || false
                      }
                      onChange={(e) =>
                        handleNestedChange(
                          "cookingEquipment",
                          "deepFatFryers",
                          e.target.checked,
                        )
                      }
                      className="h-4 w-4"
                    />
                    Deep Fat Fryers
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.cookingEquipment?.woks || false}
                      onChange={(e) =>
                        handleNestedChange(
                          "cookingEquipment",
                          "woks",
                          e.target.checked,
                        )
                      }
                      className="h-4 w-4"
                    />
                    Woks
                  </label>
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

        <div className="mt-6 flex justify-between">
          {step !== "basic" ? (
            <button
              onClick={prevStep}
              className="rounded bg-gray-300 px-4 py-2 text-gray-800 hover:bg-gray-400"
            >
              Previous
            </button>
          ) : (
            <div></div>
          )}

          {step !== "recommendations" ? (
            <button
              onClick={nextStep}
              className="rounded bg-darkGreen px-4 py-2 text-white hover:bg-opacity-90"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="rounded bg-darkGreen px-4 py-2 text-white hover:bg-opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
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
