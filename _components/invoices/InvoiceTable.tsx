import Link from "next/link";
import { FaPenSquare, FaFileInvoice } from "react-icons/fa";
import DeleteModal from "../DeleteModal";
import { fetchFilteredInvoices } from "../../app/lib/data";
import { InvoiceType } from "../../app/lib/typeDefinitions";
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

const InvoiceTable = async ({
  query,
  currentPage,
  filter,
  sort,
}: {
  query: string;
  currentPage: number;
  filter: string;
  sort: string;
}) => {
  const invoiceData = await fetchFilteredInvoices(
    query,
    currentPage,
    filter,
    sort,
  );

  if (!invoiceData.length) {
    return (
      <Card className="flex min-h-[70vh] items-center justify-center">
        <div className="p-8 text-center">
          <div className="bg-primary/10 border-primary/20 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border">
            <FaFileInvoice className="text-primary h-8 w-8" />
          </div>
          <p className="text-foreground mb-2 text-xl font-semibold">
            No invoices found
          </p>
          <p className="text-muted-foreground">
            Try adjusting your search or filters
          </p>
        </div>
      </Card>
    );
  }

  const getStatusVariant = (status: string) => {
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
    <Card className="flex h-full min-h-0 flex-col overflow-hidden py-0">
      <div className="min-h-0 flex-1 overflow-auto">
        <div className="min-w-full md:min-w-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[120px]">Invoice #</TableHead>
                <TableHead className="min-w-[200px]">Job Title</TableHead>
                <TableHead className="hidden min-w-[140px] lg:table-cell">
                  Issued Date
                </TableHead>
                <TableHead className="hidden min-w-[100px] lg:table-cell">
                  Status
                </TableHead>
                <TableHead className="hidden min-w-[100px] lg:table-cell">
                  Amount
                </TableHead>
                <TableHead className="w-[100px] text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoiceData.map((invoice: InvoiceType) => {
                const subtotal = invoice.items.reduce(
                  (total, item) => total + item.price,
                  0,
                );
                const tax = subtotal * 0.05;
                const totalAmount = (subtotal + tax).toFixed(2);

                return (
                  <TableRow key={invoice._id as string}>
                    <TableCell className="min-w-[120px]">
                      <div className="text-foreground truncate font-semibold">
                        {invoice.invoiceId}
                      </div>
                    </TableCell>
                    <TableCell className="min-w-[200px]">
                      <div>
                        <div className="text-foreground truncate font-medium">
                          {invoice.jobTitle}
                        </div>
                        <div className="space-y-2 lg:hidden">
                          <div className="text-muted-foreground text-sm">
                            {formatDateStringUTC(invoice.dateIssued as string)}
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge
                              variant={getStatusVariant(invoice.status)}
                              className="shrink-0 capitalize"
                            >
                              {invoice.status}
                            </Badge>
                            <span className="text-foreground text-sm font-medium">
                              ${totalAmount}
                            </span>
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground hidden min-w-[140px] text-sm lg:table-cell">
                      <div className="truncate">
                        {formatDateStringUTC(invoice.dateIssued as string)}
                      </div>
                    </TableCell>
                    <TableCell className="hidden min-w-[100px] lg:table-cell">
                      <Badge
                        variant={getStatusVariant(invoice.status)}
                        className="capitalize"
                      >
                        {invoice.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-foreground hidden min-w-[100px] text-sm font-semibold lg:table-cell">
                      <div>${totalAmount}</div>
                    </TableCell>
                    <TableCell className="w-[100px]">
                      <div className="flex items-center justify-center gap-3">
                        <Link href={`/invoices/${invoice._id}`}>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-9 w-9 shrink-0"
                            title="Edit Invoice"
                          >
                            <FaPenSquare className="h-4 w-4" />
                          </Button>
                        </Link>
                        <div className="hidden lg:block">
                          <DeleteModal
                            deleteText="Are you sure you want to delete this invoice?"
                            deleteDesc="This action cannot be undone!"
                            deletionId={invoice._id.toString()}
                            deletingValue="invoice"
                          />
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
};

export default InvoiceTable;
