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
        <div className="text-center p-8">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-muted flex items-center justify-center border border-border">
            <FaUsers className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-xl font-semibold text-foreground mb-2">No clients found</p>
          <p className="text-muted-foreground">Try adjusting your search or add new clients</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="flex h-full flex-col min-h-0">
      <div className="flex-1 min-h-0 overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <div className="flex items-center gap-2">
                  <FaUser className="h-4 w-4" />
                  Client Name
                </div>
              </TableHead>
              <TableHead className="hidden md:table-cell">Email Address</TableHead>
              <TableHead className="hidden md:table-cell">Phone Number</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clientData.map((client: ClientType) => (
              <TableRow key={client._id as string}>
                <TableCell>
                  <div>
                    <div className="font-semibold text-foreground mb-1">{client.clientName}</div>
                    <div className="md:hidden space-y-2">
                      <div className="text-sm text-muted-foreground">{client.email}</div>
                      <div className="text-sm text-muted-foreground">{client.phoneNumber}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground">
                  {client.email}
                </TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground">
                  {client.phoneNumber}
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-center gap-3">
                    <Button
                      asChild
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9"
                      title="Edit Client"
                    >
                      <Link href={`/database/${client._id}`}>
                        <FaPenSquare className="h-4 w-4" />
                      </Link>
                    </Button>
                    <div className="hidden md:block">
                      <DeleteModal
                        deleteText="Are you sure you want to delete this client?"
                        deleteDesc="All associated invoices with this client will also be deleted"
                        deletionId={client._id.toString()}
                        deletingValue="client"
                      />
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
};

export default ClientTable;
