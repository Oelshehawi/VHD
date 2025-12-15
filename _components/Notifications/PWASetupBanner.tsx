"use client";

import { useState, useEffect } from "react";
import PushNotificationManager from "./PushNotificationManager";

export default function PWASetupBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const hasSeenBanner = localStorage.getItem("hasSeenPWABanner");
    
    // Check if already installed as standalone
    const standalone = window.matchMedia("(display-mode: standalone)").matches;
    setIsStandalone(standalone);
    
    // Check if iOS
    setIsIOS(
      /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
    );
    
    if (!hasSeenBanner) {
      setShowBanner(true);
      // Trigger slide-in animation after mount
      setTimeout(() => setIsVisible(true), 100);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(() => {
      localStorage.setItem("hasSeenPWABanner", "true");
      setShowBanner(false);
    }, 300);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed inset-0 z-9999 pointer-events-none">
      <div
        className={`absolute top-4 right-4 max-w-md bg-white border border-blue-200 rounded-xl p-6 shadow-2xl pointer-events-auto transition-all duration-300 ease-out ${
          isVisible
            ? "translate-x-0 opacity-100"
            : "translate-x-full opacity-0"
        }`}
      >
        <div className="flex justify-between items-start">
          <div className="flex-1 pr-4">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              Enhance Your Experience
            </h3>
            <p className="text-sm text-blue-800 mb-4">
              Install this app and enable notifications for the best experience.
            </p>

            <div className="space-y-3">
              {/* Install section */}
              {isStandalone ? (
                <p className="text-sm text-green-700">✓ App installed</p>
              ) : deferredPrompt ? (
                <button
                  type="button"
                  onClick={handleInstall}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors"
                >
                  Install App
                </button>
              ) : isIOS ? (
                <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                  <p className="font-medium mb-1">Install on iOS:</p>
                  <p>
                    Tap the share button{" "}
                    <span className="inline-block px-1">⎋</span> then "Add to
                    Home Screen"{" "}
                    <span className="inline-block px-1">➕</span>
                  </p>
                </div>
              ) : (
                <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                  <p className="font-medium mb-1">Install this app:</p>
                  <p>
                    Click the install icon in your browser's address bar, or use
                    the browser menu → "Install app"
                  </p>
                </div>
              )}

              <PushNotificationManager />
            </div>
          </div>

          <button
            type="button"
            onClick={handleDismiss}
            className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700 transition-colors"
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
