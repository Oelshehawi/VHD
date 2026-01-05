"use client";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useForm, Controller } from "react-hook-form";
import toast from "react-hot-toast";
import { format } from "date-fns";
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
}

// Inspection items definition
const INSPECTION_ITEMS = [
  "Filters are in place?",
  "Filters listed?",
  "Filters needs to be cleaned more often?",
  "Filters need to be replaced?",
  "Wash cycle working?",
  "Fire suppression nozzles clear?",
  "Fan tips and is accessible?",
  "Safe access to fan?",
  "Exhaust fan is operable?",
  "Ecology Unit requires cleaning?",
  "Ecology Unit deficiencies?",
  "Grease buildup on roof between cleanings?",
  "Entire system cleaned in accordance with applicable codes?",
  "Entire system interior accessible for cleaning?",
  "Multi storey vertical requires cleaning (Spinjets)?",
  "Adequate number of access panels?",
];

const COOKING_EQUIPMENT_OPTIONS = [
  { value: "griddles", label: "Griddles" },
  { value: "deepFatFryers", label: "Deep Fat Fryers" },
  { value: "woks", label: "Woks" },
  { value: "ovens", label: "Ovens" },
  { value: "flattopGrills", label: "Flattop Grills" },
];

const FUEL_TYPES = ["Natural Gas", "Electric", "Solid Fuel", "Other"];
const COOKING_VOLUMES = ["High", "Medium", "Low"];

// Key mappings for API
const INSPECTION_KEY_MAPPINGS: Record<number, string> = {
  0: "filtersInPlace",
  1: "filtersListed",
  2: "filtersNeedCleaningMoreOften",
  3: "filtersNeedReplacement",
  4: "washCycleWorking",
  5: "fireSuppressionNozzlesClear",
  6: "fanTipAccessible",
  7: "safeAccessToFan",
  8: "exhaustFanOperational",
  9: "ecologyUnitRequiresCleaning",
  10: "ecologyUnitDeficiencies",
  11: "greaseBuildupOnRoof",
  12: "systemCleanedPerCode",
  13: "systemInteriorAccessible",
  14: "multiStoreyVerticalCleaning",
  15: "adequateAccessPanels",
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
        dateCompleted: new Date().toISOString().split("T")[0],
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
      },
    });

  const watchedInspectionItems = watch("inspectionItems");

  // Load report data into form - defined as useCallback to be used in useEffect
  const loadReportIntoForm = useCallback((report: any) => {
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
      jobTitle: schedule.jobTitle || "",
      location: schedule.location || "",
      dateCompleted: report.dateCompleted
        ? new Date(report.dateCompleted).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
      technicianId: report.technicianId || defaultTechnicianId,
      lastServiceDate: report.lastServiceDate
        ? new Date(report.lastServiceDate).toISOString().split("T")[0]
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
      recommendedCleaningFrequency: report.recommendedCleaningFrequency || "",
      comments: report.comments || "",
      recommendations: report.recommendations || "",
    });
  }, [schedule._id, schedule.invoiceRef, schedule.jobTitle, schedule.location, reset, defaultTechnicianId]);

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

      const apiData = {
        _id: existingReportId,
        scheduleId: data.scheduleId,
        invoiceId: data.invoiceId,
        jobTitle: data.jobTitle,
        location: data.location,
        dateCompleted: new Date(data.dateCompleted).toISOString(),
        technicianId: data.technicianId,
        lastServiceDate: data.lastServiceDate
          ? new Date(data.lastServiceDate).toISOString()
          : undefined,
        fuelType: data.fuelType || undefined,
        cookingVolume: data.cookingVolume || undefined,
        cookingEquipment: cookingEquipmentObject,
        inspectionItems: inspectionItemsObject,
        equipmentDetails: data.equipmentDetails,
        cleaningDetails: data.cleaningDetails,
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

  const nextStep = () => {
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
        <DialogContent className="flex min-h-[90vh] max-h-[90vh] w-full max-w-5xl min-w-[800px] flex-col gap-0 p-0">
          <DialogHeader className="shrink-0 border-b p-6">
            <DialogTitle className="text-xl">
              Kitchen Exhaust System Cleaning Report
            </DialogTitle>
          </DialogHeader>

          {/* Progress Bar and Step Navigation */}
          <div className="bg-muted/30 shrink-0 border-b px-6 py-4">
            <div className="bg-muted mb-4 h-2 w-full overflow-hidden rounded-full">
              <div
                className="bg-primary h-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="flex gap-2">
              {steps.map((s) => (
                <Button
                  key={s}
                  variant={step === s ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStep(s)}
                  className="capitalize"
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
              <div className="space-y-6 p-6">
                {/* Basic Info Step */}
                {step === "basic" && (
                  <div className="space-y-6">
                    {/* Job Information */}
                    <div>
                      <h3 className="text-foreground mb-4 text-sm font-semibold">
                        Job Information
                      </h3>
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
                    </div>

                    {/* Technician */}
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

                    {/* Dates */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Date of Service</Label>
                        <Controller
                          name="dateCompleted"
                          control={control}
                          render={({ field }) => (
                            <DatePicker
                              date={
                                field.value ? new Date(field.value) : undefined
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
                            <DatePicker
                              date={
                                field.value ? new Date(field.value) : undefined
                              }
                              onSelect={(date) =>
                                field.onChange(
                                  date ? format(date, "yyyy-MM-dd") : "",
                                )
                              }
                              placeholder="Select last service date"
                            />
                          )}
                        />
                      </div>
                    </div>

                    {/* Fuel Type */}
                    <div className="space-y-3">
                      <Label>Fuel Type</Label>
                      <Controller
                        name="fuelType"
                        control={control}
                        render={({ field }) => (
                          <RadioGroup
                            value={field.value}
                            onValueChange={field.onChange}
                            className="flex flex-wrap gap-4"
                          >
                            {FUEL_TYPES.map((type) => (
                              <div
                                key={type}
                                className="flex items-center space-x-2"
                              >
                                <RadioGroupItem
                                  value={type}
                                  id={`fuel-${type}`}
                                />
                                <Label
                                  htmlFor={`fuel-${type}`}
                                  className="font-normal"
                                >
                                  {type}
                                </Label>
                              </div>
                            ))}
                          </RadioGroup>
                        )}
                      />
                    </div>

                    {/* Cooking Volume */}
                    <div className="space-y-3">
                      <Label>Cooking Volume</Label>
                      <Controller
                        name="cookingVolume"
                        control={control}
                        render={({ field }) => (
                          <RadioGroup
                            value={field.value}
                            onValueChange={field.onChange}
                            className="flex gap-4"
                          >
                            {COOKING_VOLUMES.map((volume) => (
                              <div
                                key={volume}
                                className="flex items-center space-x-2"
                              >
                                <RadioGroupItem
                                  value={volume}
                                  id={`volume-${volume}`}
                                />
                                <Label
                                  htmlFor={`volume-${volume}`}
                                  className="font-normal"
                                >
                                  {volume}
                                </Label>
                              </div>
                            ))}
                          </RadioGroup>
                        )}
                      />
                    </div>

                    {/* Cooking Equipment */}
                    <div className="space-y-3">
                      <Label>Cooking Equipment</Label>
                      <p className="text-muted-foreground text-sm">
                        Select all cooking equipment present:
                      </p>
                      <Controller
                        name="cookingEquipment"
                        control={control}
                        render={({ field }) => (
                          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                            {COOKING_EQUIPMENT_OPTIONS.map((option) => (
                              <div
                                key={option.value}
                                className="flex items-center space-x-2"
                              >
                                <Checkbox
                                  id={`equip-${option.value}`}
                                  checked={field.value.includes(option.value)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      field.onChange([
                                        ...field.value,
                                        option.value,
                                      ]);
                                    } else {
                                      field.onChange(
                                        field.value.filter(
                                          (v) => v !== option.value,
                                        ),
                                      );
                                    }
                                  }}
                                />
                                <Label
                                  htmlFor={`equip-${option.value}`}
                                  className="font-normal"
                                >
                                  {option.label}
                                </Label>
                              </div>
                            ))}
                          </div>
                        )}
                      />
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
                            <Input
                              {...field}
                              id="hoodType"
                              placeholder="Enter hood type"
                            />
                          )}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="filterType">Filter Type</Label>
                        <Controller
                          name="equipmentDetails.filterType"
                          control={control}
                          render={({ field }) => (
                            <Input
                              {...field}
                              id="filterType"
                              placeholder="Enter filter type"
                            />
                          )}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="ductworkType">Ductwork Type</Label>
                        <Controller
                          name="equipmentDetails.ductworkType"
                          control={control}
                          render={({ field }) => (
                            <Input
                              {...field}
                              id="ductworkType"
                              placeholder="Enter ductwork type"
                            />
                          )}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="fanType">Fan Type</Label>
                        <Controller
                          name="equipmentDetails.fanType"
                          control={control}
                          render={({ field }) => (
                            <Input
                              {...field}
                              id="fanType"
                              placeholder="Enter fan type"
                            />
                          )}
                        />
                      </div>
                    </div>

                    {/* Cleaning Details */}
                    <div className="space-y-3">
                      <Label>Cleaning Performed</Label>
                      <div className="grid grid-cols-2 gap-4">
                        <Controller
                          name="cleaningDetails.hoodCleaned"
                          control={control}
                          render={({ field }) => (
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id="hoodCleaned"
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                              <Label
                                htmlFor="hoodCleaned"
                                className="font-normal"
                              >
                                Hood Cleaned
                              </Label>
                            </div>
                          )}
                        />
                        <Controller
                          name="cleaningDetails.filtersCleaned"
                          control={control}
                          render={({ field }) => (
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id="filtersCleaned"
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                              <Label
                                htmlFor="filtersCleaned"
                                className="font-normal"
                              >
                                Filters Cleaned
                              </Label>
                            </div>
                          )}
                        />
                        <Controller
                          name="cleaningDetails.ductworkCleaned"
                          control={control}
                          render={({ field }) => (
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id="ductworkCleaned"
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                              <Label
                                htmlFor="ductworkCleaned"
                                className="font-normal"
                              >
                                Ductwork Cleaned
                              </Label>
                            </div>
                          )}
                        />
                        <Controller
                          name="cleaningDetails.fanCleaned"
                          control={control}
                          render={({ field }) => (
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id="fanCleaned"
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                              <Label
                                htmlFor="fanCleaned"
                                className="font-normal"
                              >
                                Fan Cleaned
                              </Label>
                            </div>
                          )}
                        />
                      </div>
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
              <Button type="button" onClick={nextStep}>
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
