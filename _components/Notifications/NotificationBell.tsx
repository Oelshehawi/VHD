"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../ui/popover";
import { getUnreadCount } from "../../app/lib/actions/notifications.actions";
import NotificationsPanel from "./NotificationsPanel";

export default function NotificationBell() {
  const [open, setOpen] = useState(false);

  // TanStack Query with automatic polling
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ["unreadCount"],
    queryFn: async () => {
      const result = await getUnreadCount();
      return result.success ? result.count : 0;
    },
    refetchInterval: 60000, // Poll every 60s
  });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild suppressHydrationWarning>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-10 w-10 rounded-full bg-white shadow-md hover:bg-gray-50"
        >
          <Bell className="h-5 w-5 text-gray-600" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0 sm:w-96" sideOffset={8}>
        <NotificationsPanel onClose={() => setOpen(false)} />
      </PopoverContent>
    </Popover>
  );
}
