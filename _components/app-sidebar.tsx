"use client";

import * as React from "react";
import {
  Home,
  Database,
  FileText,
  File,
  Calendar,
  DollarSign,
  BarChart,
} from "lucide-react";
import Image from "next/image";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "./ui/sidebar";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  canManage: boolean;
  pendingTimeOffCount?: number;
}

export function AppSidebar({
  canManage,
  pendingTimeOffCount,
  ...props
}: AppSidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    return pathname === href || pathname?.startsWith(`${href}/`);
  };

  const items = canManage
    ? [
        { title: "Dashboard", url: "/dashboard", icon: Home },
        { title: "Estimates", url: "/estimates", icon: FileText },
        { title: "Database", url: "/database", icon: Database },
        { title: "Invoices", url: "/invoices", icon: File },
        { title: "Schedule", url: "/schedule", icon: Calendar },
        {
          title: "Employees",
          url: "/payroll",
          icon: DollarSign,
          badge: pendingTimeOffCount,
        },
        { title: "Analytics", url: "/analytics", icon: BarChart },
      ]
    : [];

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="flex h-16 items-center justify-center border-b">
        <div className="flex items-center gap-2 font-semibold">
          <Image
            src="/images/logo.png"
            alt="VHD logo"
            width={28}
            height={28}
            className="h-7 w-7 shrink-0 rounded-sm object-cover"
            priority
          />
          <span className="text-xl group-data-[collapsible=icon]:hidden">
            VHD App
          </span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Application</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const active = isActive(item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      tooltip={item.title}
                      className="hover:bg-sidebar-primary hover:text-sidebar-primary-foreground data-[state=open]:hover:bg-sidebar-primary data-[state=open]:hover:text-sidebar-primary-foreground data-[active=true]:bg-sidebar-primary data-[active=true]:text-sidebar-primary-foreground"
                    >
                      <Link href={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span className="group-data-[collapsible=icon]:hidden">
                          {item.title}
                        </span>
                        {item.badge != null ? (
                          <span className="bg-destructive text-destructive-foreground ml-auto flex h-5 w-5 items-center justify-center rounded-full text-[10px] group-data-[collapsible=icon]:hidden">
                            {item.badge}
                          </span>
                        ) : null}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
