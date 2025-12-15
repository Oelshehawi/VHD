"use client";

import { useState, useEffect } from "react";
import { CheckCheck, ExternalLink } from "lucide-react";
import { Button } from "../../app/components/ui/button";
import { ScrollArea } from "../../app/components/ui/scroll-area";
import { Separator } from "../../app/components/ui/separator";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
} from "../../app/lib/actions/notifications.actions";
import { NotificationType, NOTIFICATION_TYPES } from "../../app/lib/typeDefinitions";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";

interface NotificationsPanelProps {
  onNotificationChange: () => void;
  onClose: () => void;
}

const typeIcons: Record<string, string> = {
  [NOTIFICATION_TYPES.JOB_REMINDER]: "📅",
  [NOTIFICATION_TYPES.INVOICE_PAID]: "💰",
  [NOTIFICATION_TYPES.INVOICE_OVERDUE]: "⚠️",
  [NOTIFICATION_TYPES.SCHEDULE_UPDATE]: "🔄",
  [NOTIFICATION_TYPES.ESTIMATE_STATUS]: "📋",
  [NOTIFICATION_TYPES.SYSTEM]: "🔔",
};

export default function NotificationsPanel({
  onNotificationChange,
  onClose,
}: NotificationsPanelProps) {
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function fetchNotifications() {
      setLoading(true);
      const result = await getNotifications(30);
      if (result.success) {
        setNotifications(result.notifications);
      }
      setLoading(false);
    }
    fetchNotifications();
  }, []);

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, readAt: new Date() }))
    );
    onNotificationChange();
  };

  const handleNotificationClick = async (notification: NotificationType) => {
    // Mark as read if not already
    if (!notification.readAt && notification._id) {
      await markAsRead(notification._id);
      setNotifications((prev) =>
        prev.map((n) =>
          n._id === notification._id ? { ...n, readAt: new Date() } : n
        )
      );
      onNotificationChange();
    }

    // Navigate if there's a link in metadata
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

  const unreadCount = notifications.filter((n) => !n.readAt).length;

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div>
          <h3 className="font-semibold text-gray-900">Notifications</h3>
          {unreadCount > 0 && (
            <p className="text-xs text-gray-500">{unreadCount} unread</p>
          )}
        </div>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleMarkAllAsRead}
            className="text-xs text-blue-600 hover:text-blue-700"
          >
            <CheckCheck className="mr-1 h-3 w-3" />
            Mark all read
          </Button>
        )}
      </div>

      {/* Notification List */}
      <ScrollArea className="h-100">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <span className="text-4xl">🔔</span>
            <p className="mt-2 text-sm">No notifications yet</p>
          </div>
        ) : (
          <div>
            {notifications.map((notification, index) => (
              <div key={notification._id}>
                <button
                  type="button"
                  onClick={() => handleNotificationClick(notification)}
                  className={`w-full px-4 py-3 text-left transition-colors hover:bg-gray-50 ${
                    !notification.readAt ? "bg-blue-50/50" : ""
                  }`}
                >
                  <div className="flex gap-3">
                    <span className="text-lg">
                      {typeIcons[notification.type] || "🔔"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className={`text-sm ${
                            !notification.readAt
                              ? "font-semibold text-gray-900"
                              : "font-medium text-gray-700"
                          }`}
                        >
                          {notification.title}
                        </p>
                        {!notification.readAt && (
                          <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-600" />
                        )}
                      </div>
                      <p className="mt-0.5 text-sm text-gray-600 line-clamp-2">
                        {notification.body}
                      </p>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-xs text-gray-400">
                          {notification.createdAt
                            ? formatDistanceToNow(new Date(notification.createdAt), {
                                addSuffix: true,
                              })
                            : ""}
                        </span>
                        {notification.metadata?.link && (
                          <ExternalLink className="h-3 w-3 text-gray-400" />
                        )}
                      </div>
                    </div>
                  </div>
                </button>
                {index < notifications.length - 1 && <Separator />}
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
