"use client";

import { usePathname } from "next/navigation";
import { Fragment } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../ui/breadcrumb";
import { useBreadcrumbName } from "./BreadcrumbNameProvider";

const ROUTE_NAME_MAP: Record<string, string> = {
  dashboard: "Dashboard",
  database: "Clients",
  clients: "Clients",
  invoices: "Invoices",
  schedule: "Schedule",
  settings: "Settings",
  admin: "Admin",
  users: "Users",
  staff: "Staff",
  reports: "Reports",
  proshop: "Pro Shop",
  inventory: "Inventory",
};

export function AppBreadcrumbs() {
  const pathname = usePathname() || "";
  const segments = pathname.split("/").filter((segment) => segment !== "");
  const { name: customName } = useBreadcrumbName();

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem className="hidden md:block">
          <BreadcrumbLink href="/">VHD</BreadcrumbLink>
        </BreadcrumbItem>
        {segments.length > 0 && (
          <BreadcrumbSeparator className="hidden md:block" />
        )}
        {segments.map((segment, index) => {
          const isLast = index === segments.length - 1;
          const href = `/${segments.slice(0, index + 1).join("/")}`;
          let name =
            ROUTE_NAME_MAP[segment] ||
            segment.charAt(0).toUpperCase() + segment.slice(1);

          // Use custom name if available and this is the last segment
          if (isLast && customName) {
            name = customName;
          }

          return (
            <Fragment key={href}>
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{name}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink href={href}>{name}</BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!isLast && <BreadcrumbSeparator />}
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
