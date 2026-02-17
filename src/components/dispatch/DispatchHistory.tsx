
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GoodsMovement, AppUser } from '@/types';
import { LOCATIONS, TRANSPORT_METHODS } from '@/lib/constants';
import { formatDateTime12hr } from '@/lib/utils';
import { Pencil, Trash2, MessageSquare, Image, Type, Truck, Bike, Footprints } from 'lucide-react';
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

  // Filter: only dispatched (not received), visible to dispatching user or admin
  const filteredMovements = movements.filter(m => {
    if (m.status !== 'dispatched') return false;
    if (currentUser.role === 'admin') return true;
    // Show to user who created it (matched by created_by_user)
    if ((m as any).created_by_user === currentUser.id) return true;
    return false;
  });

  if (filteredMovements.length === 0) return null;

  const canEditDelete = (m: GoodsMovement) => {
    if (m.status === 'received') return false;
    if (currentUser.role === 'admin') return true;
    if ((m as any).created_by_user === currentUser.id) return true;
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

  const getDefaultShareFormat = async (): Promise<'image' | 'text'> => {
    const settings = await getWhatsAppSettings();
    return settings.whatsapp_share_format || 'text';
  };

  const transportIcon = (method: string) => {
    switch (method) {
      case 'auto': return <Truck className="h-3 w-3" />;
      case 'bike': return <Bike className="h-3 w-3" />;
      case 'by_walk': return <Footprints className="h-3 w-3" />;
      default: return <Truck className="h-3 w-3" />;
    }
  };

  return (
    <>
      <Card className="backdrop-blur-sm bg-white/80 border-white/40 shadow-xl mt-4">
        <CardContent className="p-4">
          <h3 className="text-lg font-bold text-gray-800 mb-3">Recent Dispatches</h3>
          <p className="text-xs text-gray-500 mb-4">Edit or delete before goods are received</p>

          <div className="space-y-3">
            {filteredMovements.map((m) => {
              const sentByName = m.sent_by_name || staff.find(s => s.id === m.sent_by)?.name || 'Unknown';
              return (
                <div
                  key={m.id}
                  className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-xs">
                          Dispatched
                        </Badge>
                        <span className="text-sm font-semibold">
                          {m.bundles_count} {m.movement_type === 'pieces' ? 'Pcs' : 'Bundles'}
                        </span>
                        {m.item === 'both' ? (
                          <Badge variant="outline" className="text-xs">
                            {m.item_summary_display || 'Both'}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="capitalize text-xs">{m.item}</Badge>
                        )}
                      </div>
                      <div className="text-xs text-gray-600 space-y-0.5">
                        <p>{LOCATIONS[m.source] || 'Godown'} → {LOCATIONS[m.destination]}</p>
                        <p>Sent by: {sentByName}</p>
                        <p>{formatDateTime12hr(m.dispatch_date)}</p>
                        {m.transport_method && (
                          <div className="flex items-center gap-1">
                            {transportIcon(m.transport_method)}
                            <span>{TRANSPORT_METHODS[m.transport_method] || m.transport_method}</span>
                            {m.auto_name && <span>- {m.auto_name}</span>}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action buttons */}
                  {canEditDelete(m) && (
                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-100">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 h-8 text-xs text-blue-700 border-blue-200 hover:bg-blue-50"
                        onClick={() => onEdit(m)}
                      >
                        <Pencil className="h-3 w-3 mr-1" /> Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 h-8 text-xs text-red-700 border-red-200 hover:bg-red-50"
                        onClick={() => setDeleteId(m.id)}
                      >
                        <Trash2 className="h-3 w-3 mr-1" /> Delete
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs text-green-700 border-green-200 hover:bg-green-50 px-2"
                        onClick={() => handleShare(m, 'image')}
                        title="Share as Image"
                      >
                        <Image className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs text-green-700 border-green-200 hover:bg-green-50 px-2"
                        onClick={() => handleShare(m, 'text')}
                        title="Share as Text"
                      >
                        <Type className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
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
