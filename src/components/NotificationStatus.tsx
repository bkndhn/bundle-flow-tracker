import { useState, useEffect } from 'react';
import { Bell, BellOff, BellRing, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import {
    getNotificationPermission,
    getConnectionStatus,
    sendTestNotification,
    getNotificationDiagnostics,
    forceReconnect,
    requestNotificationPermission
} from '@/services/notificationService';
import { toast } from 'sonner';

interface NotificationStatusProps {
    userRole?: string;
    userId?: string;
}

export function NotificationStatus({ userRole, userId }: NotificationStatusProps) {
    const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default');
    const [connectionStatus, setConnectionStatus] = useState<string>('connecting');
    const [isReconnecting, setIsReconnecting] = useState(false);

    useEffect(() => {
        // Check permission on mount
        setPermission(getNotificationPermission());

        // Check connection status periodically
        const checkStatus = () => {
            setConnectionStatus(getConnectionStatus());
        };

        checkStatus();
        const interval = setInterval(checkStatus, 5000);

        return () => clearInterval(interval);
    }, []);

    const handleEnableNotifications = async () => {
        const granted = await requestNotificationPermission();
        setPermission(getNotificationPermission());

        if (granted) {
            toast.success('Notifications enabled!');
            await sendTestNotification();
        } else {
            toast.error('Please enable notifications in your browser settings');
        }
    };

    const handleTestNotification = async () => {
        await sendTestNotification();
    };

    const handleReconnect = async () => {
        if (!userRole || !userId) return;

        setIsReconnecting(true);
        try {
            const success = await forceReconnect(userRole, userId);
            if (success) {
                toast.success('Reconnected to dispatch updates');
            } else {
                toast.error('Failed to reconnect. Please refresh the page.');
            }
        } finally {
            setIsReconnecting(false);
            setConnectionStatus(getConnectionStatus());
        }
    };

    const handleShowDiagnostics = async () => {
        const diagnostics = await getNotificationDiagnostics();
        console.log('Notification Diagnostics:', diagnostics);

        toast.info(
            <div className="text-sm">
                <p><strong>Support:</strong> {diagnostics.supported ? '✅' : '❌'}</p>
                <p><strong>Permission:</strong> {diagnostics.permission}</p>
                <p><strong>SW Ready:</strong> {diagnostics.serviceWorkerReady ? '✅' : '❌'}</p>
                <p><strong>Connection:</strong> {diagnostics.connectionStatus}</p>
                <p><strong>Mobile:</strong> {diagnostics.isMobile ? 'Yes' : 'No'}</p>
            </div>,
            { duration: 10000 }
        );
    };

    // Determine icon and color based on status
    const getStatusInfo = () => {
        if (permission === 'unsupported') {
            return {
                icon: BellOff,
                color: 'text-gray-400',
                bgColor: 'bg-gray-100',
                label: 'Notifications not supported'
            };
        }

        if (permission === 'denied') {
            return {
                icon: BellOff,
                color: 'text-red-500',
                bgColor: 'bg-red-50',
                label: 'Notifications blocked'
            };
        }

        if (permission === 'default') {
            return {
                icon: Bell,
                color: 'text-yellow-500',
                bgColor: 'bg-yellow-50',
                label: 'Enable notifications'
            };
        }

        // Permission granted - check connection
        if (connectionStatus === 'disconnected' || connectionStatus === 'unknown') {
            return {
                icon: WifiOff,
                color: 'text-orange-500',
                bgColor: 'bg-orange-50',
                label: 'Disconnected - tap to reconnect'
            };
        }

        return {
            icon: BellRing,
            color: 'text-green-500',
            bgColor: 'bg-green-50',
            label: 'Connected & receiving updates'
        };
    };

    const status = getStatusInfo();
    const Icon = status.icon;

    const handleClick = () => {
        if (permission === 'default') {
            handleEnableNotifications();
        } else if (permission === 'denied') {
            toast.warning('Notifications are blocked. Please enable them in your browser settings, then refresh the page.');
        } else if (connectionStatus === 'disconnected' || connectionStatus === 'unknown') {
            handleReconnect();
        } else {
            handleTestNotification();
        }
    };

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleClick}
                        onDoubleClick={handleShowDiagnostics}
                        disabled={isReconnecting}
                        className={`${status.bgColor} ${status.color} hover:opacity-80 p-2 rounded-full relative`}
                    >
                        {isReconnecting ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                            <>
                                <Icon className="h-4 w-4" />
                                {connectionStatus === 'SUBSCRIBED' && (
                                    <span className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                                )}
                            </>
                        )}
                    </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                    <p className="text-xs">{status.label}</p>
                    <p className="text-xs text-gray-400">Tap to test • Double-tap for diagnostics</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
