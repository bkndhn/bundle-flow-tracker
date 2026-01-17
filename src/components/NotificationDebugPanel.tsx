import { useState, useEffect, memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Bug, Bell, BellOff, Wifi, WifiOff, RefreshCw, CheckCircle, 
  XCircle, AlertTriangle, Send, Trash2, Info
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  getNotificationPermission, 
  getConnectionStatus, 
  sendTestNotification, 
  forceReconnect,
  getNotificationDiagnostics,
  initializeNotifications,
  isNotificationSupported
} from '@/services/notificationService';
import { formatDateTime12hr } from '@/lib/utils';

interface NotificationDebugPanelProps {
  userRole?: string;
  userId?: string;
}

interface LogEntry {
  id: string;
  timestamp: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
}

export const NotificationDebugPanel = memo(function NotificationDebugPanel({ 
  userRole, 
  userId 
}: NotificationDebugPanelProps) {
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [connectionStatus, setConnectionStatus] = useState<string>('unknown');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [diagnostics, setDiagnostics] = useState<any>(null);

  const addLog = (type: LogEntry['type'], message: string) => {
    const entry: LogEntry = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      type,
      message
    };
    setLogs(prev => [entry, ...prev].slice(0, 50)); // Keep last 50 entries
  };

  const refreshStatus = async () => {
    setIsRefreshing(true);
    try {
      setPermission(getNotificationPermission());
      setConnectionStatus(getConnectionStatus());
      
      const diag = await getNotificationDiagnostics();
      setDiagnostics(diag);
      addLog('info', 'Status refreshed successfully');
    } catch (error) {
      addLog('error', `Failed to refresh status: ${error}`);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    refreshStatus();
    
    // Poll connection status every 5 seconds
    const interval = setInterval(() => {
      setConnectionStatus(getConnectionStatus());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleRequestPermission = async () => {
    try {
      addLog('info', 'Requesting notification permission...');
      const success = await initializeNotifications();
      setPermission(getNotificationPermission());
      
      if (success) {
        addLog('success', 'Notification permission granted!');
        toast.success('Notifications enabled!');
      } else {
        addLog('warning', 'Permission denied or not supported');
        toast.error('Could not enable notifications');
      }
    } catch (error) {
      addLog('error', `Permission request failed: ${error}`);
    }
  };

  const handleTestNotification = async () => {
    try {
      addLog('info', 'Sending test notification...');
      const success = await sendTestNotification();
      
      if (success) {
        addLog('success', 'Test notification sent!');
      } else {
        addLog('warning', 'Test notification may not have been delivered');
      }
    } catch (error) {
      addLog('error', `Test notification failed: ${error}`);
    }
  };

  const handleReconnect = async () => {
    if (!userRole || !userId) {
      addLog('warning', 'Cannot reconnect: missing user role or ID');
      toast.error('Missing user information for reconnect');
      return;
    }

    try {
      addLog('info', 'Forcing reconnection to realtime channel...');
      const success = await forceReconnect(userRole, userId);
      setConnectionStatus(getConnectionStatus());
      
      if (success) {
        addLog('success', 'Reconnected successfully!');
        toast.success('Reconnected to notification service');
      } else {
        addLog('warning', 'Reconnection may have failed');
      }
    } catch (error) {
      addLog('error', `Reconnection failed: ${error}`);
    }
  };

  const handleClearLogs = () => {
    setLogs([]);
    addLog('info', 'Logs cleared');
  };

  const getPermissionBadge = () => {
    const variants: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
      granted: { icon: <CheckCircle className="h-3 w-3" />, color: 'bg-green-100 text-green-700', label: 'Granted' },
      denied: { icon: <XCircle className="h-3 w-3" />, color: 'bg-red-100 text-red-700', label: 'Denied' },
      default: { icon: <AlertTriangle className="h-3 w-3" />, color: 'bg-yellow-100 text-yellow-700', label: 'Not Asked' },
      unsupported: { icon: <BellOff className="h-3 w-3" />, color: 'bg-gray-100 text-gray-700', label: 'Unsupported' },
    };
    const v = variants[permission] || variants.default;
    return (
      <Badge className={`${v.color} flex items-center gap-1`}>
        {v.icon} {v.label}
      </Badge>
    );
  };

  const getConnectionBadge = () => {
    const isConnected = connectionStatus === 'SUBSCRIBED';
    return (
      <Badge className={`flex items-center gap-1 ${isConnected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
        {isConnected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
        {connectionStatus}
      </Badge>
    );
  };

  const getLogIcon = (type: LogEntry['type']) => {
    switch (type) {
      case 'success': return <CheckCircle className="h-3 w-3 text-green-500" />;
      case 'warning': return <AlertTriangle className="h-3 w-3 text-yellow-500" />;
      case 'error': return <XCircle className="h-3 w-3 text-red-500" />;
      default: return <Info className="h-3 w-3 text-blue-500" />;
    }
  };

  return (
    <Card className="backdrop-blur-sm bg-white/90 border-white/40 shadow-xl">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Bug className="h-5 w-5 text-purple-600" />
          Notification Debug Panel
        </CardTitle>
        <CardDescription>
          Test and troubleshoot realtime notifications between devices
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Section */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="text-xs font-medium text-gray-500">Push Permission</p>
            {getPermissionBadge()}
          </div>
          <div className="space-y-2">
            <p className="text-xs font-medium text-gray-500">Realtime Connection</p>
            {getConnectionBadge()}
          </div>
        </div>

        {/* Diagnostics Info */}
        {diagnostics && (
          <div className="bg-gray-50 rounded-lg p-3 space-y-1 text-xs">
            <p><span className="font-medium">Supported:</span> {diagnostics.supported ? 'Yes' : 'No'}</p>
            <p><span className="font-medium">Service Worker:</span> {diagnostics.serviceWorkerReady ? 'Ready' : 'Not Ready'}</p>
            <p><span className="font-medium">Mobile:</span> {diagnostics.isMobile ? 'Yes' : 'No'}</p>
            <p className="truncate"><span className="font-medium">User Agent:</span> {diagnostics.userAgent}</p>
          </div>
        )}

        {/* User Info */}
        <div className="bg-blue-50 rounded-lg p-3 text-xs">
          <p><span className="font-medium">Role:</span> {userRole || 'Unknown'}</p>
          <p><span className="font-medium">User ID:</span> {userId ? `${userId.substring(0, 8)}...` : 'Unknown'}</p>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRequestPermission}
            className="flex items-center gap-1"
            disabled={permission === 'granted'}
          >
            <Bell className="h-3 w-3" />
            Enable Push
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleTestNotification}
            className="flex items-center gap-1"
          >
            <Send className="h-3 w-3" />
            Test Notification
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleReconnect}
            className="flex items-center gap-1"
            disabled={!userRole || !userId}
          >
            <RefreshCw className="h-3 w-3" />
            Force Reconnect
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={refreshStatus}
            className="flex items-center gap-1"
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh Status
          </Button>
        </div>

        {/* Debug Logs */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-gray-500">Debug Logs</p>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleClearLogs}
              className="h-6 px-2 text-xs"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Clear
            </Button>
          </div>
          <ScrollArea className="h-40 rounded-md border bg-gray-50/50">
            <div className="p-2 space-y-1">
              {logs.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4">No logs yet</p>
              ) : (
                logs.map(log => (
                  <div key={log.id} className="flex items-start gap-2 text-xs">
                    {getLogIcon(log.type)}
                    <div className="flex-1 min-w-0">
                      <span className="text-gray-400">
                        {formatDateTime12hr(log.timestamp).split(' ').slice(1).join(' ')}
                      </span>
                      <span className="mx-1">-</span>
                      <span className="text-gray-700">{log.message}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Instructions */}
        <div className="bg-amber-50 rounded-lg p-3 text-xs text-amber-700">
          <p className="font-medium mb-1">Testing Instructions:</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Ensure "Push Permission" is Granted</li>
            <li>Check "Realtime Connection" shows SUBSCRIBED</li>
            <li>Dispatch from another device/browser</li>
            <li>Watch logs for incoming notification events</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
});
