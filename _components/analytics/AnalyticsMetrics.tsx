"use client";

import {
  DollarSign,
  Clock,
  CheckCircle,
  AlertTriangle,
  Users,
  FileText,
} from "lucide-react";
import { Card, CardContent } from "../ui/card";
import { AnalyticsMetrics as AnalyticsMetricsType } from "../../app/lib/dashboard.data";

interface MetricCard {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  variant: "success" | "warning" | "destructive" | "primary" | "muted";
}

interface AnalyticsMetricsProps {
  metrics: AnalyticsMetricsType;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export default function AnalyticsMetrics({ metrics }: AnalyticsMetricsProps) {
  const cards: MetricCard[] = [
    {
      label: "Total Revenue",
      value: formatCurrency(metrics.totalRevenue),
      icon: <DollarSign className="h-5 w-5" />,
      variant: "success",
    },
    {
      label: "Pending Invoices",
      value: metrics.pendingCount,
      icon: <Clock className="h-5 w-5" />,
      variant: "warning",
    },
    {
      label: "Overdue Invoices",
      value: metrics.overdueCount,
      icon: <AlertTriangle className="h-5 w-5" />,
      variant: "destructive",
    },
    {
      label: "Paid Invoices",
      value: metrics.paidCount,
      icon: <CheckCircle className="h-5 w-5" />,
      variant: "success",
    },
    {
      label: "Active Clients",
      value: metrics.activeClientCount,
      icon: <Users className="h-5 w-5" />,
      variant: "primary",
    },
    {
      label: "Jobs Due (Next 30 Days)",
      value: metrics.jobsDueSoon,
      icon: <FileText className="h-5 w-5" />,
      variant: "muted",
    },
  ];

  const variantStyles = {
    success: {
      card: "border-success/20 bg-success/5",
      icon: "bg-success text-success-foreground",
      text: "text-success",
    },
    warning: {
      card: "border-warning/20 bg-warning/5",
      icon: "bg-warning text-warning-foreground",
      text: "text-warning",
    },
    destructive: {
      card: "border-destructive/20 bg-destructive/5",
      icon: "bg-destructive text-destructive-foreground",
      text: "text-destructive",
    },
    primary: {
      card: "border-primary/20 bg-primary/5",
      icon: "bg-primary text-primary-foreground",
      text: "text-primary",
    },
    muted: {
      card: "border-border bg-muted/50",
      icon: "bg-muted-foreground text-background",
      text: "text-muted-foreground",
    },
  };

  return (
    <div className="flex h-full flex-col gap-4">
      {cards.map((card, index) => {
        const styles = variantStyles[card.variant];
        return (
          <Card key={index} className={`flex-1 ${styles.card}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-muted-foreground mb-1 text-xs font-medium">
                    {card.label}
                  </p>
                  <p className={`text-2xl font-bold ${styles.text} truncate`}>
                    {card.value}
                  </p>
                </div>
                <div
                  className={`${styles.icon} shrink-0 rounded-lg p-2.5 shadow-sm`}
                >
                  {card.icon}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
