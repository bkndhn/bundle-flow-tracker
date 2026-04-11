import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Staff, GoodsMovement } from '@/types';
import { LOCATIONS } from '@/lib/constants';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { formatDateTime12hr } from '@/lib/utils';
import { Package, Inbox, CheckCircle, QrCode } from 'lucide-react';
import { DeliveryTimeline } from './dispatch/DeliveryTimeline';
import { QRScanner } from './dispatch/QRScanner';

interface ReceiveFormProps {
  staff: Staff[];
  pendingMovements: GoodsMovement[];
  onReceive: (movementId: string, receiveData: {
    received_at: string;
    received_by: string;
    received_by_name: string;
    condition_notes?: string;
  }) => void;
}

export function ReceiveForm({ staff, pendingMovements, onReceive }: ReceiveFormProps) {
  const { user } = useAuth();
  const [selectedMovement, setSelectedMovement] = useState<string>('');
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [formData, setFormData] = useState({
    received_by: user?.linked_staff_id || '',
    condition_notes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const confirmRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to confirm receipt section when a movement is selected
  useEffect(() => {
    if (selectedMovement && confirmRef.current) {
      setTimeout(() => {
        confirmRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [selectedMovement]);

  const getUserDestination = (): 'godown' | 'big_shop' | 'small_shop' | null => {
    switch (user?.role) {
      case 'godown_manager': return 'godown';
      case 'big_shop_manager': return 'big_shop';
      case 'small_shop_manager': return 'small_shop';
      case 'admin': return null;
      default: return null;
    }
  };

  const userDestination = getUserDestination();

  const filteredPendingMovements = userDestination
    ? pendingMovements.filter(m => m.destination === userDestination)
    : pendingMovements;

  const movement = filteredPendingMovements.find(m => m.id === selectedMovement);

  const getFilteredStaff = () => {
    const activeStaff = staff.filter(s => s.is_active !== false);
    if (user?.role === 'godown_manager') {
      return activeStaff.filter(s => s.location === 'godown');
    } else if (user?.role === 'small_shop_manager') {
      return activeStaff.filter(s => s.location === 'small_shop');
    } else if (user?.role === 'big_shop_manager') {
      return activeStaff.filter(s => s.location === 'big_shop');
    }
    return activeStaff;
  };

  const filteredStaff = getFilteredStaff();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (!selectedMovement || !formData.received_by) {
        toast.error('Please select a movement and receiving staff member');
        return;
      }

      const selectedStaff = staff.find(s => s.id === formData.received_by);

      const receiveData = {
        received_at: new Date().toISOString(),
        received_by: formData.received_by,
        received_by_name: selectedStaff?.name || '',
        condition_notes: formData.condition_notes || undefined,
      };

      onReceive(selectedMovement, receiveData);

      setSelectedMovement('');
      setFormData({
        received_by: user?.linked_staff_id || '',
        condition_notes: '',
      });
    } catch (error) {
      toast.error('Failed to confirm receipt');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-4 space-y-6">
      {/* QR Scanner */}
      <QRScanner
        open={showQRScanner}
        onClose={() => setShowQRScanner(false)}
        pendingMovements={filteredPendingMovements}
        onMovementFound={(id) => {
          setSelectedMovement(id);
          setShowQRScanner(false);
          toast.success('Dispatch found! Confirm receipt below.');
        }}
      />

      {/* Pending Movements List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2.5 rounded-xl shadow-lg">
              <Inbox className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Pending Receipts</h2>
              <p className="text-xs text-muted-foreground">
                {filteredPendingMovements.length} shipment{filteredPendingMovements.length !== 1 ? 's' : ''} awaiting receipt
              </p>
            </div>
          </div>
          <Button
            onClick={() => setShowQRScanner(true)}
            variant="outline"
            size="sm"
            className="gap-1.5 bg-primary/10 border-primary/30 text-primary hover:bg-primary/20"
          >
            <QrCode className="h-4 w-4" />
            <span className="hidden sm:inline">Scan QR</span>
          </Button>
        </div>

        <div className="space-y-3">
          {filteredPendingMovements.length === 0 ? (
            <Card className="backdrop-blur-sm bg-card/70 border-border/30">
              <CardContent className="py-12">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 mb-4">
                    <Package className="h-8 w-8 text-emerald-600" />
                  </div>
                  <p className="text-foreground font-semibold text-lg">All Caught Up!</p>
                  <p className="text-muted-foreground text-sm mt-1">No pending shipments to receive</p>
                </div>
              </CardContent>
            </Card>
          ) : filteredPendingMovements.map((m) => (
            <Card
              key={m.id}
              className={`cursor-pointer transition-all duration-200 backdrop-blur-sm border ${
                selectedMovement === m.id
                  ? 'ring-2 ring-primary bg-primary/5 border-primary/30 shadow-lg'
                  : 'bg-card/70 border-border/30 hover:bg-card/90 hover:shadow-md'
              }`}
              onClick={() => setSelectedMovement(m.id)}
            >
              <CardContent className="p-4">
                <DeliveryTimeline movement={m} />
                {selectedMovement !== m.id && (
                  <div className="mt-3 pt-3 border-t border-border/20 text-center">
                    <span className="text-xs text-primary font-medium">Tap to confirm receipt →</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Confirm Receipt Form */}
      {selectedMovement && movement && (
        <div ref={confirmRef}>
          <Card className="backdrop-blur-sm bg-card/95 border-primary/20 shadow-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-foreground flex items-center gap-2">
                <div className="bg-emerald-100 p-1.5 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-emerald-600" />
                </div>
                Confirm Receipt
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Confirm receipt of {movement.bundles_count} {movement.movement_type === 'pieces' ? 'pcs' : 'bundles'} from {LOCATIONS[movement.source] || 'Godown'}
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Receipt Time */}
                <div className="space-y-2">
                  <Label className="text-foreground text-sm font-medium">Receipt Date & Time</Label>
                  <Input
                    value={formatDateTime12hr(new Date().toISOString())}
                    disabled
                    className="bg-muted/40 text-muted-foreground"
                  />
                </div>

                {/* Received By */}
                <div className="space-y-2">
                  <Label className="text-foreground text-sm font-medium">Received By *</Label>
                  <Select
                    value={formData.received_by}
                    onValueChange={(value) => setFormData({ ...formData, received_by: value })}
                  >
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Select staff member" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredStaff.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.name} ({LOCATIONS[member.location]})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <Label htmlFor="notes" className="text-foreground text-sm font-medium">Receive Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Any notes about the received goods condition..."
                    value={formData.condition_notes}
                    onChange={(e) => setFormData({ ...formData, condition_notes: e.target.value })}
                    rows={3}
                    className="bg-background"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-lg shadow-emerald-200 transition-all text-white h-12 text-base font-semibold"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Confirming Receipt...' : '✓ Confirm Receipt'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
