"use client";

import { useState, useEffect } from "react";
import {
  subscribeUser,
  unsubscribeUser,
} from "../../app/lib/actions/notifications.actions";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function PushNotificationManager() {
  const [isSupported, setIsSupported] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if ("serviceWorker" in navigator && "PushManager" in window) {
      setIsSupported(true);
      registerServiceWorker();
    }
  }, []);

  async function registerServiceWorker() {
    try {
      const registration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
        updateViaCache: "none",
      });
      const sub = await registration.pushManager.getSubscription();
      setSubscription(sub);
    } catch (err) {
      console.error("Service worker registration failed:", err);
    }
  }

  async function subscribeToPush() {
    setIsLoading(true);
    setError(null);
    
    try {
      // First check/request notification permission
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setError("Notification permission denied. Please enable notifications in your browser settings.");
        setIsLoading(false);
        return;
      }

      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

      if (!vapidKey) {
        setError("VAPID key is missing. Check environment variables.");
        setIsLoading(false);
        return;
      }

      const registration = await navigator.serviceWorker.ready;

      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });

      setSubscription(sub);
      const serializedSub = JSON.parse(JSON.stringify(sub));
      await subscribeUser(serializedSub);
    } catch (err) {
      console.error("Failed to subscribe to push notifications:", err);
      setError("Failed to enable notifications. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  async function unsubscribeFromPush() {
    setIsLoading(true);
    setError(null);
    
    try {
      await subscription?.unsubscribe();
      setSubscription(null);
      await unsubscribeUser();
    } catch (err) {
      console.error("Failed to unsubscribe:", err);
      setError("Failed to disable notifications. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  if (!isSupported) {
    return (
      <p className="text-sm text-gray-500">
        Push notifications are not supported in this browser.
      </p>
    );
  }

  return (
    <div>
      {error && (
        <p className="text-sm text-red-600 mb-2">{error}</p>
      )}
      {subscription ? (
        <div className="space-y-2">
          <p className="text-sm text-green-700">✓ Notifications enabled</p>
          <button
            type="button"
            onClick={unsubscribeFromPush}
            disabled={isLoading}
            className="w-full rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Disabling..." : "Disable Notifications"}
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={subscribeToPush}
          disabled={isLoading}
          className="w-full rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Enabling..." : "Enable Notifications"}
        </button>
      )}
    </div>
  );
}
