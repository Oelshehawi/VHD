"use client";

import { useState, useEffect, useCallback } from "react";
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

export interface UsePushNotificationsResult {
  isSupported: boolean;
  isSubscribed: boolean;
  isLoading: boolean;
  error: string | null;
  toggleSubscription: () => Promise<void>;
}

export function usePushNotifications(): UsePushNotificationsResult {
  const [isSupported, setIsSupported] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(
    null
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

  const subscribeToPush = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setError(
          "Notification permission denied. Please enable in browser settings."
        );
        setIsLoading(false);
        return;
      }

      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

      if (!vapidKey) {
        setError("VAPID key is missing.");
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
  }, []);

  const unsubscribeFromPush = useCallback(async () => {
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
  }, [subscription]);

  const toggleSubscription = useCallback(async () => {
    if (subscription) {
      await unsubscribeFromPush();
    } else {
      await subscribeToPush();
    }
  }, [subscription, subscribeToPush, unsubscribeFromPush]);

  return {
    isSupported,
    isSubscribed: !!subscription,
    isLoading,
    error,
    toggleSubscription,
  };
}
