
import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GoodsMovement, AppUser } from '@/types';
import { LOCATIONS, TRANSPORT_METHODS } from '@/lib/constants';
import { formatDateTime12hr } from '@/lib/utils';
import { Pencil, Trash2, Image, Type, Truck, Bike, Footprints, Clock, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { WhatsAppShareDialog } from '@/components/WhatsAppShareDialog';
import { getWhatsAppSettings, WhatsAppSettings } from '@/services/whatsappService';
import { DeliveryTimeline } from './DeliveryTimeline';
import { DispatchHistoryFilters, DispatchFilters } from './DispatchHistoryFilters';
import { startOfDay, endOfDay } from 'date-fns';

interface DispatchHistoryProps {
  movements: GoodsMovement[];
  currentUser: AppUser;
  onEdit: (movement: GoodsMovement) => void;
  onDelete: (movementId: string) => void;
  staff: { id: string; name: string }[];
}

export function DispatchHistory({ movements, currentUser, onEdit, onDelete, staff }: DispatchHistoryProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [shareMovement, setShareMovement] = useState<GoodsMovement | null>(null);
  const [shareFormat, setShareFormat] = useState<'image' | 'text'>('image');
  const [whatsAppSettings, setWhatsAppSettings] = useState<WhatsAppSettings | null>(null);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [filters, setFilters] = useState<DispatchFilters>({
    itemType: 'all',
    source: 'all',
    destination: 'all',
  });

  // Filter: only dispatched (not received), visible to dispatching user or admin
  const accessFilteredMovements = useMemo(() => {
    return movements.filter(m => {
      if (m.status !== 'dispatched') return false;
      if (currentUser.role === 'admin') return true;
      if ((m as any).created_by_user === currentUser.id) return true;
      const roleLocationMap: Record<string, string> = {
        godown_manager: 'godown',
        big_shop_manager: 'big_shop',
        small_shop_manager: 'small_shop',
      };
      const userLocation = roleLocationMap[currentUser.role];
      if (userLocation && m.source === userLocation) return true;
      return false;
    });
  }, [movements, currentUser]);

  // Apply user filters
  const filteredMovements = useMemo(() => {
    return accessFilteredMovements.filter(m => {
      // Date filter
      if (filters.dateFrom) {
        const dispatchDate = new Date(m.dispatch_date);
        if (dispatchDate < startOfDay(filters.dateFrom)) return false;
      }
      if (filters.dateTo) {
        const dispatchDate = new Date(m.dispatch_date);
        if (dispatchDate > endOfDay(filters.dateTo)) return false;
      }
      // Item type filter
      if (filters.itemType !== 'all' && m.item !== filters.itemType) return false;
      // Source filter
      if (filters.source !== 'all' && (m.source || 'godown') !== filters.source) return false;
      // Destination filter
      if (filters.destination !== 'all' && m.destination !== filters.destination) return false;
      return true;
    });
  }, [accessFilteredMovements, filters]);

  if (accessFilteredMovements.length === 0) return null;

  const canEditDelete = (m: GoodsMovement) => {
    if (m.status === 'received') return false;
    if (currentUser.role === 'admin') return true;
    if ((m as any).created_by_user === currentUser.id) return true;
    const roleLocationMap: Record<string, string> = {
      godown_manager: 'godown',
      big_shop_manager: 'big_shop',
      small_shop_manager: 'small_shop',
    };
    const userLocation = roleLocationMap[currentUser.role];
    if (userLocation && m.source === userLocation) return true;
    return false;
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const { error } = await supabase
        .from('goods_movements')
        .delete()
        .eq('id', deleteId);

      if (error) {
        toast.error('Failed to delete: ' + error.message);
      } else {
        toast.success('Dispatch record deleted');
        onDelete(deleteId);
      }
    } catch {
      toast.error('Failed to delete record');
    } finally {
      setDeleteId(null);
    }
  };

  const handleShare = async (movement: GoodsMovement, format: 'image' | 'text') => {
    const settings = await getWhatsAppSettings();
    setWhatsAppSettings({
      ...settings,
      whatsapp_enabled: true,
      whatsapp_share_format: format,
    });
    setShareMovement(movement);
    setShareFormat(format);
    setShowShareDialog(true);
  };

  return (
    <>
      <Card className="backdrop-blur-sm bg-white/80 border-white/40 shadow-xl mt-4">
        <CardContent className="p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-gradient-to-br from-amber-400 to-orange-500 p-2 rounded-lg shadow-md">
              <Clock className="h-4 w-4 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800">Recent Dispatches</h3>
              <p className="text-xs text-muted-foreground">Edit or delete before goods are received</p>
            </div>
          </div>

          {/* Filters */}
          <div className="mb-4">
            <DispatchHistoryFilters filters={filters} onFiltersChange={setFilters} />
          </div>

          {filteredMovements.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">No dispatches match the selected filters</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredMovements.map((m) => {
                return (
                  <div
                    key={m.id}
                    className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <DeliveryTimeline movement={m} />

                    {/* Action buttons */}
                    {canEditDelete(m) && (
                      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 h-9 text-xs font-medium text-blue-700 border-blue-200 hover:bg-blue-50 transition-colors"
                          onClick={() => onEdit(m)}
                        >
                          <Pencil className="h-3 w-3 mr-1" /> Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 h-9 text-xs font-medium text-red-700 border-red-200 hover:bg-red-50 transition-colors"
                          onClick={() => setDeleteId(m.id)}
                        >
                          <Trash2 className="h-3 w-3 mr-1" /> Delete
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-9 text-xs text-green-700 border-green-200 hover:bg-green-50 px-2.5 transition-colors"
                          onClick={() => handleShare(m, 'image')}
                          title="Share as Image"
                        >
                          <Image className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-9 text-xs text-green-700 border-green-200 hover:bg-green-50 px-2.5 transition-colors"
                          onClick={() => handleShare(m, 'text')}
                          title="Share as Text"
                        >
                          <Type className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Dispatch Record?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this dispatch record. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* WhatsApp Share Dialog */}
      {whatsAppSettings && shareMovement && (
        <WhatsAppShareDialog
          open={showShareDialog}
          onClose={() => {
            setShowShareDialog(false);
            setShareMovement(null);
          }}
          settings={whatsAppSettings}
          dispatchData={{
            item: shareMovement.item,
            bundles_count: shareMovement.bundles_count,
            movement_type: shareMovement.movement_type || 'bundles',
            source: shareMovement.source || 'godown',
            destination: shareMovement.destination,
            transport_method: shareMovement.transport_method || 'auto',
            auto_name: shareMovement.auto_name,
            sent_by_name: shareMovement.sent_by_name || 'Unknown',
            accompanying_person: shareMovement.accompanying_person,
            dispatch_notes: shareMovement.dispatch_notes || shareMovement.condition_notes,
            fare_display_msg: shareMovement.fare_display_msg,
            shirt_bundles: shareMovement.shirt_bundles,
            pant_bundles: shareMovement.pant_bundles,
          }}
        />
      )}
    </>
  );
}
