// Notification Service for Dispatch Alerts
// Handles push notification permissions and sending notifications

import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Check if notifications are supported
export const isNotificationSupported = () => {
    return 'Notification' in window && 'serviceWorker' in navigator;
};

// Request notification permission
export const requestNotificationPermission = async (): Promise<boolean> => {
    if (!isNotificationSupported()) {
        console.log('Notifications not supported in this browser');
        return false;
    }

    try {
        const permission = await Notification.requestPermission();
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

// Show a notification
export const showNotification = async (
    title: string,
    options: {
        body: string;
        icon?: string;
        badge?: string;
        tag?: string;
        data?: any;
    }
) => {
    if (!isNotificationSupported()) {
        console.log('Notifications not supported');
        return;
    }

    if (Notification.permission !== 'granted') {
        console.log('Notification permission not granted');
        return;
    }

    try {
        // Try to use service worker notification (works in background)
        const registration = await navigator.serviceWorker.ready;
        await registration.showNotification(title, {
            body: options.body,
            icon: options.icon || '/logo-192.png',
            badge: options.badge || '/logo-192.png',
            tag: options.tag || `dispatch-${Date.now()}`, // Unique tag for each
            data: options.data,
            vibrate: [200, 100, 200],
            requireInteraction: true,
            actions: [
                { action: 'open', title: 'Open App' },
                { action: 'dismiss', title: 'Dismiss' }
            ]
        });
        toast.success('Notification test sent successfully!');
    } catch (error) {
        console.error('Error showing notification:', error);
        // Fallback to regular notification
        try {
            new Notification(title, {
                body: options.body,
                icon: options.icon || '/logo-192.png',
                tag: options.tag || `dispatch-${Date.now()}`,
            });
            toast.success('Notification test sent (Fallback mode)!');
        } catch (e) {
            toast.error('Failed to send notification. Check your browser settings.');
        }
    }
};

/**
 * Subscribe to real-time dispatches and notify if destination matches user role
 */
export const subscribeToIncomingDispatches = (userRole: string, currentUserId: string) => {
    if (!isNotificationSupported()) return null;

    console.log(`Setting up Realtime notifications for role: ${userRole}`);

    const channel = supabase
        .channel('changes')
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'goods_movements'
            },
            async (payload) => {
                console.log('New dispatch received via Realtime:', payload);
                const newMovement = payload.new;

                // We'll try to match the sender. If we can't perfectly match yet,
                // the user might see their own notification, which they confirmed happens.
                // In a future update, we should add 'created_by' column to the DB.

                let shouldNotify = false;
                const dest = newMovement.destination;

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
                    const title = '📦 New Goods Dispatched';
                    const body = `${newMovement.item} (${newMovement.bundles_count} units) sent to ${dest.replace('_', ' ')}.`;

                    showNotification(title, {
                        body,
                        data: {
                            type: 'dispatch',
                            url: '/receive'
                        }
                    });
                }
            }
        )
        .subscribe();

    return channel;
};

// Initialize notifications on app load
export const initializeNotifications = async () => {
    if (!isNotificationSupported()) {
        return false;
    }

    // If permission is default (not asked yet), request it
    if (Notification.permission === 'default') {
        // Wait a bit before asking to not be intrusive
        setTimeout(async () => {
            await requestNotificationPermission();
        }, 3000);
    }

    return Notification.permission === 'granted';
};

// Send a test notification to verify system reliability
export const sendTestNotification = async () => {
    if (!isNotificationSupported()) {
        toast.error('Notifications are not supported in this browser.');
        return;
    }

    if (Notification.permission === 'denied') {
        toast.error('Notification permission is denied. Please allow notifications in browser settings.');
        return;
    }

    if (Notification.permission === 'default') {
        const granted = await requestNotificationPermission();
        if (!granted) {
            toast.error('Notification permission was not granted.');
            return;
        }
    }

    const title = '🔔 Test Dispatch System';
    const body = 'This is a test notification to verify your device alerts are working. Like WhatsApp, you should see this even in the background!';

    await showNotification(title, {
        body,
        data: {
            type: 'test',
            url: '/'
        }
    });
};
