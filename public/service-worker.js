// Caching logic
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open("v1").then(cache => {
      // Add more assets to cache for offline functionality
      return cache.addAll([
        "/",
        "/index.html",
        "/index.tsx",
        // Add other critical assets
        "https://i.postimg.cc/QNW4B8KQ/00WZrbng.png",
        "https://i.postimg.cc/g2mhxC8q/vas_AGbotko-OBs.png"
      ]);
    })
  );
});

self.addEventListener("fetch", event => {
  // Use a cache-first strategy
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});

// Push notification logic
self.addEventListener('push', event => {
  if (!event.data) return;
  const data = event.data.json();
  const options = {
    body: data.body,
    icon: data.icon,
    data: {
      url: data.url,
    },
  };
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const urlToOpen = event.notification.data.url;
  if (!urlToOpen) return;

  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true,
    }).then(clientList => {
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
