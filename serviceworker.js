// Daily Light no longer uses a service worker.
// This file replaces an old one that was still installed in some browsers and
// was breaking page loads. When a browser checks for an update, it gets this
// version, which clears the old caches, unregisters itself, and reloads any
// open Daily Light tabs so they load fresh from the network.

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map(key => caches.delete(key)));
      await self.registration.unregister();
      const clients = await self.clients.matchAll({ type: "window" });
      clients.forEach(client => client.navigate(client.url));
    })()
  );
});

// Never intercept requests: always go straight to the network.
self.addEventListener("fetch", () => {});
