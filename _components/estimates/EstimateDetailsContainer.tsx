"use client";
import { useState } from "react";
import {
  FaFileInvoice,
  FaPenSquare,
  FaUser,
  FaCalendar,
  FaDollarSign,
  FaUserPlus,
  FaClipboardList,
  FaStickyNote,
} from "react-icons/fa";
import { type EstimateData } from "../pdf/EstimatePdfDocument";
import { EstimateType, ClientType } from "../../app/lib/typeDefinitions";
import { formatDateStringUTC } from "../../app/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { SetBreadcrumbName } from "../layout/SetBreadcrumbName";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Separator } from "../ui/separator";
import EditEstimateDetailsDialog from "./EditEstimateDetailsDialog";
import EditItemsTotalsDialog from "./EditItemsTotalsDialog";
import ConvertToClientInvoiceDialog from "./ConvertToClientInvoiceDialog";

import LazyPDFButton from "../pdf/LazyPDFButton";

interface EstimateDetailsContainerProps {
  estimate: EstimateType;
  clients: ClientType[];
  canManage: boolean;
  estimateId: string;
}

const EstimateDetailsContainer = ({
  estimate,
  clients,
  canManage,
  estimateId,
}: EstimateDetailsContainerProps) => {
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isItemsDialogOpen, setIsItemsDialogOpen] = useState(false);
  const [isConvertDialogOpen, setIsConvertDialogOpen] = useState(false);

  // Calculate totals from items with proper rounding
  const subtotal =
    Math.round(
      estimate.items.reduce((sum, item) => sum + item.price, 0) * 100,
    ) / 100;
  const gst = Math.round(subtotal * 0.05 * 100) / 100; // 5% GST
  const total = Math.round((subtotal + gst) * 100) / 100;

  // Get client name from prospect info
  const clientName = estimate.prospectInfo?.businessName || "Unknown Client";

  // Prepare estimate data for PDF generation
  const estimateData: EstimateData = {
    estimateNumber: estimate.estimateNumber,
    createdDate: formatDateStringUTC(estimate.createdDate),
    clientName,
    contactPerson: estimate.prospectInfo?.contactPerson,
    email: estimate.prospectInfo?.email,
    phone: estimate.prospectInfo?.phone,
    address: estimate.prospectInfo?.address,
    projectLocation: estimate.prospectInfo?.projectLocation,
    items: estimate.items.map((item) => ({
      description: item.description,
      details: item.details || "",
      price: item.price,
    })),
    subtotal,
    gst,
    total,
    services:
      estimate.services && estimate.services.length > 0
        ? estimate.services
        : [
            "Hood from inside and outside",
            "All filters",
            "Access panels to duct work (accessible area only)",
            "Rooftop fan (If safe access)",
            "Fire wall behind equipment",
            "ASTTBC Sticker",
            "Fire Dept Report",
            "Before/After pictures",
          ],
    terms: estimate.terms,
  };

  // Status badge variant helper
  const getStatusVariant = (
    status: string,
  ): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case "approved":
        return "default";
      case "rejected":
        return "destructive";
      case "sent":
        return "secondary";
      case "draft":
      default:
        return "outline";
    }
  };

  const getStatusBadgeClassName = (status: string): string => {
    switch (status) {
      case "approved":
        return "bg-green-500/10 text-green-700 dark:text-green-300 border-green-200";
      case "rejected":
        return "";
      case "sent":
        return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-300 border-yellow-200";
      case "draft":
      default:
        return "";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "approved":
        return "Approved";
      case "rejected":
        return "Rejected";
      case "sent":
        return "Sent";
      case "draft":
      default:
        return "Draft";
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency: "CAD",
    }).format(amount);
  };

  // Check if conversion is available
  const canConvert =
    estimate.status === "approved" && !estimate.convertedToInvoice;

  return (
    <>
      <SetBreadcrumbName name={`Estimate ${estimate.estimateNumber}`} />
      <div className="bg-background min-h-screen p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-7xl">
          {/* Header Card */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-xl sm:text-2xl">
                      Estimate {estimate.estimateNumber}
                    </CardTitle>
                    <Badge
                      variant={getStatusVariant(estimate.status)}
                      className={getStatusBadgeClassName(estimate.status)}
                    >
                      {getStatusText(estimate.status)}
                    </Badge>
                  </div>
                  <CardDescription className="flex flex-col gap-1 sm:flex-row sm:gap-4">
                    <span className="flex items-center gap-2">
                      <FaUser className="h-3 w-3" />
                      {estimate.prospectInfo?.businessName || "N/A"}
                    </span>
                    <span className="flex items-center gap-2">
                      <FaCalendar className="h-3 w-3" />
                      {formatDateStringUTC(estimate.createdDate)}
                    </span>
                    {estimate.convertedToInvoice && (
                      <Badge
                        variant="secondary"
                        className="bg-purple-500/10 text-purple-700 dark:text-purple-300"
                      >
                        Converted to Invoice
                      </Badge>
                    )}
                  </CardDescription>
                </div>
                {canManage && (
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button
                      variant="secondary"
                      onClick={() => setIsDetailsDialogOpen(true)}
                    >
                      <FaPenSquare className="mr-2 h-4 w-4" />
                      Edit Details
                    </Button>
                    {canConvert && (
                      <Button
                        variant="default"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => setIsConvertDialogOpen(true)}
                      >
                        <FaUserPlus className="mr-2 h-4 w-4" />
                        Create Client & Invoice
                      </Button>
                    )}
                    <LazyPDFButton
                      pdfData={{ type: "estimate", data: estimateData }}
                      fileName={`${estimateData.clientName} - Estimate.pdf`}
                      buttonText="Download PDF"
                      className="inline-flex items-center"
                      showScaleSelector={true}
                    />
                  </div>
                )}
              </div>
            </CardHeader>
          </Card>

          {/* Main Grid: 2/3 Details + 1/3 Items/Totals Sidebar */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Left Column: Estimate Details (2/3) */}
            <div className="space-y-6 lg:col-span-2">
              {/* Prospect Information Card */}
              <Card className="">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-lg">
                        <FaUser className="text-primary h-4 w-4" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">
                          Prospect Information
                        </CardTitle>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <p className="text-muted-foreground text-sm">
                        Business Name
                      </p>
                      <p className="font-medium">
                        {estimate.prospectInfo?.businessName || "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-sm">
                        Contact Person
                      </p>
                      <p className="font-medium">
                        {estimate.prospectInfo?.contactPerson || "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-sm">Email</p>
                      <p className="font-medium">
                        {estimate.prospectInfo?.email || "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-sm">Phone</p>
                      <p className="font-medium">
                        {estimate.prospectInfo?.phone || "—"}
                      </p>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-muted-foreground text-sm">Address</p>
                      <p className="font-medium">
                        {estimate.prospectInfo?.address || "—"}
                      </p>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-muted-foreground text-sm">
                        Project Location
                      </p>
                      <p className="font-medium">
                        {estimate.prospectInfo?.projectLocation || "—"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Services Card */}
              <Card className="">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-lg">
                      <FaClipboardList className="text-primary h-4 w-4" />
                    </div>
                    <CardTitle className="text-lg">Services Included</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  {estimate.services && estimate.services.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {estimate.services.map((service, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="text-xs"
                        >
                          {service}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground italic">
                      Default services apply
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Notes & Terms Card */}
              <Card className="">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-lg">
                      <FaStickyNote className="text-primary h-4 w-4" />
                    </div>
                    <CardTitle className="text-lg">Notes & Terms</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <p className="text-muted-foreground mb-1 text-sm">
                        Notes
                      </p>
                      <p className="text-sm">{estimate.notes || "—"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1 text-sm">
                        Terms & Conditions
                      </p>
                      <p className="text-sm whitespace-pre-wrap">
                        {estimate.terms || "—"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column: Items & Totals Sidebar (1/3) */}
            <div className="space-y-6 lg:sticky lg:top-6 lg:self-start">
              {/* Items Card */}
              <Card className="">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-lg">
                        <FaFileInvoice className="text-primary h-4 w-4" />
                      </div>
                      <CardTitle className="text-lg">Items</CardTitle>
                    </div>
                    {canManage && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsItemsDialogOpen(true)}
                      >
                        <FaPenSquare className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {estimate.items && estimate.items.length > 0 ? (
                    <div className="space-y-3">
                      {estimate.items.map((item, index) => (
                        <div
                          key={index}
                          className="border-b pb-3 last:border-0 last:pb-0"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="text-sm font-medium">
                                {item.description}
                              </p>
                              {item.details && (
                                <p className="text-muted-foreground text-xs">
                                  {item.details}
                                </p>
                              )}
                            </div>
                            <p className="ml-2 text-sm font-medium">
                              {formatCurrency(item.price)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground py-4 text-center">
                      No items
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Totals Card */}
              <Card className="">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/10">
                      <FaDollarSign className="h-4 w-4 text-green-600" />
                    </div>
                    <CardTitle className="text-lg">Totals</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground text-sm">
                        Subtotal:
                      </span>
                      <span className="text-foreground text-sm font-medium">
                        {formatCurrency(subtotal)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground text-sm">
                        GST (5%):
                      </span>
                      <span className="text-foreground text-sm font-medium">
                        {formatCurrency(gst)}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <span className="text-foreground text-base font-semibold">
                        Total:
                      </span>
                      <span className="text-foreground text-lg font-bold">
                        {formatCurrency(total)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <EditEstimateDetailsDialog
        isOpen={isDetailsDialogOpen}
        onClose={() => setIsDetailsDialogOpen(false)}
        estimate={estimate}
      />
      <EditItemsTotalsDialog
        isOpen={isItemsDialogOpen}
        onClose={() => setIsItemsDialogOpen(false)}
        estimate={estimate}
      />
      <ConvertToClientInvoiceDialog
        isOpen={isConvertDialogOpen}
        onClose={() => setIsConvertDialogOpen(false)}
        estimate={estimate}
      />
    </>
  );
};

export default EstimateDetailsContainer;
