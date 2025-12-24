"use client";

import { ModeToggle } from "../mode-toggle";
import NotificationBell from "../Notifications/NotificationBell";
import { UserButton,SignedIn } from "@clerk/nextjs";
import { SidebarTrigger } from "../ui/sidebar";
import { Separator } from "../ui/separator";
import { AppBreadcrumbs } from "./Breadcrumbs";

export function TopBar() {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b px-4 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mr-2 data-[orientation=vertical]:h-4"
        />
        <AppBreadcrumbs />
      </div>
      <div className="flex items-center gap-4">
        <ModeToggle />
        <NotificationBell />
        <SignedIn>
          <UserButton />
        </SignedIn>
      </div>
    </header>
  );
}
