// Notification Service for Dispatch Alerts
// Version 2 - Improved reliability across devices
// Handles push notification permissions, sending notifications, and real-time subscriptions

import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { RealtimeChannel } from '@supabase/supabase-js';

// Connection state tracking
let currentChannel: RealtimeChannel | null = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY_MS = 3000;
let isSubscribing = false;
let lastNotificationTime = 0;
const NOTIFICATION_DEBOUNCE_MS = 2000;

// Debug logging
const DEBUG = true;
const log = (message: string, ...args: any[]) => {
    if (DEBUG) {
        console.log(`[NotificationService] ${message}`, ...args);
    }
};

// Check if notifications are supported
export const isNotificationSupported = () => {
    const supported = 'Notification' in window && 'serviceWorker' in navigator;
    log('Notification support check:', supported);
    return supported;
};

// Check if we're on a mobile device
export const isMobileDevice = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

// Request notification permission
export const requestNotificationPermission = async (): Promise<boolean> => {
    if (!isNotificationSupported()) {
        log('Notifications not supported in this browser');
        return false;
    }

    try {
        log('Requesting notification permission...');
        const permission = await Notification.requestPermission();
        log('Permission result:', permission);
        return permission === 'granted';
    } catch (error) {
        console.error('Error requesting notification permission:', error);
        return false;
    }
};

// Get current notification permission status
export const getNotificationPermission = (): NotificationPermission | 'unsupported' => {
    if (!isNotificationSupported()) {
        return 'unsupported';
    }
    return Notification.permission;
};

// Check if service worker is ready
export const isServiceWorkerReady = async (): Promise<boolean> => {
    if (!('serviceWorker' in navigator)) {
        return false;
    }
    try {
        const registration = await navigator.serviceWorker.ready;
        return !!registration;
    } catch {
        return false;
    }
};

// Play notification sound (fallback for when push doesn't work)
const playNotificationSound = () => {
    try {
        // Create a simple beep using Web Audio API
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);

        log('Played notification sound');
    } catch (e) {
        log('Could not play notification sound:', e);
    }
};

// Vibrate device (for mobile)
const vibrateDevice = () => {
    try {
        if ('vibrate' in navigator) {
            navigator.vibrate([200, 100, 200]);
            log('Device vibrated');
        }
    } catch (e) {
        log('Could not vibrate device:', e);
    }
};

// Show a notification with multiple fallback mechanisms
export const showNotification = async (
    title: string,
    options: {
        body: string;
        icon?: string;
        badge?: string;
        tag?: string;
        data?: any;
        silent?: boolean;
    }
): Promise<boolean> => {
    log('Attempting to show notification:', title);

    // Debounce rapid notifications
    const now = Date.now();
    if (now - lastNotificationTime < NOTIFICATION_DEBOUNCE_MS) {
        log('Notification debounced');
        return false;
    }
    lastNotificationTime = now;

    let notificationShown = false;

    // Method 1: Try Service Worker notification (works in background)
    if (isNotificationSupported() && Notification.permission === 'granted') {
        try {
            const registration = await navigator.serviceWorker.ready;
            await registration.showNotification(title, {
                body: options.body,
                icon: options.icon || '/logo-192.png',
                badge: options.badge || '/logo-192.png',
                tag: options.tag || `dispatch-${Date.now()}`,
                data: options.data,
                vibrate: [200, 100, 200],
                requireInteraction: true,
                actions: [
                    { action: 'open', title: 'Open App' },
                    { action: 'dismiss', title: 'Dismiss' }
                ]
            } as any);
            log('Service Worker notification shown successfully');
            notificationShown = true;
        } catch (swError) {
            log('Service Worker notification failed:', swError);

            // Method 2: Fallback to regular Notification API
            try {
                new Notification(title, {
                    body: options.body,
                    icon: options.icon || '/logo-192.png',
                    tag: options.tag || `dispatch-${Date.now()}`,
                });
                log('Regular Notification API used as fallback');
                notificationShown = true;
            } catch (notifError) {
                log('Regular Notification also failed:', notifError);
            }
        }
    } else {
        log('Notifications not supported or permission not granted');
    }

    // Method 3: Show in-app toast ONLY if push notification failed
    // This prevents duplicate alerts (push + toast)
    if (!notificationShown) {
        toast.success(title, {
            description: options.body,
            duration: 8000,
            action: options.data?.url ? {
                label: 'View',
                onClick: () => window.location.href = options.data.url
            } : undefined
        });
    }

    // Play sound and vibrate for important notifications
    if (!options.silent) {
        playNotificationSound();
        vibrateDevice();
    }

    return notificationShown;
};

/**
 * Check real-time connection status
 */
export const getConnectionStatus = (): string => {
    if (!currentChannel) {
        return 'disconnected';
    }
    // @ts-ignore - accessing internal state
    return currentChannel.state || 'unknown';
};

/**
 * Force reconnect to real-time channel
 */
export const forceReconnect = async (userRole: string, userId: string): Promise<boolean> => {
    log('Force reconnecting...');

    // Unsubscribe existing channel
    if (currentChannel) {
        await supabase.removeChannel(currentChannel);
        currentChannel = null;
    }

    // Reset reconnect attempts
    reconnectAttempts = 0;

    // Resubscribe
    const channel = subscribeToIncomingDispatches(userRole, userId);
    return !!channel;
};

/**
 * Subscribe to real-time dispatches with improved reliability
 */
export const subscribeToIncomingDispatches = (userRole: string, currentUserId: string): RealtimeChannel | null => {
    if (!isNotificationSupported()) {
        log('Notifications not supported, skipping subscription');
        return null;
    }

    // Prevent duplicate subscriptions
    if (isSubscribing) {
        log('Already subscribing, skipping...');
        return currentChannel;
    }

    // Unsubscribe existing channel first
    if (currentChannel) {
        log('Removing existing channel before resubscribing');
        supabase.removeChannel(currentChannel);
        currentChannel = null;
    }

    isSubscribing = true;
    log(`Setting up Realtime notifications for role: ${userRole}`);

    const channelName = `dispatch-notifications-${currentUserId}-${Date.now()}`;

    const channel = supabase
        .channel(channelName, {
            config: {
                broadcast: { self: false },
                presence: { key: currentUserId }
            }
        })
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'goods_movements'
            },
            async (payload) => {
                log('New dispatch received via Realtime:', payload);
                const newMovement = payload.new;

                let shouldNotify = false;
                const dest = newMovement.destination;

                // Role-based notification logic for dispatches
                if (userRole === 'admin') {
                    shouldNotify = true;
                } else if (userRole === 'big_shop_manager' && (dest === 'big_shop' || dest === 'both')) {
                    shouldNotify = true;
                } else if (userRole === 'small_shop_manager' && (dest === 'small_shop' || dest === 'both')) {
                    shouldNotify = true;
                } else if (userRole === 'godown_manager' && dest === 'godown') {
                    shouldNotify = true;
                }

                if (shouldNotify) {
                    const locationNames: Record<string, string> = {
                        godown: 'Godown',
                        big_shop: 'Big Shop',
                        small_shop: 'Small Shop',
                    };

                    const title = '📦 New Goods Dispatched!';
                    const body = `${newMovement.item} (${newMovement.bundles_count} units) sent to ${locationNames[dest] || dest}.`;

                    await showNotification(title, {
                        body,
                        data: {
                            type: 'dispatch',
                            url: '/receive',
                            movementId: newMovement.id
                        }
                    });
                } else {
                    log('Notification skipped - not for this user role');
                }
            }
        )
        .on(
            'postgres_changes',
            {
                event: 'UPDATE',
                schema: 'public',
                table: 'goods_movements'
            },
            async (payload) => {
                log('Movement updated via Realtime:', payload);
                const updatedMovement = payload.new;
                const oldMovement = payload.old;

                // Only notify when status changes to 'received' (goods arrived)
                if (oldMovement.status === 'dispatched' && updatedMovement.status === 'received') {
                    let shouldNotify = false;
                    const source = updatedMovement.source || 'godown';
                    const dest = updatedMovement.destination;

                    // Role-based notification logic for arrivals
                    if (userRole === 'admin') {
                        // Admin gets all arrival notifications
                        shouldNotify = true;
                    } else if (userRole === 'godown_manager' && source === 'godown') {
                        // Godown manager gets notified when goods they sent are received
                        shouldNotify = true;
                    } else if (userRole === 'big_shop_manager') {
                        // Big shop manager gets notified when:
                        // - Goods they sent are received (source is big_shop)
                        // - OR goods arrived at their shop (dest is big_shop)
                        shouldNotify = source === 'big_shop' || dest === 'big_shop';
                    } else if (userRole === 'small_shop_manager') {
                        // Small shop manager gets notified when:
                        // - Goods they sent are received (source is small_shop)
                        // - OR goods arrived at their shop (dest is small_shop)
                        shouldNotify = source === 'small_shop' || dest === 'small_shop';
                    }

                    if (shouldNotify) {
                        const locationNames: Record<string, string> = {
                            godown: 'Godown',
                            big_shop: 'Big Shop',
                            small_shop: 'Small Shop',
                        };

                        const itemDisplay = updatedMovement.item.charAt(0).toUpperCase() + updatedMovement.item.slice(1);
                        const title = '✅ Goods Arrived!';
                        const body = `${itemDisplay} (${updatedMovement.bundles_count} units) received at ${locationNames[dest] || dest}.`;

                        await showNotification(title, {
                            body,
                            tag: `arrival-${updatedMovement.id}`,
                            data: {
                                type: 'arrival',
                                url: '/reports',
                                movementId: updatedMovement.id
                            }
                        });
                    } else {
                        log('Arrival notification skipped - not for this user role');
                    }
                }
            }
        )
        .on('system', { event: '*' }, (status) => {
            log('Channel system event:', status);
        })
        .subscribe((status, err) => {
            isSubscribing = false;

            if (status === 'SUBSCRIBED') {
                log('Successfully subscribed to dispatch & arrival notifications');
                reconnectAttempts = 0;
                // Connection established silently - no toast needed
            } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
                log('Channel error or timeout:', status, err);

                // Attempt reconnection
                if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
                    reconnectAttempts++;
                    log(`Reconnection attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}`);

                    setTimeout(() => {
                        subscribeToIncomingDispatches(userRole, currentUserId);
                    }, RECONNECT_DELAY_MS * reconnectAttempts);
                } else {
                    toast.error('Connection lost. Please refresh the page.', { duration: 10000 });
                }
            } else if (status === 'CLOSED') {
                log('Channel closed');
            }
        });

    currentChannel = channel;
    return channel;
};

/**
 * Unsubscribe from real-time notifications
 */
export const unsubscribeFromDispatches = async (): Promise<void> => {
    if (currentChannel) {
        log('Unsubscribing from dispatch notifications');
        await supabase.removeChannel(currentChannel);
        currentChannel = null;
    }
};

// Initialize notifications on app load
export const initializeNotifications = async (): Promise<boolean> => {
    log('Initializing notifications...');

    if (!isNotificationSupported()) {
        log('Notifications not supported');
        return false;
    }

    // Register service worker if not already registered
    if ('serviceWorker' in navigator) {
        try {
            const registration = await navigator.serviceWorker.register('/sw.js');
            log('Service Worker registered:', registration.scope);
        } catch (err) {
            console.error('Service Worker registration failed:', err);
        }
    }

    // Check permission status
    const permission = Notification.permission;
    log('Current notification permission:', permission);

    // If permission is default (not asked yet), request it after a delay
    if (permission === 'default') {
        setTimeout(async () => {
            log('Requesting notification permission after delay...');
            const granted = await requestNotificationPermission();
            if (granted) {
                toast.success('Notifications enabled! You\'ll be notified of new dispatches.');
            }
        }, 3000);
    } else if (permission === 'denied') {
        log('Notification permission was denied by user');
        toast.warning('Notifications are blocked. Enable them in browser settings for dispatch alerts.', {
            duration: 5000
        });
    }

    return permission === 'granted';
};

// Send a test notification to verify system reliability
export const sendTestNotification = async (): Promise<boolean> => {
    log('Sending test notification...');

    if (!isNotificationSupported()) {
        toast.error('Notifications are not supported in this browser.');
        return false;
    }

    if (Notification.permission === 'denied') {
        toast.error('Notification permission is denied. Please allow notifications in browser settings.');
        return false;
    }

    if (Notification.permission === 'default') {
        const granted = await requestNotificationPermission();
        if (!granted) {
            toast.error('Notification permission was not granted.');
            return false;
        }
    }

    const title = '🔔 Test Notification';
    const body = 'This confirms your device can receive dispatch alerts. If you see this, notifications are working!';

    const success = await showNotification(title, {
        body,
        data: {
            type: 'test',
            url: '/'
        }
    });

    if (success) {
        log('Test notification sent successfully');
    } else {
        log('Test notification failed, but fallback methods used');
    }

    return true;
};

// Get diagnostic information for troubleshooting
export const getNotificationDiagnostics = async (): Promise<{
    supported: boolean;
    permission: NotificationPermission | 'unsupported';
    serviceWorkerReady: boolean;
    connectionStatus: string;
    isMobile: boolean;
    userAgent: string;
}> => {
    return {
        supported: isNotificationSupported(),
        permission: getNotificationPermission(),
        serviceWorkerReady: await isServiceWorkerReady(),
        connectionStatus: getConnectionStatus(),
        isMobile: isMobileDevice(),
        userAgent: navigator.userAgent
    };
};
