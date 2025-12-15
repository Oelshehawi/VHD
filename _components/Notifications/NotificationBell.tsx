"use client";

import { useState, useEffect, useCallback } from "react";
import { Bell } from "lucide-react";
import { Button } from "../../app/components/ui/button";
import { Badge } from "../../app/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../app/components/ui/popover";
import { getUnreadCount } from "../../app/lib/actions/notifications.actions";
import NotificationsPanel from "./NotificationsPanel";

export default function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);

  const fetchUnreadCount = useCallback(async () => {
    const result = await getUnreadCount();
    if (result.success) {
      setUnreadCount(result.count);
    }
  }, []);

  useEffect(() => {
    fetchUnreadCount();

    // Poll every 60 seconds for new notifications
    const interval = setInterval(fetchUnreadCount, 60000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  const handleNotificationChange = useCallback(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
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
      <PopoverContent
        align="end"
        className="w-80 p-0 sm:w-96"
        sideOffset={8}
      >
        <NotificationsPanel
          onNotificationChange={handleNotificationChange}
          onClose={() => setOpen(false)}
        />
      </PopoverContent>
    </Popover>
  );
}
