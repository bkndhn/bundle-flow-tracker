// Service Worker for Goods Movement Tracker PWA
// Version 4 - Enhanced with better push notification support
const CACHE_NAME = 'goods-tracker-v4';
const STATIC_ASSETS = [
    '/manifest.json',
    '/logo-192.png',
    '/logo-512.png'
];

// Install event - cache only static assets
self.addEventListener('install', (event) => {
    console.log('[SW] Installing service worker v4');
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
    console.log('[SW] Activating service worker v4');
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

    // For HTML and JS files - ALWAYS go network first
    if (event.request.mode === 'navigate' ||
        url.pathname.endsWith('.html') ||
        url.pathname.endsWith('.js') ||
        url.pathname.endsWith('.css') ||
        url.pathname === '/') {
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    if (response.ok) {
                        const responseClone = response.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(event.request, responseClone);
                        });
                    }
                    return response;
                })
                .catch(() => {
                    return caches.match(event.request).then((cachedResponse) => {
                        if (cachedResponse) {
                            return cachedResponse;
                        }
                        return new Response(
                            '<html><body><h1>Offline</h1><p>Please check your connection and refresh.</p><button onclick="location.reload()">Retry</button></body></html>',
                            { headers: { 'Content-Type': 'text/html' } }
                        );
                    });
                })
        );
        return;
    }

    // For static assets - cache first
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                if (response) {
                    return response;
                }
                return fetch(event.request).then((networkResponse) => {
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

// Push notification event - CRITICAL for background notifications
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

    const options = {
        body: data.body,
        icon: data.icon || '/logo-192.png',
        badge: data.badge || '/logo-192.png',
        vibrate: [200, 100, 200, 100, 200],
        data: data.data || { url: '/' },
        requireInteraction: true,
        tag: data.tag || `notification-${Date.now()}`,
        renotify: true,
        actions: [
            { action: 'open', title: '📱 Open App' },
            { action: 'dismiss', title: '✕ Dismiss' }
        ]
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
    console.log('[SW] Notification clicked:', event);
    event.notification.close();

    if (event.action === 'dismiss') {
        return;
    }

    const urlToOpen = event.notification.data?.url || '/';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then((clientList) => {
                // Try to focus an existing window
                for (const client of clientList) {
                    if (client.url.includes(self.location.origin) && 'focus' in client) {
                        client.focus();
                        if (urlToOpen !== '/') {
                            client.navigate(urlToOpen);
                        }
                        return;
                    }
                }
                // Open a new window if none exists
                return clients.openWindow(urlToOpen);
            })
    );
});

// Notification close event (for analytics)
self.addEventListener('notificationclose', (event) => {
    console.log('[SW] Notification closed:', event.notification.tag);
});

// Message event - allow manual cache clear and other commands
self.addEventListener('message', (event) => {
    console.log('[SW] Message received:', event.data);

    if (event.data && event.data.type === 'CLEAR_CACHE') {
        console.log('[SW] Clearing all caches');
        caches.keys().then((names) => {
            names.forEach((name) => caches.delete(name));
        });
        if (event.ports && event.ports[0]) {
            event.ports[0].postMessage({ success: true });
        }
    }

    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }

    // Handle push subscription check
    if (event.data && event.data.type === 'GET_PUSH_SUBSCRIPTION') {
        self.registration.pushManager.getSubscription()
            .then((subscription) => {
                if (event.ports && event.ports[0]) {
                    event.ports[0].postMessage({ subscription: subscription ? JSON.stringify(subscription) : null });
                }
            });
    }
});

// Periodic sync for keeping connection alive (if supported)
self.addEventListener('periodicsync', (event) => {
    console.log('[SW] Periodic sync event:', event.tag);
    if (event.tag === 'keep-alive') {
        event.waitUntil(
            // Just a ping to keep things fresh
            fetch('/manifest.json').catch(() => {})
        );
    }
});

// Background sync for offline queue
self.addEventListener('sync', (event) => {
    console.log('[SW] Sync event:', event.tag);
    if (event.tag === 'sync-queue') {
        event.waitUntil(
            // The main app will handle the actual sync
            clients.matchAll().then((clientList) => {
                clientList.forEach((client) => {
                    client.postMessage({ type: 'SYNC_REQUESTED' });
                });
            })
        );
    }
});
