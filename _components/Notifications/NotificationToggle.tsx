"use client";

import { Bell, BellOff, Loader2 } from "lucide-react";
import { Switch } from "../ui/switch";
import { usePushNotifications } from "./usePushNotifications";

export default function NotificationToggle() {
  const { isSupported, isSubscribed, isLoading, error, toggleSubscription } =
    usePushNotifications();

  if (!isSupported) {
    return (
      <div className="flex items-center gap-3 p-4 text-gray-500">
        <BellOff className="h-5 w-5" />
        <span className="text-sm">
          Push notifications are not supported in this browser.
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bell className="h-5 w-5 text-gray-600" />
          <div>
            <p className="font-medium text-gray-900">Push Notifications</p>
            <p className="text-sm text-gray-500">
              {isSubscribed
                ? "Notifications enabled"
                : "Receive alerts for updates"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isLoading && (
            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
          )}
          <Switch
            checked={isSubscribed}
            onCheckedChange={toggleSubscription}
            disabled={isLoading}
            aria-label="Toggle push notifications"
          />
        </div>
      </div>
      {error && (
        <p className="rounded-md bg-red-50 p-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
