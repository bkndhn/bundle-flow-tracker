import { memo } from 'react';
import { WifiOff, RefreshCw, CloudOff, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface OfflineIndicatorProps {
  isOffline: boolean;
  pendingCount: { dispatches: number; receives: number };
  isSyncing: boolean;
  onSyncNow: () => void;
}

export const OfflineIndicator = memo(function OfflineIndicator({
  isOffline,
  pendingCount,
  isSyncing,
  onSyncNow,
}: OfflineIndicatorProps) {
  const totalPending = pendingCount.dispatches + pendingCount.receives;
  
  // Don't show if online and no pending items
  if (!isOffline && totalPending === 0 && !isSyncing) {
    return null;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={onSyncNow}
            disabled={isSyncing || isOffline}
            className={`
              relative p-2 rounded-full transition-all
              ${isOffline 
                ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                : totalPending > 0 
                  ? 'bg-amber-100 text-amber-600 hover:bg-amber-200'
                  : 'bg-green-100 text-green-600 hover:bg-green-200'
              }
            `}
          >
            {isSyncing ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : isOffline ? (
              <WifiOff className="h-4 w-4" />
            ) : totalPending > 0 ? (
              <CloudOff className="h-4 w-4" />
            ) : (
              <Check className="h-4 w-4" />
            )}
            
            {/* Pending count badge */}
            {totalPending > 0 && (
              <Badge 
                className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px] bg-red-500 text-white"
              >
                {totalPending}
              </Badge>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <div className="text-xs space-y-1">
            {isOffline ? (
              <p className="font-medium text-red-600">📡 Offline Mode</p>
            ) : isSyncing ? (
              <p className="font-medium text-blue-600">🔄 Syncing...</p>
            ) : totalPending > 0 ? (
              <p className="font-medium text-amber-600">⏳ Pending Sync</p>
            ) : (
              <p className="font-medium text-green-600">✅ All Synced</p>
            )}
            
            {totalPending > 0 && (
              <div className="text-gray-500">
                <p>• {pendingCount.dispatches} dispatches pending</p>
                <p>• {pendingCount.receives} receives pending</p>
              </div>
            )}
            
            {!isOffline && totalPending > 0 && (
              <p className="text-blue-500">Tap to sync now</p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
});
