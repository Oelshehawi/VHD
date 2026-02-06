"use client";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useForm, Controller, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { format, parseISO, subMonths } from "date-fns";
import { Check, X, Minus, RotateCcw, Loader2 } from "lucide-react";
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
import ReportSelectionModal from "./ReportSelectionModal";

// Shadcn UI Components
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";
import { DatePicker } from "../ui/date-picker";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import { Checkbox } from "../ui/checkbox";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { MultiSelect } from "../ui/multi-select";
import { cn } from "../../app/lib/utils";

// Step types
type FormStep = "basic" | "equipment" | "inspection" | "recommendations";

// Form data type
interface ReportFormData {
  scheduleId: string;
  invoiceId: string;
  jobTitle: string;
  location: string;
  dateCompleted: string;
  technicianId: string;
  lastServiceDate: string;
  fuelType: string;
  cookingVolume: string;
  cookingEquipment: string[];
  inspectionItems: Record<number, "Yes" | "No" | "N/A" | "">;
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
  recommendedCleaningFrequency: number | "";
  comments: string;
  recommendations: string;
  ecologyUnit: {
    exists: boolean;
    operational?: boolean;
    filterReplacementNeeded: boolean;
    notes: string;
  };
}

// Inspection items definition - consolidated per NFPA 96
const INSPECTION_ITEMS = [
  "Filters in place?",
  "Filters need more frequent cleaning?",
  "Ecology unit operational?",
  "Wash cycle working?",
  "Fire suppression nozzles clear?",
  "Safe access to fan/roof?",
  "Exhaust fan operational?",
  "Grease buildup on roof?",
  "System cleaned per code?",
  "Adequate access panels?",
];

// Equipment type options
const HOOD_TYPE_OPTIONS = [
  "Type 1 Hood",
  "Type 2 Hood",
  "UV Hood",
  "Spring Air Hood",
  "Pizza Oven Hood",
  "Other",
];

const FILTER_TYPE_OPTIONS = [
  "Baffles",
  "Drawer",
  "Short Drawer",
  "Mesh",
  "Other",
];

const DUCTWORK_TYPE_OPTIONS = [
  "Stainless Steel",
  "Galvanized",
  "Custom",
  "Other",
];

const FAN_TYPE_OPTIONS = [
  "Upblast Exhaust",
  "Inline",
  "Downblast",
  "Utility Set",
  "Other",
];

const FUEL_TYPES = [
  "Natural Gas",
  "Propane",
  "Electric",
  "Solid Fuel",
  "Other",
];
const COOKING_VOLUMES = ["High", "Medium", "Low"];

// Key mappings for API - updated for consolidated inspection items
const INSPECTION_KEY_MAPPINGS: Record<number, string> = {
  0: "filtersInPlace",
  1: "filtersNeedCleaningMoreOften",
  2: "ecologyUnitOperational",
  3: "washCycleWorking",
  4: "fireSuppressionNozzlesClear",
  5: "safeAccessToFan",
  6: "exhaustFanOperational",
  7: "greaseBuildupOnRoof",
  8: "systemCleanedPerCode",
  9: "adequateAccessPanels",
};

interface ReportModalProps {
  schedule: ScheduleType;
  onClose: () => void;
  technicians: TechnicianType[];
}

const ReportModal = ({ schedule, onClose, technicians }: ReportModalProps) => {
  const [step, setStep] = useState<FormStep>("basic");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [clientReports, setClientReports] = useState<any[]>([]);
  const [showReportSelector, setShowReportSelector] = useState(false);
  const [existingReportId, setExistingReportId] = useState<
    string | undefined
  >();

  // Get default technician
  const defaultTechnicianId = useMemo(() => {
    if (technicians.length === 1) return technicians[0]?.id || "";
    if (schedule.assignedTechnicians?.length > 0) {
      const assigned = technicians.find((tech) =>
        schedule.assignedTechnicians.includes(tech.id),
      );
      if (assigned) return assigned.id;
    }
    return "";
  }, [technicians, schedule.assignedTechnicians]);

  // React Hook Form setup
  const { control, handleSubmit, reset, setValue, watch, getValues } =
    useForm<ReportFormData>({
      defaultValues: {
        scheduleId: schedule._id.toString(),
        invoiceId:
          typeof schedule.invoiceRef === "string"
            ? schedule.invoiceRef
            : schedule.invoiceRef.toString(),
        jobTitle: schedule.jobTitle || "",
        location: schedule.location || "",
        dateCompleted: (() => {
          const now = new Date();
          const year = now.getFullYear();
          const month = String(now.getMonth() + 1).padStart(2, "0");
          const day = String(now.getDate()).padStart(2, "0");
          return `${year}-${month}-${day}`;
        })(),
        technicianId: defaultTechnicianId,
        lastServiceDate: "",
        fuelType: "",
        cookingVolume: "",
        cookingEquipment: [],
        inspectionItems: {},
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
        recommendedCleaningFrequency: "",
        comments: "",
        recommendations: "",
        ecologyUnit: {
          exists: false,
          operational: undefined,
          filterReplacementNeeded: false,
          notes: "",
        },
      },
    });

  const technicianId = useWatch({ control, name: "technicianId" });
  const isTechnicianValid = useMemo(() => {
    return technicians.some((t) => t.id === technicianId);
  }, [technicians, technicianId]);

  const watchedInspectionItems = watch("inspectionItems");
  const watchedCleaningDetails = watch("cleaningDetails");
  const selectedCleaningDetails = useMemo(
    () =>
      Object.entries(watchedCleaningDetails || {})
        .filter(([, value]) => value === true)
        .map(([key]) => key),
    [watchedCleaningDetails],
  );

  // Load report data into form - defined as useCallback to be used in useEffect
  const loadReportIntoForm = useCallback(
    (report: any) => {
      // Convert inspection items from object to indexed format
      const inspectionItems: Record<number, "Yes" | "No" | "N/A" | ""> = {};
      if (report.inspectionItems) {
        Object.entries(INSPECTION_KEY_MAPPINGS).forEach(([indexStr, key]) => {
          const index = parseInt(indexStr);
          const status = (report.inspectionItems as any)[key];
          if (status) {
            inspectionItems[index] = status;
          }
        });
      }

      // Convert cooking equipment
      const cookingEquipment: string[] = [];
      if (
        typeof report.cookingEquipment === "object" &&
        report.cookingEquipment
      ) {
        if (report.cookingEquipment.griddles) cookingEquipment.push("griddles");
        if (report.cookingEquipment.deepFatFryers)
          cookingEquipment.push("deepFatFryers");
        if (report.cookingEquipment.woks) cookingEquipment.push("woks");
        if (report.cookingEquipment.ovens) cookingEquipment.push("ovens");
        if (report.cookingEquipment.flattopGrills)
          cookingEquipment.push("flattopGrills");
      } else if (Array.isArray(report.cookingEquipment)) {
        cookingEquipment.push(...report.cookingEquipment);
      }

      reset({
        scheduleId: schedule._id.toString(),
        invoiceId:
          typeof schedule.invoiceRef === "string"
            ? schedule.invoiceRef
            : schedule.invoiceRef.toString(),
        jobTitle: report.jobTitle ?? schedule.jobTitle ?? "",
        location: report.location ?? schedule.location ?? "",
        dateCompleted: report.dateCompleted
          ? String(report.dateCompleted).split("T")[0]
          : (() => {
              const now = new Date();
              return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
            })(),
        technicianId: report.technicianId || defaultTechnicianId,
        lastServiceDate: report.lastServiceDate
          ? String(report.lastServiceDate).split("T")[0]
          : "",
        fuelType: report.fuelType || "",
        cookingVolume: report.cookingVolume || "",
        cookingEquipment,
        inspectionItems,
        equipmentDetails: {
          hoodType: report.equipmentDetails?.hoodType || "",
          filterType: report.equipmentDetails?.filterType || "",
          ductworkType: report.equipmentDetails?.ductworkType || "",
          fanType: report.equipmentDetails?.fanType || "",
        },
        cleaningDetails: {
          hoodCleaned: report.cleaningDetails?.hoodCleaned || false,
          filtersCleaned: report.cleaningDetails?.filtersCleaned || false,
          ductworkCleaned: report.cleaningDetails?.ductworkCleaned || false,
          fanCleaned: report.cleaningDetails?.fanCleaned || false,
        },
        ecologyUnit: {
          exists: report.ecologyUnit?.exists || false,
          operational: report.ecologyUnit?.operational,
          filterReplacementNeeded:
            report.ecologyUnit?.filterReplacementNeeded || false,
          notes: report.ecologyUnit?.notes || "",
        },
        recommendedCleaningFrequency: report.recommendedCleaningFrequency || "",
        comments: report.comments || "",
        recommendations: report.recommendations || "",
      });
    },
    [
      schedule._id,
      schedule.invoiceRef,
      schedule.jobTitle,
      schedule.location,
      reset,
      defaultTechnicianId,
    ],
  );

  // Fetch existing report and previous reports
  useEffect(() => {
    const fetchData = async () => {
      try {
        const report = await getReportByScheduleId(schedule._id.toString());

        if (report) {
          setExistingReportId(
            typeof report._id === "string"
              ? report._id
              : report._id?.toString(),
          );
          loadReportIntoForm(report);
        }

        // Fetch previous reports for auto-fill
        if (schedule.jobTitle && schedule.location) {
          const reports = await getReportsByJobNameAndLocation(
            schedule.jobTitle,
            schedule.location,
          );
          const previousReports = reports.filter(
            (r) => r.scheduleId !== schedule._id.toString(),
          );
          if (previousReports.length > 0) {
            setClientReports(previousReports);
            if (!report) {
              setShowReportSelector(true);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching report:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [schedule._id, schedule.jobTitle, schedule.location, loadReportIntoForm]);

  // Handle report selection for auto-fill
  const handleReportSelect = (report: any) => {
    loadReportIntoForm(report);
    setShowReportSelector(false);
    toast.success(
      `Form auto-filled from report (${format(new Date(report.dateCompleted), "MMM d, yyyy")})`,
    );
  };

  // Mark all inspection items
  const markAllInspection = (status: "Yes" | "No" | "N/A") => {
    const newItems: Record<number, "Yes" | "No" | "N/A" | ""> = {};
    INSPECTION_ITEMS.forEach((_, index) => {
      newItems[index] = status;
    });
    setValue("inspectionItems", newItems);
  };

  // Form submission
  const onSubmit = async (data: ReportFormData) => {
    if (!data.technicianId) {
      toast.error("Please select a technician");
      setStep("basic");
      return;
    }

    setSaving(true);
    try {
      // Convert inspection items to API format
      const inspectionItemsObject: Record<string, string> = {};
      Object.entries(data.inspectionItems).forEach(([indexStr, status]) => {
        const index = parseInt(indexStr);
        const key = INSPECTION_KEY_MAPPINGS[index];
        if (key && status) {
          inspectionItemsObject[key] = status;
        }
      });

      // Convert cooking equipment to API format
      const cookingEquipmentObject: Record<string, boolean> = {};
      data.cookingEquipment.forEach((item) => {
        cookingEquipmentObject[item] = true;
      });

      // Parse date strings as UTC to prevent timezone shifts
      // data.dateCompleted is "YYYY-MM-DD" format from date input
      const parseAsUTC = (dateStr: string): string => {
        const [year, month, day] = dateStr.split("-").map(Number);
        return new Date(Date.UTC(year!, month! - 1, day!)).toISOString();
      };

      const apiData = {
        _id: existingReportId,
        scheduleId: data.scheduleId,
        invoiceId: data.invoiceId,
        reportStatus: "completed" as const,
        jobTitle: data.jobTitle,
        location: data.location,
        dateCompleted: parseAsUTC(data.dateCompleted),
        technicianId: data.technicianId,
        lastServiceDate: data.lastServiceDate
          ? parseAsUTC(data.lastServiceDate)
          : undefined,
        fuelType: data.fuelType || undefined,
        cookingVolume: data.cookingVolume || undefined,
        cookingEquipment: cookingEquipmentObject,
        inspectionItems: inspectionItemsObject,
        equipmentDetails: data.equipmentDetails,
        cleaningDetails: data.cleaningDetails,
        ecologyUnit: data.ecologyUnit,
        recommendedCleaningFrequency:
          typeof data.recommendedCleaningFrequency === "number"
            ? data.recommendedCleaningFrequency
            : undefined,
        comments: data.comments || undefined,
        recommendations: data.recommendations || undefined,
      };

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

  // Step navigation
  const steps: FormStep[] = [
    "basic",
    "equipment",
    "inspection",
    "recommendations",
  ];
  const currentStepIndex = steps.indexOf(step);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  const nextStep = (e?: React.MouseEvent) => {
    // Prevent any form submission
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    // Validation for Basic Info step
    if (step === "basic" && !isTechnicianValid) {
      toast.error("Please select a technician before proceeding");
      return;
    }

    const next = steps[currentStepIndex + 1];
    if (next) setStep(next);
  };

  const prevStep = () => {
    const prev = steps[currentStepIndex - 1];
    if (prev) setStep(prev);
  };

  if (loading) {
    return (
      <Dialog open={true} onOpenChange={() => onClose()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Loading Report</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center space-y-4 py-8">
            <Loader2 className="text-primary h-12 w-12 animate-spin" />
            <p className="text-muted-foreground text-sm">
              Please wait while we fetch the report data...
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog open={true} onOpenChange={() => onClose()}>
        <DialogContent className="flex h-[100dvh] w-[96vw] max-w-5xl flex-col gap-0 p-0 sm:h-[90vh] sm:w-full sm:min-w-[800px]">
          <DialogHeader className="shrink-0 border-b p-4 sm:p-6">
            <DialogTitle className="text-lg sm:text-xl">
              Kitchen Exhaust System Cleaning Report
            </DialogTitle>
          </DialogHeader>

          {/* Progress Bar and Step Navigation */}
          <div className="bg-muted/30 shrink-0 border-b px-4 py-3 sm:px-6 sm:py-4">
            <div className="bg-muted mb-4 h-2 w-full overflow-hidden rounded-full">
              <div
                className="bg-primary h-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1">
              {steps.map((s) => (
                <Button
                  key={s}
                  type="button"
                  variant={step === s ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStep(s)}
                  className="min-w-max capitalize"
                >
                  {s === "basic"
                    ? "Basic Info"
                    : s === "recommendations"
                      ? "Notes"
                      : s}
                </Button>
              ))}
            </div>
          </div>

          {/* Form Content - simple overflow instead of ScrollArea */}
          <div className="min-h-0 flex-1 overflow-y-auto">
            <form id="report-form" onSubmit={handleSubmit(onSubmit)}>
              <div className="space-y-6 p-4 sm:p-6">
                {/* Basic Info Step */}
                {step === "basic" && (
                  <div className="space-y-6">
                    {/* Job Information - 2 columns */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="jobTitle">Job Title</Label>
                        <Controller
                          name="jobTitle"
                          control={control}
                          render={({ field }) => (
                            <Input
                              {...field}
                              id="jobTitle"
                              placeholder="Enter job title"
                            />
                          )}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="location">Restaurant Location</Label>
                        <Controller
                          name="location"
                          control={control}
                          render={({ field }) => (
                            <Input
                              {...field}
                              id="location"
                              placeholder="Enter restaurant address"
                            />
                          )}
                        />
                      </div>
                    </div>

                    {/* Technician, Fuel Type, Cooking Volume - 3 columns */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                      <div className="space-y-2">
                        <Label htmlFor="technician">Technician</Label>
                        {technicians.length === 1 ? (
                          <div className="bg-muted flex items-center rounded-md border p-2">
                            <span>{technicians[0]?.name}</span>
                          </div>
                        ) : (
                          <Controller
                            name="technicianId"
                            control={control}
                            render={({ field }) => (
                              <Select
                                value={field.value}
                                onValueChange={field.onChange}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select Technician" />
                                </SelectTrigger>
                                <SelectContent>
                                  {technicians.map((tech) => (
                                    <SelectItem key={tech.id} value={tech.id}>
                                      {tech.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          />
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label>Fuel Type</Label>
                        <Controller
                          name="fuelType"
                          control={control}
                          render={({ field }) => (
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select fuel type" />
                              </SelectTrigger>
                              <SelectContent>
                                {FUEL_TYPES.map((type) => (
                                  <SelectItem key={type} value={type}>
                                    {type}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Cooking Volume</Label>
                        <Controller
                          name="cookingVolume"
                          control={control}
                          render={({ field }) => (
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select volume" />
                              </SelectTrigger>
                              <SelectContent>
                                {COOKING_VOLUMES.map((volume) => (
                                  <SelectItem key={volume} value={volume}>
                                    {volume}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </div>
                    </div>

                    {/* Dates - 2 columns */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Date of Service</Label>
                        <Controller
                          name="dateCompleted"
                          control={control}
                          render={({ field }) => (
                            <DatePicker
                              date={
                                field.value
                                  ? (() => {
                                      const [y, m, d] = field.value
                                        .split("-")
                                        .map(Number);
                                      return new Date(y!, m! - 1, d!);
                                    })()
                                  : undefined
                              }
                              onSelect={(date) =>
                                field.onChange(
                                  date ? format(date, "yyyy-MM-dd") : "",
                                )
                              }
                              placeholder="Select service date"
                            />
                          )}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Last Service Date</Label>
                        <Controller
                          name="lastServiceDate"
                          control={control}
                          render={({ field }) => (
                            <>
                              <DatePicker
                                date={
                                  field.value
                                    ? (() => {
                                        const [y, m, d] = field.value
                                          .split("-")
                                          .map(Number);
                                        return new Date(y!, m! - 1, d!);
                                      })()
                                    : undefined
                                }
                                onSelect={(date) =>
                                  field.onChange(
                                    date ? format(date, "yyyy-MM-dd") : "",
                                  )
                                }
                                placeholder="Select last service date"
                              />
                              {/* Quick date pills */}
                              <div className="mt-2 flex flex-wrap gap-2">
                                {[3, 4, 6].map((months) => {
                                  const baseDateStr =
                                    getValues("dateCompleted") ||
                                    format(new Date(), "yyyy-MM-dd");
                                  const parsedBase = parseISO(baseDateStr);
                                  const safeBase = Number.isNaN(
                                    parsedBase.getTime(),
                                  )
                                    ? new Date()
                                    : parsedBase;
                                  const targetDate = subMonths(
                                    safeBase,
                                    months,
                                  );
                                  const targetDateStr = format(
                                    targetDate,
                                    "yyyy-MM-dd",
                                  );
                                  return (
                                    <button
                                      key={months}
                                      type="button"
                                      onClick={() =>
                                        field.onChange(targetDateStr)
                                      }
                                      className="border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 rounded-full border px-2 py-1 text-xs transition-colors"
                                    >
                                      {months}mo ago
                                    </button>
                                  );
                                })}
                              </div>
                            </>
                          )}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Equipment Step */}
                {step === "equipment" && (
                  <div className="space-y-6">
                    {/* Equipment Details */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="hoodType">Hood Type</Label>
                        <Controller
                          name="equipmentDetails.hoodType"
                          control={control}
                          render={({ field }) => (
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select hood type" />
                              </SelectTrigger>
                              <SelectContent>
                                {HOOD_TYPE_OPTIONS.map((option) => (
                                  <SelectItem key={option} value={option}>
                                    {option}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="filterType">Filter Type</Label>
                        <Controller
                          name="equipmentDetails.filterType"
                          control={control}
                          render={({ field }) => (
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select filter type" />
                              </SelectTrigger>
                              <SelectContent>
                                {FILTER_TYPE_OPTIONS.map((option) => (
                                  <SelectItem key={option} value={option}>
                                    {option}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="ductworkType">Ductwork Type</Label>
                        <Controller
                          name="equipmentDetails.ductworkType"
                          control={control}
                          render={({ field }) => (
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select ductwork type" />
                              </SelectTrigger>
                              <SelectContent>
                                {DUCTWORK_TYPE_OPTIONS.map((option) => (
                                  <SelectItem key={option} value={option}>
                                    {option}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="fanType">Fan Type</Label>
                        <Controller
                          name="equipmentDetails.fanType"
                          control={control}
                          render={({ field }) => (
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select fan type" />
                              </SelectTrigger>
                              <SelectContent>
                                {FAN_TYPE_OPTIONS.map((option) => (
                                  <SelectItem key={option} value={option}>
                                    {option}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </div>
                    </div>

                    {/* Ecology Unit Section */}
                    <div className="space-y-4 rounded-lg border p-4">
                      <Label className="text-base font-semibold">
                        Ecology Unit
                      </Label>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <Controller
                          name="ecologyUnit.exists"
                          control={control}
                          render={({ field }) => (
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id="ecologyUnitExists"
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                              <Label
                                htmlFor="ecologyUnitExists"
                                className="font-normal"
                              >
                                Ecology unit present
                              </Label>
                            </div>
                          )}
                        />
                        <Controller
                          name="ecologyUnit.filterReplacementNeeded"
                          control={control}
                          render={({ field }) => (
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id="ecologyFilterReplacement"
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                              <Label
                                htmlFor="ecologyFilterReplacement"
                                className="font-normal"
                              >
                                Filter replacement needed
                              </Label>
                            </div>
                          )}
                        />
                      </div>
                      <Controller
                        name="ecologyUnit.notes"
                        control={control}
                        render={({ field }) => (
                          <Textarea
                            {...field}
                            placeholder="Ecology unit notes (optional)"
                            rows={2}
                          />
                        )}
                      />
                    </div>

                    {/* Cleaning Details */}
                    <div className="space-y-3">
                      <Label>Cleaning Performed</Label>
                      <MultiSelect
                        options={[
                          { label: "Hood Cleaned", value: "hoodCleaned" },
                          { label: "Filters Cleaned", value: "filtersCleaned" },
                          {
                            label: "Ductwork Cleaned",
                            value: "ductworkCleaned",
                          },
                          { label: "Fan Cleaned", value: "fanCleaned" },
                        ]}
                        value={selectedCleaningDetails}
                        onValueChange={(values) => {
                          setValue("cleaningDetails", {
                            hoodCleaned: values.includes("hoodCleaned"),
                            filtersCleaned: values.includes("filtersCleaned"),
                            ductworkCleaned: values.includes("ductworkCleaned"),
                            fanCleaned: values.includes("fanCleaned"),
                          });
                        }}
                        placeholder="Select cleaning tasks..."
                        maxCount={4}
                        hideSelectAll={false}
                        searchable={false}
                      />
                    </div>
                  </div>
                )}

                {/* Inspection Step */}
                {step === "inspection" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-foreground text-sm font-semibold">
                        Inspection Checklist
                      </h3>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => markAllInspection("Yes")}
                          className="text-xs"
                        >
                          <Check className="mr-1 h-3 w-3" />
                          All Yes
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => markAllInspection("N/A")}
                          className="text-xs"
                        >
                          <Minus className="mr-1 h-3 w-3" />
                          All N/A
                        </Button>
                      </div>
                    </div>

                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-full">
                              Inspection Item
                            </TableHead>
                            <TableHead className="w-16 text-center">
                              Yes
                            </TableHead>
                            <TableHead className="w-16 text-center">
                              No
                            </TableHead>
                            <TableHead className="w-16 text-center">
                              N/A
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {INSPECTION_ITEMS.map((item, index) => (
                            <TableRow key={index} className="hover:bg-muted/50">
                              <TableCell className="py-2 text-sm">
                                {item}
                              </TableCell>
                              {(["Yes", "No", "N/A"] as const).map((status) => (
                                <TableCell
                                  key={status}
                                  className="py-2 text-center"
                                >
                                  <button
                                    type="button"
                                    className={cn(
                                      "inline-flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium transition-all",
                                      watchedInspectionItems[index] === status
                                        ? status === "Yes"
                                          ? "bg-success text-success-foreground"
                                          : status === "No"
                                            ? "bg-destructive text-destructive-foreground"
                                            : "bg-muted text-muted-foreground"
                                        : "hover:bg-accent border",
                                    )}
                                    onClick={() => {
                                      const current =
                                        getValues("inspectionItems");
                                      setValue("inspectionItems", {
                                        ...current,
                                        [index]: status,
                                      });
                                    }}
                                  >
                                    {status.charAt(0)}
                                  </button>
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}

                {/* Recommendations Step */}
                {step === "recommendations" && (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label>Recommended Cleaning Frequency</Label>
                      <p className="text-muted-foreground text-xs">
                        How often this system should be cleaned per year
                      </p>
                      <Controller
                        name="recommendedCleaningFrequency"
                        control={control}
                        render={({ field }) => (
                          <Select
                            value={field.value?.toString() || ""}
                            onValueChange={(value) =>
                              field.onChange(value ? parseInt(value) : "")
                            }
                          >
                            <SelectTrigger className="w-full max-w-xs">
                              <SelectValue placeholder="Select frequency" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="12">
                                Monthly (12x/year)
                              </SelectItem>
                              <SelectItem value="6">
                                Bi-Monthly (6x/year)
                              </SelectItem>
                              <SelectItem value="4">
                                Quarterly (4x/year)
                              </SelectItem>
                              <SelectItem value="3">
                                Tri-Annual (3x/year)
                              </SelectItem>
                              <SelectItem value="2">
                                Semi-Annual (2x/year)
                              </SelectItem>
                              <SelectItem value="1">
                                Annual (1x/year)
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="comments">Comments</Label>
                      <Controller
                        name="comments"
                        control={control}
                        render={({ field }) => (
                          <Textarea
                            {...field}
                            id="comments"
                            rows={4}
                            placeholder="Enter any comments about the service..."
                          />
                        )}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="recommendations">Recommendations</Label>
                      <Controller
                        name="recommendations"
                        control={control}
                        render={({ field }) => (
                          <Textarea
                            {...field}
                            id="recommendations"
                            rows={4}
                            placeholder="Enter recommendations for the client..."
                          />
                        )}
                      />
                    </div>
                  </div>
                )}
              </div>
            </form>
          </div>

          {/* Footer */}
          <div className="flex shrink-0 items-center justify-between border-t p-6">
            {currentStepIndex > 0 ? (
              <Button type="button" variant="outline" onClick={prevStep}>
                Previous
              </Button>
            ) : (
              <div />
            )}

            {clientReports.length > 0 && !showReportSelector && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowReportSelector(true)}
                className="text-primary"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Auto-fill from Previous
              </Button>
            )}

            {currentStepIndex < steps.length - 1 ? (
              <Button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  nextStep(e);
                }}
                disabled={step === "basic" && !isTechnicianValid}
              >
                Next
              </Button>
            ) : (
              <Button type="submit" form="report-form" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Report"
                )}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Report Selection Modal */}
      <ReportSelectionModal
        reports={clientReports}
        isOpen={showReportSelector}
        onClose={() => setShowReportSelector(false)}
        onSelect={handleReportSelect}
      />
    </>
  );
};

export default ReportModal;
