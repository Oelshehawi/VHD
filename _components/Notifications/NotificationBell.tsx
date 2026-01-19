"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { getUnreadCount } from "../../app/lib/actions/notifications.actions";
import { SchedulingRequestType } from "../../app/lib/typeDefinitions";
import NotificationsPanel from "./NotificationsPanel";
import SchedulingReviewModal from "../dashboard/SchedulingReviewModal";

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  // State for scheduling review modal - lifted up from NotificationsPanel
  const [selectedSchedulingRequest, setSelectedSchedulingRequest] =
    useState<SchedulingRequestType | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // TanStack Query with NO POLLING FOR NOW
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ["unreadCount"],
    queryFn: async () => {
      const result = await getUnreadCount();
      return result.success ? result.count : 0;
    },
  });

  const handleOpenSchedulingModal = (request: SchedulingRequestType) => {
    setSelectedSchedulingRequest(request);
    setIsModalOpen(true);
    setOpen(false); // Close the popover when opening modal
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedSchedulingRequest(null);
    // Refetch notifications after closing modal (request may have been confirmed)
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
    queryClient.invalidateQueries({ queryKey: ["unreadCount"] });
    queryClient.invalidateQueries({ queryKey: ["schedulingRequests"] });
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild suppressHydrationWarning>
          <Button
            variant="ghost"
            size="icon"
            className="bg-background hover:bg-muted relative h-10 w-10 rounded-full shadow-md"
          >
            <Bell className="text-foreground h-5 w-5" />
            {unreadCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs"
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-80 p-0 sm:w-96" sideOffset={8}>
          <NotificationsPanel
            onClose={() => setOpen(false)}
            onOpenSchedulingModal={handleOpenSchedulingModal}
          />
        </PopoverContent>
      </Popover>

      {/* Scheduling Review Modal - rendered outside popover */}
      {selectedSchedulingRequest && (
        <SchedulingReviewModal
          request={selectedSchedulingRequest}
          onClose={handleModalClose}
          isOpen={isModalOpen}
        />
      )}
    </>
  );
}
