"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Archive, ArchiveRestore, Users } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

const ArchiveFilter = () => {
  const searchParams = useSearchParams();
  const { replace } = useRouter();
  const pathname = usePathname();

  const currentStatus = searchParams?.get("archive") || "active";

  const handleFilterChange = (value: string) => {
    const params = new URLSearchParams(searchParams?.toString());
    params.set("archive", value);
    params.set("page", "1"); // Reset to first page when filter changes
    replace(`${pathname}?${params.toString()}`);
  };

  return (
    <Select value={currentStatus} onValueChange={handleFilterChange}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Filter by status" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="active">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>Active Clients</span>
          </div>
        </SelectItem>
        <SelectItem value="archived">
          <div className="flex items-center gap-2">
            <Archive className="h-4 w-4" />
            <span>Archived Clients</span>
          </div>
        </SelectItem>
        <SelectItem value="all">
          <div className="flex items-center gap-2">
            <ArchiveRestore className="h-4 w-4" />
            <span>All Clients</span>
          </div>
        </SelectItem>
      </SelectContent>
    </Select>
  );
};

export default ArchiveFilter;
