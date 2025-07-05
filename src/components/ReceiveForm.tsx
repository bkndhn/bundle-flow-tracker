
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
  const [selectedMovement, setSelectedMovement] = useState<string>('');
  const [formData, setFormData] = useState({
    received_by: '',
    condition_notes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const movement = pendingMovements.find(m => m.id === selectedMovement);
  const shopStaff = staff.filter(s => 
    s.location === 'big_shop' || s.location === 'small_shop'
  );

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

      toast.success('Goods received successfully!');
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
          {pendingMovements.map((movement) => (
            <Card 
              key={movement.id}
              className={`cursor-pointer transition-colors backdrop-blur-sm bg-white/70 border-white/30 ${
                selectedMovement === movement.id ? 'ring-2 ring-blue-400 bg-blue-50/60' : ''
              }`}
              onClick={() => setSelectedMovement(movement.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <Badge variant="secondary" className="bg-yellow-100/80 text-yellow-800">Dispatched</Badge>
                      <span className="text-sm font-medium">
                        {movement.bundles_count} bundles
                      </span>
                      <Badge variant="outline" className="capitalize bg-white/60">
                        {movement.item}
                      </Badge>
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
                  <strong>Item:</strong> <span className="capitalize">{movement.item}</span>
                </p>
                <p className="text-sm text-gray-700">
                  <strong>Bundles:</strong> {movement.bundles_count}
                </p>
                <p className="text-sm text-gray-700">
                  <strong>Auto Name:</strong> {movement.auto_name || 'Not specified'}
                </p>
                <p className="text-sm text-gray-700">
                  <strong>Destination:</strong> {LOCATIONS[movement.destination]}
                </p>
                <p className="text-sm text-gray-700">
                  <strong>Sent by:</strong> {movement.sent_by_name}
                </p>
                <p className="text-sm text-gray-700">
                  <strong>Fare:</strong> {movement.fare_payment === 'paid_by_sender' ? 'Paid by Sender' : 'To Be Paid by Receiver'}
                </p>
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
                    {shopStaff.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.name} ({LOCATIONS[member.location]})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Condition/Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Condition / Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Any notes about the condition of goods or delivery..."
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

      {pendingMovements.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-600">No pending receipts at the moment</p>
        </div>
      )}
    </div>
  );
}
