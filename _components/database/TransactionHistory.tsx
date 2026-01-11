import Link from "next/link";
import { FaFileInvoice, FaEye, FaCalendar } from "react-icons/fa";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../ui/card";
import { Badge } from "../ui/badge";
import { Eye } from "lucide-react";
import { cn } from "@/lib/utils";

const TransactionHistory = ({ invoices }: { invoices: any }) => {
  const getStatusVariant = (
    status: string,
  ): "default" | "destructive" | "secondary" | "outline" => {
    switch (status) {
      case "paid":
        return "default";
      case "overdue":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "paid":
        return "Paid";
      case "overdue":
        return "Overdue";
      default:
        return "Pending";
    }
  };

  return (
    <Card className="">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg">
            <FaFileInvoice className="text-primary h-5 w-5" />
          </div>
          <div>
            <CardTitle>Transaction History</CardTitle>
            <CardDescription>
              {invoices.length} {invoices.length === 1 ? "invoice" : "invoices"}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="max-h-[600px] overflow-y-auto">
        {invoices.length !== 0 ? (
          <div className="space-y-3">
            {invoices.map((invoice: any) => (
              <Link
                key={invoice._id}
                href={`/invoices/${invoice._id}`}
                className="group block"
              >
                <div
                  className={cn(
                    "flex items-center justify-between rounded-lg border p-4 transition-all duration-200",
                    "hover:border-primary hover:bg-accent hover:shadow-sm",
                  )}
                >
                  <div className="flex items-center space-x-3">
                    <div className="bg-muted group-hover:bg-primary/10 flex h-8 w-8 items-center justify-center rounded-lg">
                      <FaFileInvoice className="text-muted-foreground group-hover:text-primary h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-foreground group-hover:text-primary font-medium">
                        #{invoice.invoiceId}
                      </p>
                      <p className="text-muted-foreground max-w-xs truncate text-sm">
                        {invoice.jobTitle}
                      </p>
                      {invoice.dateIssued && (
                        <div className="text-muted-foreground mt-1 flex items-center text-xs">
                          <FaCalendar className="mr-1 h-3 w-3" />
                          {new Date(invoice.dateIssued).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {invoice.status && (
                      <Badge variant={getStatusVariant(invoice.status)}>
                        {getStatusText(invoice.status)}
                      </Badge>
                    )}
                    <Eye className="text-muted-foreground group-hover:text-primary h-4 w-4" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center">
            <div className="mb-3 flex justify-center">
              <div className="bg-muted flex h-12 w-12 items-center justify-center rounded-lg">
                <FaFileInvoice className="text-muted-foreground h-6 w-6" />
              </div>
            </div>
            <p className="text-foreground font-medium">No invoices found</p>
            <p className="text-muted-foreground mt-1 text-sm">
              This client doesn&apos;t have any invoices yet.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TransactionHistory;
