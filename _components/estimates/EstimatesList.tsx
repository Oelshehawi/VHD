"use client";

import { EstimateType } from "../../app/lib/typeDefinitions";
import EstimateStatusBadge from "./EstimateStatusBadge";
import Link from "next/link";
import { FaPenSquare, FaFileInvoice, FaTrash } from "react-icons/fa";
import { formatDateStringUTC } from "../../app/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";

interface EstimatesListProps {
  estimates: EstimateType[];
  currentPage: number;
  totalPages: number;
  onEdit: (estimate: EstimateType) => void;
  onDelete: (estimate: EstimateType) => void;
}

export default function EstimatesList({
  estimates,
  currentPage,
  totalPages,
  onEdit,
  onDelete,
}: EstimatesListProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency: "CAD",
    }).format(amount);
  };

  const calculateTotals = (estimate: EstimateType) => {
    const subtotal =
      Math.round(
        (estimate.items?.reduce(
          (sum, item) => sum + (Number(item.price) || 0),
          0,
        ) || 0) * 100,
      ) / 100;
    const gst = Math.round(subtotal * 0.05 * 100) / 100; // 5% GST
    const total = Math.round((subtotal + gst) * 100) / 100;
    return { subtotal, gst, total };
  };

  const getClientName = (estimate: EstimateType) => {
    if (estimate.clientId && (estimate as any).clientId?.clientName) {
      return (estimate as any).clientId.clientName;
    }
    return estimate.prospectInfo?.businessName || "Unknown";
  };

  if (!estimates.length) {
    return (
      <Card className="flex min-h-[70vh] items-center justify-center">
        <div className="p-8 text-center">
          <div className="bg-primary/10 border-primary/20 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border">
            <FaFileInvoice className="text-primary h-8 w-8" />
          </div>
          <p className="text-foreground mb-2 text-xl font-semibold">
            No estimates found
          </p>
          <p className="text-muted-foreground">
            Try adjusting your search or filters
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="flex h-full min-h-0 flex-col gap-0 overflow-hidden py-0">
      <div className="min-h-0 flex-1 overflow-auto">
        <div className="min-w-full md:min-w-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[120px]">Estimate #</TableHead>
                <TableHead className="min-w-[200px]">Client/Prospect</TableHead>
                <TableHead className="hidden min-w-[140px] lg:table-cell">
                  Created Date
                </TableHead>
                <TableHead className="hidden min-w-[100px] lg:table-cell">
                  Status
                </TableHead>
                <TableHead className="hidden min-w-[100px] lg:table-cell">
                  Total
                </TableHead>
                <TableHead className="w-[100px] text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {estimates.map((estimate: EstimateType) => {
                const totals = calculateTotals(estimate);

                return (
                  <TableRow key={estimate._id as string}>
                    <TableCell className="min-w-[120px]">
                      <div className="text-foreground truncate font-semibold">
                        {estimate.estimateNumber}
                      </div>
                    </TableCell>
                    <TableCell className="min-w-[200px]">
                      <div>
                        <div className="text-foreground truncate font-medium">
                          {getClientName(estimate)}
                        </div>
                        <div className="space-y-2 lg:hidden">
                          <div className="text-muted-foreground text-sm">
                            {formatDateStringUTC(estimate.createdDate)}
                          </div>
                          <div className="flex items-center gap-3">
                            <EstimateStatusBadge
                              status={estimate.status}
                              estimateId={estimate._id as string}
                              editable={true}
                            />
                            <span className="text-foreground text-sm font-medium">
                              {formatCurrency(totals.total)}
                            </span>
                          </div>
                          {estimate.convertedToInvoice && (
                            <Badge
                              variant="secondary"
                              className="bg-purple-500/10 text-purple-700 dark:text-purple-300"
                            >
                              Converted
                            </Badge>
                          )}
                        </div>
                        {estimate.prospectInfo?.contactPerson && (
                          <div className="text-muted-foreground text-sm">
                            Attn: {estimate.prospectInfo.contactPerson}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground hidden min-w-[140px] text-sm lg:table-cell">
                      <div className="truncate">
                        {formatDateStringUTC(estimate.createdDate)}
                      </div>
                    </TableCell>
                    <TableCell className="hidden min-w-[100px] lg:table-cell">
                      <div className="space-y-1">
                        <EstimateStatusBadge
                          status={estimate.status}
                          estimateId={estimate._id as string}
                          editable={true}
                        />
                        {estimate.convertedToInvoice && (
                          <Badge
                            variant="secondary"
                            className="bg-purple-500/10 text-purple-700 dark:text-purple-300"
                          >
                            Converted
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-foreground hidden min-w-[100px] text-sm font-semibold lg:table-cell">
                      <div>{formatCurrency(totals.total)}</div>
                      <div className="text-muted-foreground text-xs">
                        +{formatCurrency(totals.gst)} GST
                      </div>
                    </TableCell>
                    <TableCell className="w-[100px]">
                      <div className="flex items-center justify-center gap-3">
                        <Link href={`/estimates/${estimate._id}`}>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-9 w-9 shrink-0"
                            title="Edit Estimate"
                          >
                            <FaPenSquare className="h-4 w-4" />
                          </Button>
                        </Link>
                        <div className="hidden lg:block">
                          <Button
                            variant="destructive"
                            size="icon"
                            className="h-9 w-9 shrink-0"
                            onClick={() => onDelete(estimate)}
                            title="Delete Estimate"
                          >
                            <FaTrash className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </Card>
  );
}
