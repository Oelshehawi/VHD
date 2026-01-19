"use client";

import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../ui/tabs";
import { Card, CardContent, CardHeader } from "../../ui/card";
import { Button } from "../../ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../ui/table";
import { Badge } from "../../ui/badge";
import { ScrollArea } from "../../ui/scroll-area";
import {
  CalendarIcon,
  DocumentTextIcon,
  CreditCardIcon,
  DocumentDuplicateIcon,
  PhotoIcon,
  MapPinIcon,
  ClockIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import ReportModal from "./ReportViewModal";
import LazyPDFButton, { type PDFData } from "../../pdf/LazyPDFButton";
import {
  formatDateFns,
  formatAmount,
  calculateGST,
  calculateSubtotal,
  formatDateStringUTC,
  formatDateTimeStringUTC,
} from "../../../app/lib/utils";
import {
  ScheduleType as AppScheduleType,
  ReportType,
} from "../../../app/lib/typeDefinitions";
import PhotoGalleryModal from "./PhotoGalleryModal";

interface Invoice {
  _id: string;
  invoiceId: string;
  dateIssued: string | Date;
  totalAmount: number;
  status: string;
  jobTitle: string;
  items: { description: string; details?: string; price: number }[];
  location: string;
}

interface PhotoType {
  _id: string;
  url: string;
  timestamp: Date;
  technicianId: string;
  type: "before" | "after";
}

interface TabPanelProps {
  upcomingServices: AppScheduleType[];
  recentServices: AppScheduleType[];
  allInvoices: Invoice[];
  allReports: ReportType[];
  clientData?: { clientName: string; email: string; phoneNumber: string };
  technicianDataMap: Record<string, any>;
}

// Service card component for grid layout
const ServiceGridCard = ({
  service,
  upcoming,
  onViewPhotos,
}: {
  service: any;
  upcoming: boolean;
  onViewPhotos: (photos: PhotoType[]) => void;
}) => {
  const hasPhotos = service.photos && service.photos.length > 0;

  const formatDateTime = (dateInput: string | Date) => {
    return formatDateTimeStringUTC(dateInput);
  };

  const getBadgeVariant = () => {
    if (upcoming) {
      return service.confirmed ? "default" : "secondary";
    }
    return service.confirmed ? "default" : "outline";
  };

  const getBadgeText = () => {
    if (upcoming) {
      return service.confirmed ? "Confirmed" : "Scheduled";
    }
    return service.confirmed ? "Completed" : "Partial";
  };

  return (
    <Card className="hover:bg-muted/30 h-full transition-colors">
      <CardContent className="p-3 sm:p-4">
        <div className="mb-2 flex items-start justify-between gap-2">
          <h4 className="text-foreground line-clamp-1 text-sm font-medium sm:text-base">
            {service.jobTitle || "Kitchen Exhaust Service"}
          </h4>
          <Badge variant={getBadgeVariant()} className="shrink-0 text-xs">
            {getBadgeText()}
          </Badge>
        </div>

        <div className="space-y-1.5 text-xs sm:text-sm">
          <div className="text-muted-foreground flex items-center gap-1.5">
            <CalendarIcon className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">
              {formatDateTime(service.startDateTime)}
            </span>
          </div>

          {service.location && (
            <div className="text-muted-foreground flex items-center gap-1.5">
              <MapPinIcon className="h-3.5 w-3.5 shrink-0" />
              <span className="line-clamp-1">{service.location}</span>
            </div>
          )}

          {service.dateDue && (
            <div
              className={`flex items-center gap-1.5 ${upcoming ? "text-orange-600 dark:text-orange-400" : "text-primary"}`}
            >
              <ClockIcon className="h-3.5 w-3.5 shrink-0" />
              <span className="text-xs font-medium">
                {upcoming ? "Due: " : "Next Due: "}
                {formatDateStringUTC(service.dateDue)}
              </span>
            </div>
          )}

          {upcoming && service.confirmed && (
            <div className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
              <CheckCircleIcon className="h-3.5 w-3.5 shrink-0" />
              <span className="text-xs font-medium">Confirmed</span>
            </div>
          )}
        </div>

        {hasPhotos && !upcoming && (
          <Button
            variant="outline"
            size="sm"
            className="mt-3 h-8 w-full text-xs"
            onClick={() => onViewPhotos(service.photos)}
          >
            <PhotoIcon className="mr-1.5 h-3.5 w-3.5" />
            View {service.photos.length} Photo
            {service.photos.length !== 1 ? "s" : ""}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

const TabPanel = ({
  upcomingServices,
  recentServices,
  allInvoices,
  allReports,
  clientData,
  technicianDataMap,
}: TabPanelProps) => {
  const [activeTab, setActiveTab] = useState<
    "schedules" | "invoices" | "reports"
  >("schedules");
  const [selectedReport, setSelectedReport] = useState<ReportType | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<PhotoType[] | null>(
    null,
  );

  // Create a map of invoice IDs to job titles for easy lookup
  const invoiceJobTitleMap = useMemo(() => {
    const map = new Map<string, string>();
    allInvoices.forEach((invoice) => {
      map.set(invoice._id, invoice.jobTitle || "Service Report");
    });
    return map;
  }, [allInvoices]);

  // Sort invoices by invoice number
  const sortedInvoices = useMemo(() => {
    return [...allInvoices].sort((a, b) => {
      const aNum = parseInt(a.invoiceId.replace(/\D/g, ""));
      const bNum = parseInt(b.invoiceId.replace(/\D/g, ""));
      return bNum - aNum;
    });
  }, [allInvoices]);

  // Convert service to consistent format
  const convertService = useCallback((service: any) => {
    return {
      _id:
        typeof service._id === "string" ? service._id : service._id.toString(),
      jobTitle: service.jobTitle,
      startDateTime: service.startDateTime,
      dateDue: service.dateDue,
      location: service.location,
      confirmed: service.confirmed,
      photos: service.photos?.map((photo: any) => ({
        _id: typeof photo._id === "string" ? photo._id : photo._id.toString(),
        url: photo.url,
        timestamp: photo.timestamp,
        technicianId: photo.technicianId,
        type: photo.type,
      })),
    };
  }, []);

  // Memoized PDF data creators
  const createInvoicePDFData = useCallback(
    (invoice: Invoice): PDFData | undefined => {
      try {
        const invoiceData = {
          invoiceId: invoice.invoiceId,
          dateIssued: formatDateStringUTC(invoice.dateIssued),
          jobTitle: invoice.jobTitle,
          location: invoice.location,
          clientName: clientData?.clientName || "Client",
          email: clientData?.email || "client@email.com",
          phoneNumber: clientData?.phoneNumber || "Phone Number",
          items: invoice.items.map((item) => ({
            description: item.description,
            details: item.details || "",
            price: item.price,
            total: item.price,
          })),
          subtotal: calculateSubtotal(invoice.items),
          gst: calculateGST(calculateSubtotal(invoice.items)),
          totalAmount:
            calculateSubtotal(invoice.items) +
            calculateGST(calculateSubtotal(invoice.items)),
          cheque: "51-11020 Williams Rd Richmond, BC V7A 1X8",
          eTransfer: "adam@vancouverventcleaning.ca",
          terms:
            "Please report any and all cleaning inquiries within 5 business days.",
        };

        return { type: "invoice", data: invoiceData as any };
      } catch (error) {
        console.error("Error creating invoice PDF data:", error);
        return undefined;
      }
    },
    [clientData],
  );

  const createReportPDFData = useCallback(
    (report: ReportType): PDFData | undefined => {
      try {
        const relatedInvoice = allInvoices.find(
          (invoice) =>
            invoice._id ===
            (typeof report.invoiceId === "string"
              ? report.invoiceId
              : report.invoiceId.toString()),
        );

        const reportData = {
          _id:
            typeof report._id === "string"
              ? report._id
              : report._id?.toString() || "",
          scheduleId:
            typeof report.scheduleId === "string"
              ? report.scheduleId
              : report.scheduleId.toString(),
          jobTitle: relatedInvoice?.jobTitle || "Service Report",
          location: relatedInvoice?.location || "",
          dateCompleted: report.dateCompleted,
          technicianId: report.technicianId,
          lastServiceDate: report.lastServiceDate,
          fuelType: report.fuelType,
          cookingVolume: report.cookingVolume,
          equipmentDetails: report.equipmentDetails,
          cleaningDetails: report.cleaningDetails,
          cookingEquipment: report.cookingEquipment,
          recommendations: report.recommendations,
          comments: report.comments,
          recommendedCleaningFrequency: report.recommendedCleaningFrequency,
          inspectionItems: report.inspectionItems,
        };

        const technicianData = technicianDataMap[report.technicianId] || {
          id: report.technicianId,
          firstName: "Technician",
          lastName: "Name",
          fullName: "Technician Name",
          email: "technician@company.com",
        };

        return {
          type: "report",
          data: { report: reportData, technician: technicianData },
        };
      } catch (error) {
        console.error("Error creating report PDF data:", error);
        return undefined;
      }
    },
    [allInvoices, technicianDataMap],
  );

  const openReportModal = (report: ReportType) => {
    setSelectedReport(report);
    setIsReportModalOpen(true);
  };

  const closeReportModal = () => {
    setIsReportModalOpen(false);
  };

  const handleViewPhotos = (photos: PhotoType[]) => {
    setSelectedPhotos(photos);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "paid":
        return "default";
      case "overdue":
        return "destructive";
      default:
        return "secondary";
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="flex h-full flex-col"
      >
        <Card className="flex h-full flex-col overflow-hidden py-0">
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as typeof activeTab)}
            className="flex h-full flex-col"
          >
            <CardHeader className="shrink-0 py-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger
                  value="schedules"
                  className="flex min-w-0 items-center justify-center gap-1.5 px-2 sm:gap-2 sm:px-3"
                >
                  <CalendarIcon className="hidden h-4 w-4 shrink-0 sm:block" />
                  <span className="truncate text-xs sm:text-sm">Services</span>
                </TabsTrigger>
                <TabsTrigger
                  value="invoices"
                  className="flex min-w-0 items-center justify-center gap-1.5 px-2 sm:gap-2 sm:px-3"
                >
                  <CreditCardIcon className="hidden h-4 w-4 shrink-0 sm:block" />
                  <span className="truncate text-xs sm:text-sm">Invoices</span>
                </TabsTrigger>
                <TabsTrigger
                  value="reports"
                  className="flex min-w-0 items-center justify-center gap-1.5 px-2 sm:gap-2 sm:px-3"
                >
                  <DocumentTextIcon className="hidden h-4 w-4 shrink-0 sm:block" />
                  <span className="truncate text-xs sm:text-sm">Reports</span>
                </TabsTrigger>
              </TabsList>
            </CardHeader>

            <CardContent className="flex min-h-0 flex-1 flex-col pt-0 pb-4">
              {/* Services Tab */}
              <TabsContent
                value="schedules"
                className="mt-0 flex h-full flex-col gap-6"
              >
                {/* Upcoming Services */}
                <div className="shrink-0">
                  <h3 className="text-foreground mb-3 text-base font-semibold">
                    Upcoming Services
                  </h3>
                  {upcomingServices.length > 0 ? (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {upcomingServices.map((service) => (
                        <ServiceGridCard
                          key={`upcoming-${typeof service._id === "string" ? service._id : service._id.toString()}`}
                          service={convertService(service)}
                          upcoming={true}
                          onViewPhotos={handleViewPhotos}
                        />
                      ))}
                    </div>
                  ) : (
                    <Card>
                      <CardContent className="text-muted-foreground py-8 text-center">
                        No upcoming services scheduled.
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Recent Services */}
                <div className="min-h-0 flex-1">
                  <h3 className="text-foreground mb-3 text-base font-semibold">
                    Recent Services
                  </h3>
                  <ScrollArea className="h-[350px] pr-4">
                    {recentServices.length > 0 ? (
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {recentServices.map((service) => (
                          <ServiceGridCard
                            key={`recent-${typeof service._id === "string" ? service._id : service._id.toString()}`}
                            service={convertService(service)}
                            upcoming={false}
                            onViewPhotos={handleViewPhotos}
                          />
                        ))}
                      </div>
                    ) : (
                      <Card>
                        <CardContent className="text-muted-foreground py-8 text-center">
                          No recent services found.
                        </CardContent>
                      </Card>
                    )}
                  </ScrollArea>
                </div>
              </TabsContent>

              {/* Invoices Tab */}
              <TabsContent
                value="invoices"
                className="mt-0 flex h-full flex-col"
              >
                <h3 className="text-foreground mb-3 shrink-0 text-base font-semibold">
                  All Invoices
                </h3>
                {sortedInvoices.length > 0 ? (
                  <Card className="min-h-0 flex-1 overflow-hidden">
                    <ScrollArea className="h-[480px]">
                      <div className="min-w-[500px]">
                        <Table>
                          <TableHeader>
                            <TableRow className="hover:bg-transparent">
                              <TableHead className="text-foreground font-semibold whitespace-nowrap">
                                Invoice #
                              </TableHead>
                              <TableHead className="text-foreground font-semibold whitespace-nowrap">
                                Date
                              </TableHead>
                              <TableHead className="text-foreground font-semibold whitespace-nowrap">
                                Amount
                              </TableHead>
                              <TableHead className="text-foreground font-semibold whitespace-nowrap">
                                Status
                              </TableHead>
                              <TableHead className="text-foreground text-right font-semibold whitespace-nowrap">
                                Actions
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {sortedInvoices.map((invoice) => (
                              <TableRow
                                key={`invoice-${invoice._id}`}
                                className="hover:bg-muted/50"
                              >
                                <TableCell className="text-foreground font-medium whitespace-nowrap">
                                  {invoice.invoiceId}
                                </TableCell>
                                <TableCell className="text-muted-foreground whitespace-nowrap">
                                  {formatDateFns(invoice.dateIssued)}
                                </TableCell>
                                <TableCell className="text-foreground whitespace-nowrap">
                                  {formatAmount(
                                    invoice.totalAmount +
                                      calculateGST(invoice.totalAmount),
                                  )}
                                </TableCell>
                                <TableCell className="whitespace-nowrap">
                                  <Badge
                                    variant={getStatusBadgeVariant(
                                      invoice.status,
                                    )}
                                  >
                                    {invoice.status}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right whitespace-nowrap">
                                  <LazyPDFButton
                                    pdfData={createInvoicePDFData(invoice)}
                                    fileName={`Invoice - ${invoice.jobTitle}.pdf`}
                                    buttonText="PDF"
                                    variant="outline"
                                    size="sm"
                                    iconType="download"
                                  />
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </ScrollArea>
                  </Card>
                ) : (
                  <Card className="flex flex-1 items-center justify-center">
                    <CardContent className="text-muted-foreground py-8 text-center">
                      No invoices available.
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Reports Tab */}
              <TabsContent
                value="reports"
                className="mt-0 flex h-full flex-col"
              >
                <h3 className="text-foreground mb-3 shrink-0 text-base font-semibold">
                  All Service Reports
                </h3>
                <Card className="min-h-0 flex-1 overflow-hidden">
                  <ScrollArea className="h-[480px]">
                    {allReports.length > 0 ? (
                      <div className="divide-border divide-y">
                        {allReports.map((report, index) => (
                          <div
                            key={`report-${report._id?.toString() || index}`}
                            className="hover:bg-muted/50 flex flex-col gap-3 p-4 transition-colors sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div className="flex-1">
                              <div className="text-foreground font-medium">
                                {invoiceJobTitleMap.get(
                                  typeof report.invoiceId === "string"
                                    ? report.invoiceId
                                    : report.invoiceId.toString(),
                                ) || "Service Report"}{" "}
                                - {formatDateFns(report.dateCompleted)}
                              </div>
                              <div className="text-muted-foreground mt-1 text-sm">
                                {report.cleaningDetails && (
                                  <span>
                                    {Object.values(report.cleaningDetails).some(
                                      (val) => val,
                                    )
                                      ? "Cleaning completed"
                                      : "Inspection only"}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <LazyPDFButton
                                pdfData={createReportPDFData(report)}
                                fileName={`${
                                  invoiceJobTitleMap.get(
                                    typeof report.invoiceId === "string"
                                      ? report.invoiceId
                                      : report.invoiceId.toString(),
                                  ) || "Service Report"
                                } - Report.pdf`}
                                buttonText="Download"
                                variant="outline"
                                size="sm"
                                iconType="download"
                              />
                              <Button
                                size="sm"
                                onClick={() => openReportModal(report)}
                              >
                                <DocumentDuplicateIcon className="mr-1.5 h-4 w-4" />
                                <span>View</span>
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-muted-foreground flex h-full items-center justify-center p-6 text-center">
                        No service reports found.
                      </div>
                    )}
                  </ScrollArea>
                </Card>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>

        {/* Report Modal */}
        {selectedReport && (
          <ReportModal
            report={selectedReport}
            isOpen={isReportModalOpen}
            onClose={closeReportModal}
          />
        )}
      </motion.div>

      {/* Photo Gallery Modal */}
      <PhotoGalleryModal
        photos={selectedPhotos ?? []}
        isOpen={selectedPhotos !== null && selectedPhotos.length > 0}
        onClose={() => setSelectedPhotos(null)}
      />
    </>
  );
};

export default TabPanel;
