"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../../ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import {
  ClipboardDocumentListIcon,
  WrenchScrewdriverIcon,
  SparklesIcon,
  ClipboardDocumentCheckIcon,
  ChatBubbleLeftRightIcon,
} from "@heroicons/react/24/outline";
import { ReportType } from "../../../app/lib/typeDefinitions";
import { formatDateStringUTC } from "../../../app/lib/utils";

interface ReportModalProps {
  report: ReportType;
  isOpen: boolean;
  onClose: () => void;
}

// New schema inspection items with labels
const INSPECTION_LABELS: Record<string, string> = {
  filtersInPlace: "Filters in place?",
  filtersListed: "Filters listed?",
  filtersNeedCleaningMoreOften: "Filters need more frequent cleaning?",
  filtersNeedReplacement: "Filters need replacement?",
  ecologyUnitOperational: "Ecology unit operational?",
  washCycleWorking: "Wash cycle working?",
  fireSuppressionNozzlesClear: "Fire suppression nozzles clear?",
  fanTipAccessible: "Fan tip accessible?",
  safeAccessToFan: "Safe access to fan/roof?",
  exhaustFanOperational: "Exhaust fan operational?",
  ecologyUnitRequiresCleaning: "Ecology unit requires cleaning?",
  ecologyUnitDeficiencies: "Ecology unit deficiencies?",
  greaseBuildupOnRoof: "Grease buildup on roof?",
  systemCleanedPerCode: "System cleaned per code?",
  systemInteriorAccessible: "System interior accessible?",
  multiStoreyVerticalCleaning: "Multi-storey vertical cleaning?",
  adequateAccessPanels: "Adequate access panels?",
};

// Helper function to get badge variant based on value
const getInspectionBadgeVariant = (
  value: string | undefined,
): "default" | "destructive" | "secondary" | "outline" => {
  if (value === "Yes") return "default";
  if (value === "No") return "destructive";
  return "secondary";
};

// Helper function to format boolean values
const formatBooleanValue = (value: boolean | undefined): string => {
  if (value === undefined) return "No";
  return value ? "Yes" : "No";
};

// Helper to get cooking equipment list - supports both old and new schema
const getCookingEquipmentList = (
  cookingEquipment: ReportType["cookingEquipment"] | string[] | undefined,
): string[] => {
  if (!cookingEquipment) return [];

  // New schema: string array
  if (Array.isArray(cookingEquipment)) {
    return cookingEquipment;
  }

  // Old schema: object with boolean fields
  const items: string[] = [];
  if (cookingEquipment.griddles) items.push("Griddles");
  if (cookingEquipment.deepFatFryers) items.push("Deep Fat Fryers");
  if (cookingEquipment.woks) items.push("Woks");
  if (cookingEquipment.ovens) items.push("Ovens");
  if (cookingEquipment.flattopGrills) items.push("Flattop Grills");
  return items;
};

// Helper to get cleaning items list
const getCleaningItemsList = (
  cleaningDetails: ReportType["cleaningDetails"] | undefined,
): string[] => {
  if (!cleaningDetails) return [];
  const items: string[] = [];
  if (cleaningDetails.hoodCleaned) items.push("Hood");
  if (cleaningDetails.filtersCleaned) items.push("Filters");
  if (cleaningDetails.ductworkCleaned) items.push("Ductwork");
  if (cleaningDetails.fanCleaned) items.push("Fan");
  return items;
};

const ReportModal = ({ report, isOpen, onClose }: ReportModalProps) => {
  const cleaningItems = getCleaningItemsList(report.cleaningDetails);
  const cookingItems = getCookingEquipmentList(
    report.cookingEquipment as ReportType["cookingEquipment"] | string[],
  );

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="flex max-h-[85vh] w-full max-w-4xl flex-col overflow-hidden p-0 lg:max-w-5xl">
        {/* Header */}
        <DialogHeader className="from-primary to-primary/80 shrink-0 bg-gradient-to-r px-6 py-4">
          <DialogTitle className="text-primary-foreground text-lg font-semibold">
            Service Report
            {report.jobTitle && (
              <span className="text-primary-foreground/80 ml-2 text-sm font-normal">
                - {report.jobTitle}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        {/* Tab Navigation */}
        <Tabs
          defaultValue="overview"
          className="flex flex-1 flex-col overflow-hidden"
        >
          <div className="bg-muted/50 border-border shrink-0 border-b">
            <div className="overflow-x-auto px-2">
              <TabsList className="inline-flex h-auto w-max bg-transparent p-0">
                <TabsTrigger
                  value="overview"
                  className="data-[state=active]:border-primary data-[state=active]:text-primary gap-1 rounded-none border-b-2 border-transparent px-2 py-2 text-xs sm:gap-1.5 sm:px-3 sm:py-2.5 sm:text-sm"
                >
                  <ClipboardDocumentListIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="sm:inline hidden">Overview</span>
                  <span className="sm:hidden">Info</span>
                </TabsTrigger>
                <TabsTrigger
                  value="equipment"
                  className="data-[state=active]:border-primary data-[state=active]:text-primary gap-1 rounded-none border-b-2 border-transparent px-2 py-2 text-xs sm:gap-1.5 sm:px-3 sm:py-2.5 sm:text-sm"
                >
                  <WrenchScrewdriverIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="sm:inline hidden">Equipment</span>
                  <span className="sm:hidden">Equip</span>
                </TabsTrigger>
                <TabsTrigger
                  value="cleaning"
                  className="data-[state=active]:border-primary data-[state=active]:text-primary gap-1 rounded-none border-b-2 border-transparent px-2 py-2 text-xs sm:gap-1.5 sm:px-3 sm:py-2.5 sm:text-sm"
                >
                  <SparklesIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  Clean
                </TabsTrigger>
                <TabsTrigger
                  value="inspection"
                  className="data-[state=active]:border-primary data-[state=active]:text-primary gap-1 rounded-none border-b-2 border-transparent px-2 py-2 text-xs sm:gap-1.5 sm:px-3 sm:py-2.5 sm:text-sm"
                >
                  <ClipboardDocumentCheckIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="sm:inline hidden">Inspection</span>
                  <span className="sm:hidden">Inspect</span>
                </TabsTrigger>
                <TabsTrigger
                  value="notes"
                  className="data-[state=active]:border-primary data-[state=active]:text-primary gap-1 rounded-none border-b-2 border-transparent px-2 py-2 text-xs sm:gap-1.5 sm:px-3 sm:py-2.5 sm:text-sm"
                >
                  <ChatBubbleLeftRightIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  Notes
                </TabsTrigger>
              </TabsList>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 sm:p-6">
              {/* Overview Tab */}
              <TabsContent value="overview" className="mt-0 space-y-4">
                {/* Job Information */}
                {(report.jobTitle || report.location) && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-semibold">
                        Job Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {report.jobTitle && (
                        <div>
                          <span className="text-muted-foreground text-xs">
                            Job Title
                          </span>
                          <p className="text-foreground text-sm font-medium">
                            {report.jobTitle}
                          </p>
                        </div>
                      )}
                      {report.location && (
                        <div>
                          <span className="text-muted-foreground text-xs">
                            Location
                          </span>
                          <p className="text-foreground text-sm font-medium">
                            {report.location}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Report Details & System Info */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-semibold">
                        Report Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <span className="text-muted-foreground text-xs">
                          Date Completed
                        </span>
                        <p className="text-foreground text-sm font-medium">
                          {formatDateStringUTC(report.dateCompleted)}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-xs">
                          Last Service
                        </span>
                        <p className="text-foreground text-sm font-medium">
                          {report.lastServiceDate
                            ? formatDateStringUTC(report.lastServiceDate)
                            : "N/A"}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-xs">
                          Recommended Frequency
                        </span>
                        <p className="text-foreground text-sm font-medium">
                          {report.recommendedCleaningFrequency
                            ? `${report.recommendedCleaningFrequency} times per year`
                            : "Not specified"}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-semibold">
                        System Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <span className="text-muted-foreground text-xs">
                          Hood Type
                        </span>
                        <p className="text-foreground text-sm font-medium">
                          {report.equipmentDetails?.hoodType || "Standard Hood"}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-xs">
                          Fuel Type
                        </span>
                        <p className="text-foreground text-sm font-medium">
                          {report.fuelType || "N/A"}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-xs">
                          Cooking Volume
                        </span>
                        <p className="text-foreground text-sm font-medium">
                          {report.cookingVolume || "N/A"}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Services Performed Summary */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold">
                      Services Performed
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {cleaningItems.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {cleaningItems.map((item) => (
                          <Badge key={item} variant="default">
                            {item} Cleaned
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-sm">
                        Inspection only, no cleaning was performed.
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Equipment Tab */}
              <TabsContent value="equipment" className="mt-0 space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold">
                      Equipment Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-3">
                        <div>
                          <span className="text-muted-foreground text-xs">
                            Hood Type
                          </span>
                          <p className="text-foreground text-sm font-medium">
                            {report.equipmentDetails?.hoodType ||
                              "Not specified"}
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground text-xs">
                            Filter Type
                          </span>
                          <p className="text-foreground text-sm font-medium">
                            {report.equipmentDetails?.filterType ||
                              "Not specified"}
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground text-xs">
                            Ductwork Type
                          </span>
                          <p className="text-foreground text-sm font-medium">
                            {report.equipmentDetails?.ductworkType ||
                              "Not specified"}
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground text-xs">
                            Fan Type
                          </span>
                          <p className="text-foreground text-sm font-medium">
                            {report.equipmentDetails?.fanType ||
                              "Not specified"}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <span className="text-muted-foreground text-xs">
                            Fuel Type
                          </span>
                          <p className="text-foreground text-sm font-medium">
                            {report.fuelType || "Not specified"}
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground text-xs">
                            Cooking Volume
                          </span>
                          <p className="text-foreground text-sm font-medium">
                            {report.cookingVolume || "Not specified"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold">
                      Cooking Equipment
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {cookingItems.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {cookingItems.map((item) => (
                          <Badge key={item} variant="outline">
                            {item}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-sm">
                        No cooking equipment details provided.
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Ecology Unit (new schema) */}
                {report.ecologyUnit && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-semibold">
                        Ecology Unit
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground text-sm">
                          Ecology Unit Present
                        </span>
                        <Badge
                          variant={
                            report.ecologyUnit.exists ? "default" : "secondary"
                          }
                        >
                          {formatBooleanValue(report.ecologyUnit.exists)}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground text-sm">
                          Filter Replacement Needed
                        </span>
                        <Badge
                          variant={
                            report.ecologyUnit.filterReplacementNeeded
                              ? "destructive"
                              : "default"
                          }
                        >
                          {formatBooleanValue(
                            report.ecologyUnit.filterReplacementNeeded,
                          )}
                        </Badge>
                      </div>
                      {report.ecologyUnit.notes && (
                        <div>
                          <span className="text-muted-foreground text-xs">
                            Notes
                          </span>
                          <p className="text-foreground text-sm">
                            {report.ecologyUnit.notes}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

              </TabsContent>

              {/* Cleaning Tab */}
              <TabsContent value="cleaning" className="mt-0 space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold">
                      Cleaning Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="bg-muted/50 flex items-center justify-between rounded-lg border px-4 py-3">
                        <span className="text-foreground text-sm font-medium">
                          Hood Cleaned
                        </span>
                        <Badge
                          variant={
                            report.cleaningDetails?.hoodCleaned
                              ? "default"
                              : "secondary"
                          }
                        >
                          {formatBooleanValue(
                            report.cleaningDetails?.hoodCleaned,
                          )}
                        </Badge>
                      </div>
                      <div className="bg-muted/50 flex items-center justify-between rounded-lg border px-4 py-3">
                        <span className="text-foreground text-sm font-medium">
                          Filters Cleaned
                        </span>
                        <Badge
                          variant={
                            report.cleaningDetails?.filtersCleaned
                              ? "default"
                              : "secondary"
                          }
                        >
                          {formatBooleanValue(
                            report.cleaningDetails?.filtersCleaned,
                          )}
                        </Badge>
                      </div>
                      <div className="bg-muted/50 flex items-center justify-between rounded-lg border px-4 py-3">
                        <span className="text-foreground text-sm font-medium">
                          Ductwork Cleaned
                        </span>
                        <Badge
                          variant={
                            report.cleaningDetails?.ductworkCleaned
                              ? "default"
                              : "secondary"
                          }
                        >
                          {formatBooleanValue(
                            report.cleaningDetails?.ductworkCleaned,
                          )}
                        </Badge>
                      </div>
                      <div className="bg-muted/50 flex items-center justify-between rounded-lg border px-4 py-3">
                        <span className="text-foreground text-sm font-medium">
                          Fan Cleaned
                        </span>
                        <Badge
                          variant={
                            report.cleaningDetails?.fanCleaned
                              ? "default"
                              : "secondary"
                          }
                        >
                          {formatBooleanValue(
                            report.cleaningDetails?.fanCleaned,
                          )}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Inspection Tab */}
              <TabsContent value="inspection" className="mt-0 space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold">
                      Inspection Items
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {report.inspectionItems &&
                    Object.keys(report.inspectionItems).length > 0 ? (
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {Object.entries(report.inspectionItems).map(
                          ([key, value]) => {
                            // Skip cost/quantity fields - show only Yes/No/N/A items
                            if (
                              key.includes("Cost") ||
                              key.includes("Required") ||
                              typeof value !== "string" ||
                              !["Yes", "No", "N/A"].includes(value)
                            ) {
                              return null;
                            }

                            // Get label from mappings or format camelCase
                            const label =
                              INSPECTION_LABELS[key] ||
                              key
                                .replace(/([A-Z])/g, " $1")
                                .replace(/^./, (str) => str.toUpperCase())
                                .trim();

                            return (
                              <div
                                key={key}
                                className="bg-muted/50 flex items-center justify-between rounded-lg border px-4 py-3"
                              >
                                <span className="text-foreground pr-2 text-xs font-medium sm:text-sm">
                                  {label}
                                </span>
                                <Badge
                                  variant={getInspectionBadgeVariant(value)}
                                  className="shrink-0"
                                >
                                  {value || "N/A"}
                                </Badge>
                              </div>
                            );
                          },
                        )}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-sm">
                        No inspection details available.
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Cost/Additional Info from inspection items */}
                {report.inspectionItems &&
                  (report.inspectionItems.ecologyUnitCost ||
                    report.inspectionItems.accessPanelsRequired ||
                    report.inspectionItems.accessPanelCost) && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-semibold">
                          Additional Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {report.inspectionItems.ecologyUnitCost && (
                          <div>
                            <span className="text-muted-foreground text-xs">
                              Ecology Unit Cost
                            </span>
                            <p className="text-foreground text-sm font-medium">
                              {report.inspectionItems.ecologyUnitCost}
                            </p>
                          </div>
                        )}
                        {report.inspectionItems.accessPanelsRequired && (
                          <div>
                            <span className="text-muted-foreground text-xs">
                              Access Panels Required
                            </span>
                            <p className="text-foreground text-sm font-medium">
                              {report.inspectionItems.accessPanelsRequired}
                            </p>
                          </div>
                        )}
                        {report.inspectionItems.accessPanelCost && (
                          <div>
                            <span className="text-muted-foreground text-xs">
                              Access Panel Cost
                            </span>
                            <p className="text-foreground text-sm font-medium">
                              {report.inspectionItems.accessPanelCost}
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}
              </TabsContent>

              {/* Notes Tab */}
              <TabsContent value="notes" className="mt-0 space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold">
                      Recommendations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-foreground text-sm whitespace-pre-wrap">
                      {report.recommendations || "No recommendations provided."}
                    </p>
                  </CardContent>
                </Card>

                {report.comments && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-semibold">
                        Comments
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-foreground text-sm whitespace-pre-wrap">
                        {report.comments}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </div>
          </div>
        </Tabs>

        {/* Footer */}
        <DialogFooter className="border-border bg-muted/50 shrink-0 border-t px-6 py-3">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReportModal;
