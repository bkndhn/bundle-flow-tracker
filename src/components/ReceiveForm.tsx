import { useState } from 'react';
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
    received_by: '',
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
    if (user?.role === 'godown_manager') {
      return staff.filter(s => s.location === 'godown');
    } else if (user?.role === 'small_shop_manager') {
      return staff.filter(s => s.location === 'small_shop');
    } else if (user?.role === 'big_shop_manager') {
      return staff.filter(s => s.location === 'big_shop');
    } else {
      // Admin sees all staff
      return staff;
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
        received_by: '',
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
    <div className="p-4 space-y-6">
      {/* Pending Movements List */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Pending Receipts</h2>
        <div className="space-y-3">
          {filteredPendingMovements.length === 0 ? (
            <div className="text-center py-8 bg-gray-50/50 rounded-lg border border-gray-100">
              <div className="text-gray-400 mb-2">
                <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <p className="text-gray-500 font-medium">No Pending Receipts</p>
              <p className="text-gray-400 text-sm mt-1">All shipments have been received</p>
            </div>
          ) : filteredPendingMovements.map((movement) => (
            <Card
              key={movement.id}
              className={`cursor-pointer transition-colors backdrop-blur-sm bg-white/70 border-white/30 ${selectedMovement === movement.id ? 'ring-2 ring-blue-400 bg-blue-50/60' : ''
                }`}
              onClick={() => setSelectedMovement(movement.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <Badge variant="secondary" className="bg-yellow-100/80 text-yellow-800">Dispatched</Badge>
                      <span className="text-sm font-medium">
                        {movement.bundles_count} {movement.movement_type === 'pieces' ? 'pieces' : 'bundles'}
                      </span>
                      {movement.item === 'both' ? (
                        <Badge variant="outline" className="bg-white/60">
                          {movement.item_summary_display || 'Both Items'}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="capitalize bg-white/60">
                          {movement.item}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">
                      To {LOCATIONS[movement.destination]}
                    </p>
                    <p className="text-xs text-gray-500">
                      Sent: {new Date(movement.dispatch_date).toLocaleString()}
                    </p>
                    {movement.auto_name && (
                      <p className="text-xs text-green-600">
                        Auto: {movement.auto_name}
                      </p>
                    )}
                    {movement.accompanying_person && (
                      <p className="text-xs text-blue-600">
                        Accompanied by: {movement.accompanying_person}
                      </p>
                    )}
                    {movement.fare_display_msg && (
                      <p className="text-xs text-purple-600">
                        {movement.fare_display_msg}
                      </p>
                    )}
                    {movement.condition_notes && (
                      <p className="text-xs text-gray-600">
                        Notes: {movement.condition_notes}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{movement.sent_by_name}</p>
                    <p className="text-xs text-gray-500">Sent by</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Receive Form */}
      {selectedMovement && movement && (
        <Card className="backdrop-blur-sm bg-white/80 border-white/40">
          <CardHeader>
            <CardTitle className="text-gray-800">Confirm Receipt</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Receipt Time (Auto-filled) */}
              <div className="space-y-2">
                <Label>Receipt Date & Time</Label>
                <Input
                  value={new Date().toLocaleString()}
                  disabled
                  className="bg-gray-50/60"
                />
              </div>

              {/* Movement Details */}
              <div className="bg-gray-50/60 p-4 rounded-md space-y-2 backdrop-blur-sm">
                <h3 className="font-medium text-gray-900">Movement Details</h3>
                <p className="text-sm text-gray-700">
                  <strong>Item:</strong> {movement.item === 'both' ? movement.item_summary_display : <span className="capitalize">{movement.item}</span>}
                </p>
                <p className="text-sm text-gray-700">
                  <strong>{movement.movement_type === 'pieces' ? 'Pieces' : 'Bundles'}:</strong> {movement.bundles_count}
                </p>
                <p className="text-sm text-gray-700">
                  <strong>Auto Name:</strong> {movement.auto_name || 'Not specified'}
                </p>
                <p className="text-sm text-gray-700">
                  <strong>From:</strong> {LOCATIONS[movement.source] || 'Godown'}
                </p>
                <p className="text-sm text-gray-700">
                  <strong>To:</strong> {LOCATIONS[movement.destination]}
                </p>
                <p className="text-sm text-gray-700">
                  <strong>Sent by:</strong> {movement.sent_by_name}
                </p>
                <p className="text-sm text-gray-700">
                  <strong>Fare:</strong> {movement.fare_display_msg || 'Not specified'}
                </p>
                {(movement.dispatch_notes || movement.condition_notes) && (
                  <p className="text-sm text-gray-700">
                    <strong>Dispatch Notes:</strong> {movement.dispatch_notes || movement.condition_notes}
                  </p>
                )}
              </div>

              {/* Received By */}
              <div className="space-y-2">
                <Label>Received By *</Label>
                <Select
                  value={formData.received_by}
                  onValueChange={(value) => setFormData({ ...formData, received_by: value })}
                >
                  <SelectTrigger className="bg-white/80">
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
                <Label htmlFor="notes">Receive Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Any notes about the received goods condition..."
                  value={formData.condition_notes}
                  onChange={(e) => setFormData({ ...formData, condition_notes: e.target.value })}
                  rows={3}
                  className="bg-white/80"
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Confirming Receipt...' : 'Confirm Receipt'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {pendingMovements.length === 0 && filteredPendingMovements.length === 0 && null}
    </div>
  );
}
