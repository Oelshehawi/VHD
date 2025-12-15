// @ts-nocheck

// Push notification event
self.addEventListener("push", function (event) {
  let title = "VHD";
  let body = "You have a new notification";
  let url = "/";

  if (event.data) {
    try {
      // Try to parse as JSON first
      const data = event.data.json();
      title = data.title || title;
      body = data.body || body;
      url = data.url || url;
    } catch (e) {
      // If JSON parsing fails, treat as plain text
      body = event.data.text() || body;
    }
  }

  const options = {
    body: body,
    icon: "/icon_192.png",
    badge: "/icon_192.png",
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: "1",
      url: url,
    },
    requireInteraction: false,
    silent: false,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Notification click event
self.addEventListener("notificationclick", function (event) {
  console.log("Notification click received.");
  event.notification.close();

  const url = event.notification.data?.url || "/";

  event.waitUntil(
    clients.matchAll({ type: "window" }).then(function (clientList) {
      // If a window is already open, focus it
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if ("focus" in client) {
          return client.focus();
        }
      }
      // If no window is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    }),
  );
});