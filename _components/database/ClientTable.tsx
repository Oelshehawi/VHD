import Link from "next/link";
import { FaPenSquare, FaUser, FaUsers } from "react-icons/fa";
import DeleteModal from "../DeleteModal";
import { ClientType } from "../../app/lib/typeDefinitions";
import { fetchFilteredClients } from "../../app/lib/data";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Button } from "../ui/button";
import { Card } from "../ui/card";

const ClientTable = async ({
  query,
  currentPage,
  sort,
}: {
  query: string;
  currentPage: number;
  sort: 1 | -1;
}) => {
  const clientData = await fetchFilteredClients(query, currentPage, sort);

  if (!clientData.length) {
    return (
      <Card className="flex max-h-[70vh] items-center justify-center">
        <div className="p-8 text-center">
          <div className="bg-muted border-border mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border">
            <FaUsers className="text-muted-foreground h-8 w-8" />
          </div>
          <p className="text-foreground mb-2 text-xl font-semibold">
            No clients found
          </p>
          <p className="text-muted-foreground">
            Try adjusting your search or add new clients
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
                <TableHead className="min-w-[150px]">
                  <div className="flex items-center gap-2">
                    <FaUser className="h-4 w-4 shrink-0" />
                    <span className="whitespace-nowrap">Client Name</span>
                  </div>
                </TableHead>
                <TableHead className="hidden min-w-[200px] lg:table-cell">
                  Email Address
                </TableHead>
                <TableHead className="hidden min-w-[150px] lg:table-cell">
                  Phone Number
                </TableHead>
                <TableHead className="w-[100px] text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clientData.map((client: ClientType) => (
                <TableRow key={client._id as string}>
                  <TableCell className="min-w-[150px]">
                    <div>
                      <div className="text-foreground mb-1 truncate font-semibold">
                        {client.clientName}
                      </div>
                      <div className="space-y-2 lg:hidden">
                        <div className="text-muted-foreground truncate text-sm">
                          {client.email}
                        </div>
                        <div className="text-muted-foreground truncate text-sm">
                          {client.phoneNumber}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground hidden min-w-[200px] lg:table-cell">
                    <div className="truncate">{client.email}</div>
                  </TableCell>
                  <TableCell className="text-muted-foreground hidden min-w-[150px] lg:table-cell">
                    <div className="truncate">{client.phoneNumber}</div>
                  </TableCell>
                  <TableCell className="w-[100px]">
                    <div className="flex items-center justify-center gap-2">
                      <Link href={`/database/${client._id}`}>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 shrink-0"
                        >
                          <FaPenSquare className="h-4 w-4" />
                        </Button>
                      </Link>
                      <DeleteModal
                        deleteText="Are you sure you want to delete this client?"
                        deleteDesc="All associated invoices with this client will also be deleted"
                        deletionId={client._id.toString()}
                        deletingValue="client"
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </Card>
  );
};

export default ClientTable;
