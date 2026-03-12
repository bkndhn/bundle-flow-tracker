import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Staff, GoodsMovement } from '@/types';
import { LOCATIONS, TRANSPORT_METHODS } from '@/lib/constants';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { formatDateTime12hr } from '@/lib/utils';
import { Truck, Bike, Footprints, Package, Inbox, CheckCircle } from 'lucide-react';
import { DeliveryTimeline } from './dispatch/DeliveryTimeline';

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
  const [formData, setFormData] = useState({
    received_by: user?.linked_staff_id || '',
    condition_notes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get the destination that this user can receive at
  const getUserDestination = (): 'godown' | 'big_shop' | 'small_shop' | null => {
    switch (user?.role) {
      case 'godown_manager': return 'godown';
      case 'big_shop_manager': return 'big_shop';
      case 'small_shop_manager': return 'small_shop';
      case 'admin': return null; // Admin sees all
      default: return null;
    }
  };

  const userDestination = getUserDestination();

  // Filter pending movements: only show movements destined for this user's location
  const filteredPendingMovements = userDestination
    ? pendingMovements.filter(m => m.destination === userDestination)
    : pendingMovements; // Admin sees all

  const movement = filteredPendingMovements.find(m => m.id === selectedMovement);

  // Filter staff based on user's location for receiving
  const getFilteredStaff = () => {
    const activeStaff = staff.filter(s => s.is_active !== false);
    if (user?.role === 'godown_manager') {
      return activeStaff.filter(s => s.location === 'godown');
    } else if (user?.role === 'small_shop_manager') {
      return activeStaff.filter(s => s.location === 'small_shop');
    } else if (user?.role === 'big_shop_manager') {
      return activeStaff.filter(s => s.location === 'big_shop');
    } else {
      return activeStaff;
    }
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

      // Reset form
      setSelectedMovement('');
      setFormData({
        received_by: user?.linked_staff_id || '',
        condition_notes: '',
      });

      // Toast notification is handled by the parent component (Index.tsx)
    } catch (error) {
      toast.error('Failed to confirm receipt');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4 space-y-6">
      {/* Pending Movements List */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2 rounded-lg shadow-md">
            <Inbox className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Pending Receipts</h2>
            <p className="text-xs text-muted-foreground">
              {filteredPendingMovements.length} shipment{filteredPendingMovements.length !== 1 ? 's' : ''} awaiting receipt
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {filteredPendingMovements.length === 0 ? (
            <Card className="backdrop-blur-sm bg-white/70 border-white/30">
              <CardContent className="py-12">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 mb-4">
                    <Package className="h-8 w-8 text-emerald-600" />
                  </div>
                  <p className="text-gray-700 font-semibold text-lg">All Caught Up!</p>
                  <p className="text-muted-foreground text-sm mt-1">No pending shipments to receive</p>
                </div>
              </CardContent>
            </Card>
          ) : filteredPendingMovements.map((m) => (
            <Card
              key={m.id}
              className={`cursor-pointer transition-all duration-200 backdrop-blur-sm border ${
                selectedMovement === m.id
                  ? 'ring-2 ring-blue-400 bg-blue-50/80 border-blue-200 shadow-lg shadow-blue-100'
                  : 'bg-white/70 border-white/30 hover:bg-white/90 hover:shadow-md'
              }`}
              onClick={() => setSelectedMovement(m.id)}
            >
              <CardContent className="p-4">
                <DeliveryTimeline movement={m} />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Receive Form */}
      {selectedMovement && movement && (
        <Card className="backdrop-blur-sm bg-white/90 border-blue-200 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-gray-800 flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-emerald-600" />
              Confirm Receipt
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Receipt Time (Auto-filled) */}
              <div className="space-y-2">
                <Label className="text-gray-700">Receipt Date & Time</Label>
                <Input
                  value={formatDateTime12hr(new Date().toISOString())}
                  disabled
                  className="bg-gray-50/60"
                />
              </div>

              {/* Received By */}
              <div className="space-y-2">
                <Label className="text-gray-700">Received By *</Label>
                <Select
                  value={formData.received_by}
                  onValueChange={(value) => setFormData({ ...formData, received_by: value })}
                >
                  <SelectTrigger className="bg-white/90">
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

              {/* Receive Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes" className="text-gray-700">Receive Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Any notes about the received goods condition..."
                  value={formData.condition_notes}
                  onChange={(e) => setFormData({ ...formData, condition_notes: e.target.value })}
                  rows={3}
                  className="bg-white/90"
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-lg shadow-emerald-200 transition-all"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Confirming Receipt...' : '✓ Confirm Receipt'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Need to import CheckCircle for the confirm receipt section
import { CheckCircle } from 'lucide-react';
