// Minimal Service Worker for Pro TooLs
// Caches nothing; acts as a pass-through to avoid registration errors
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Bypass and let the network handle requests
  return;
});
