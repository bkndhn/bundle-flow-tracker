// Service Worker for Goods Movement Tracker PWA
// Version 3 - Fixed caching strategy to prevent blank pages
const CACHE_NAME = 'goods-tracker-v3';
const STATIC_ASSETS = [
    '/manifest.json',
    '/logo-192.png',
    '/logo-512.png'
];

// Install event - cache only static assets (not index.html which changes)
self.addEventListener('install', (event) => {
    console.log('[SW] Installing service worker v3');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[SW] Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .catch((err) => {
                console.error('[SW] Cache addAll failed:', err);
            })
    );
    // Activate immediately
    self.skipWaiting();
});

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating service worker v3');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[SW] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    // Take control immediately
    self.clients.claim();
});

// Fetch event - Network-first for HTML/JS, cache-first for static assets
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Skip non-GET requests
    if (event.request.method !== 'GET') {
        return;
    }

    // Skip API calls and external requests
    if (url.pathname.startsWith('/rest/') ||
        url.pathname.startsWith('/auth/') ||
        url.hostname !== self.location.hostname) {
        return;
    }

    // For HTML and JS files - ALWAYS go network first to prevent stale bundles
    if (event.request.mode === 'navigate' ||
        url.pathname.endsWith('.html') ||
        url.pathname.endsWith('.js') ||
        url.pathname.endsWith('.css') ||
        url.pathname === '/') {
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    // Cache the fresh response for offline use
                    if (response.ok) {
                        const responseClone = response.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(event.request, responseClone);
                        });
                    }
                    return response;
                })
                .catch(() => {
                    // Network failed, try cache as fallback
                    return caches.match(event.request).then((cachedResponse) => {
                        if (cachedResponse) {
                            return cachedResponse;
                        }
                        // Return a basic offline page if nothing in cache
                        return new Response(
                            '<html><body><h1>Offline</h1><p>Please check your connection and refresh.</p><button onclick="location.reload()">Retry</button></body></html>',
                            { headers: { 'Content-Type': 'text/html' } }
                        );
                    });
                })
        );
        return;
    }

    // For static assets (images, fonts) - cache first
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                if (response) {
                    return response;
                }
                return fetch(event.request).then((networkResponse) => {
                    // Cache the response for future use
                    if (networkResponse.ok) {
                        const responseClone = networkResponse.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(event.request, responseClone);
                        });
                    }
                    return networkResponse;
                });
            })
    );
});

// Push notification event
self.addEventListener('push', (event) => {
    console.log('[SW] Push notification received:', event);

    let data = {
        title: '📦 Goods Movement Tracker',
        body: 'You have a new notification',
        icon: '/logo-192.png',
        badge: '/logo-192.png',
        data: { url: '/' }
    };

    if (event.data) {
        try {
            const pushData = event.data.json();
            data = { ...data, ...pushData };
        } catch (e) {
            data.body = event.data.text();
        }
    }

    event.waitUntil(
        self.registration.showNotification(data.title, {
            body: data.body,
            icon: data.icon,
            badge: data.badge,
            vibrate: [100, 50, 100],
            data: data.data,
            requireInteraction: true,
            actions: [
                { action: 'open', title: 'Open App' },
                { action: 'close', title: 'Dismiss' }
            ]
        })
    );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
    console.log('[SW] Notification clicked:', event);
    event.notification.close();

    if (event.action === 'close') {
        return;
    }

    const urlToOpen = event.notification.data?.url || '/';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then((clientList) => {
                for (const client of clientList) {
                    if (client.url.includes(self.location.origin) && 'focus' in client) {
                        client.focus();
                        if (urlToOpen !== '/') {
                            client.navigate(urlToOpen);
                        }
                        return;
                    }
                }
                return clients.openWindow(urlToOpen);
            })
    );
});

// Message event - allow manual cache clear
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'CLEAR_CACHE') {
        console.log('[SW] Clearing all caches');
        caches.keys().then((names) => {
            names.forEach((name) => caches.delete(name));
        });
        event.ports[0].postMessage({ success: true });
    }

    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
