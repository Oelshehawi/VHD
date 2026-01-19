"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCheck, ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { Button } from "../ui/button";
import { ScrollArea } from "../ui/scroll-area";
import { Separator } from "../ui/separator";
import { Badge } from "../ui/badge";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
} from "../../app/lib/actions/notifications.actions";
import { getSchedulingRequestById } from "../../app/lib/actions/autoScheduling.actions";
import {
  NotificationType,
  NOTIFICATION_TYPES,
  SchedulingRequestType,
} from "../../app/lib/typeDefinitions";
import SchedulingReviewModal from "../dashboard/SchedulingReviewModal";

interface NotificationsPanelProps {
  onClose: () => void;
}

const typeIcons: Record<string, string> = {
  [NOTIFICATION_TYPES.JOB_REMINDER]: "📅",
  [NOTIFICATION_TYPES.INVOICE_PAID]: "💰",
  [NOTIFICATION_TYPES.INVOICE_OVERDUE]: "⚠️",
  [NOTIFICATION_TYPES.SCHEDULE_UPDATE]: "🔄",
  [NOTIFICATION_TYPES.ESTIMATE_STATUS]: "📋",
  [NOTIFICATION_TYPES.SCHEDULING_REQUEST]: "📆",
  [NOTIFICATION_TYPES.SYSTEM]: "🔔",
};

export default function NotificationsPanel({
  onClose,
}: NotificationsPanelProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  // State for scheduling review modal
  const [selectedSchedulingRequest, setSelectedSchedulingRequest] =
    useState<SchedulingRequestType | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch notifications with TanStack Query
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const result = await getNotifications(30);
      return result.success ? result.notifications : [];
    },
  });

  // Mark single notification as read
  const markAsReadMutation = useMutation({
    mutationFn: (notificationId: string) => markAsRead(notificationId),
    onMutate: async (notificationId) => {
      await queryClient.cancelQueries({ queryKey: ["notifications"] });
      const previousNotifications = queryClient.getQueryData<
        NotificationType[]
      >(["notifications"]);

      queryClient.setQueryData<NotificationType[]>(
        ["notifications"],
        (old = []) =>
          old.map((n) =>
            n._id === notificationId ? { ...n, readAt: new Date() } : n,
          ),
      );

      return { previousNotifications };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["unreadCount"] });
    },
    onError: (err, notificationId, context) => {
      if (context?.previousNotifications) {
        queryClient.setQueryData(
          ["notifications"],
          context.previousNotifications,
        );
      }
    },
  });

  // Mark all notifications as read
  const markAllAsReadMutation = useMutation({
    mutationFn: () => markAllAsRead(),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["notifications"] });
      const previousNotifications = queryClient.getQueryData<
        NotificationType[]
      >(["notifications"]);

      queryClient.setQueryData<NotificationType[]>(
        ["notifications"],
        (old = []) => old.map((n) => ({ ...n, readAt: new Date() })),
      );

      return { previousNotifications };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["unreadCount"] });
    },
    onError: (err, variables, context) => {
      if (context?.previousNotifications) {
        queryClient.setQueryData(
          ["notifications"],
          context.previousNotifications,
        );
      }
    },
  });

  const handleNotificationClick = async (notification: NotificationType) => {
    // Mark as read if not already
    if (!notification.readAt && notification._id) {
      markAsReadMutation.mutate(notification._id);
    }

    // Handle scheduling request notifications - open modal directly
    if (
      notification.type === NOTIFICATION_TYPES.SCHEDULING_REQUEST &&
      notification.metadata?.schedulingRequestId
    ) {
      try {
        const result = await getSchedulingRequestById(
          notification.metadata.schedulingRequestId,
        );
        if (result.success && result.request) {
          setSelectedSchedulingRequest(result.request);
          setIsModalOpen(true);
        }
      } catch (error) {
        console.error("Failed to load scheduling request:", error);
      }
      return;
    }

    // Navigate to related page for other notification types
    if (notification.metadata?.link) {
      onClose();
      router.push(notification.metadata.link);
    } else if (notification.metadata?.invoiceId) {
      onClose();
      router.push(`/invoices/${notification.metadata.invoiceId}`);
    } else if (notification.metadata?.scheduleId) {
      onClose();
      router.push(`/schedule`);
    } else if (notification.metadata?.clientId) {
      onClose();
      router.push(`/database?clientId=${notification.metadata.clientId}`);
    } else if (notification.metadata?.estimateId) {
      onClose();
      router.push(`/estimates/${notification.metadata.estimateId}`);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedSchedulingRequest(null);
    // Refetch notifications after closing modal (request may have been confirmed)
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
    queryClient.invalidateQueries({ queryKey: ["unreadCount"] });
    queryClient.invalidateQueries({ queryKey: ["schedulingRequests"] });
  };

  const unreadCount = notifications.filter(
    (n: NotificationType) => !n.readAt,
  ).length;

  return (
    <>
      <div className="flex flex-col">
        {/* Header */}
        <div className="border-border flex items-center justify-between border-b px-4 py-3">
          <div>
            <h3 className="text-foreground font-semibold">Notifications</h3>
            {unreadCount > 0 && (
              <p className="text-muted-foreground text-xs">
                {unreadCount} unread
              </p>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => markAllAsReadMutation.mutate()}
              disabled={markAllAsReadMutation.isPending}
              className="text-primary hover:text-primary/90 text-xs"
            >
              <CheckCheck className="mr-1 h-3 w-3" />
              Mark all read
            </Button>
          )}
        </div>

        {/* Notification List */}
        <ScrollArea className="h-96">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="border-border border-t-primary h-6 w-6 animate-spin rounded-full border-2" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-muted-foreground flex flex-col items-center justify-center py-12">
              <span className="text-4xl">🔔</span>
              <p className="mt-2 text-sm">No notifications yet</p>
            </div>
          ) : (
            <div>
              {notifications.map(
                (notification: NotificationType, index: number) => (
                  <div key={notification._id}>
                    <button
                      type="button"
                      onClick={() => handleNotificationClick(notification)}
                      className={`hover:bg-muted w-full px-4 py-3 text-left transition-colors ${
                        !notification.readAt ? "bg-primary/10" : ""
                      }`}
                    >
                      <div className="flex gap-3">
                        <span className="text-lg">
                          {typeIcons[notification.type] || "🔔"}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p
                              className={`text-sm ${
                                !notification.readAt
                                  ? "text-foreground font-semibold"
                                  : "text-foreground font-medium"
                              }`}
                            >
                              {notification.title}
                            </p>
                            {!notification.readAt && (
                              <Badge
                                variant="default"
                                className="bg-primary mt-1.5 h-2 w-2 shrink-0 rounded-full p-0"
                              />
                            )}
                          </div>
                          <p className="text-muted-foreground mt-0.5 line-clamp-2 text-sm">
                            {notification.body}
                          </p>
                          <div className="mt-1 flex items-center gap-2">
                            <span className="text-muted-foreground text-xs">
                              {notification.createdAt
                                ? formatDistanceToNow(
                                    new Date(notification.createdAt),
                                    {
                                      addSuffix: true,
                                    },
                                  )
                                : ""}
                            </span>
                            {notification.metadata?.link && (
                              <ExternalLink className="text-muted-foreground h-3 w-3" />
                            )}
                            {notification.type ===
                              NOTIFICATION_TYPES.SCHEDULING_REQUEST && (
                              <span className="text-primary text-xs font-medium">
                                Click to review
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                    {index < notifications.length - 1 && <Separator />}
                  </div>
                ),
              )}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Scheduling Review Modal */}
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
