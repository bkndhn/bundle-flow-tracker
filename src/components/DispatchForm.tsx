
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Staff, GoodsMovement } from '@/types';
import { LOCATIONS, FARE_PAYMENT_OPTIONS } from '@/lib/constants';
import { toast } from 'sonner';

interface DispatchFormProps {
  staff: Staff[];
  onDispatch: (movement: Omit<GoodsMovement, 'id' | 'created_at' | 'updated_at'>) => void;
}

export function DispatchForm({ staff, onDispatch }: DispatchFormProps) {
  const [formData, setFormData] = useState({
    bundles_count: '',
    destination: '',
    sent_by: '',
    fare_payment: 'paid_by_sender',
    accompanying_person: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const godownStaff = staff.filter(s => s.location === 'godown');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (!formData.bundles_count || !formData.destination || !formData.sent_by) {
        toast.error('Please fill in all required fields');
        return;
      }

      const selectedStaff = staff.find(s => s.id === formData.sent_by);
      
      const movement: Omit<GoodsMovement, 'id' | 'created_at' | 'updated_at'> = {
        dispatch_date: new Date().toISOString(),
        bundles_count: parseInt(formData.bundles_count),
        destination: formData.destination as 'big_shop' | 'small_shop',
        sent_by: formData.sent_by,
        sent_by_name: selectedStaff?.name,
        fare_payment: formData.fare_payment as 'paid_by_sender' | 'to_be_paid_by_receiver',
        accompanying_person: formData.accompanying_person || undefined,
        status: 'dispatched',
      };

      onDispatch(movement);
      
      // Reset form
      setFormData({
        bundles_count: '',
        destination: '',
        sent_by: '',
        fare_payment: 'paid_by_sender',
        accompanying_person: '',
      });

      toast.success('Goods dispatched successfully!');
    } catch (error) {
      toast.error('Failed to dispatch goods');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>Dispatch Goods</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Date & Time (Auto-filled) */}
            <div className="space-y-2">
              <Label>Dispatch Date & Time</Label>
              <Input 
                value={new Date().toLocaleString()} 
                disabled 
                className="bg-gray-50"
              />
            </div>

            {/* Number of Bundles */}
            <div className="space-y-2">
              <Label htmlFor="bundles">Number of Bundles *</Label>
              <Input
                id="bundles"
                type="number"
                placeholder="Enter number of bundles"
                value={formData.bundles_count}
                onChange={(e) => setFormData({ ...formData, bundles_count: e.target.value })}
                required
              />
            </div>

            {/* Destination */}
            <div className="space-y-2">
              <Label>Destination *</Label>
              <Select
                value={formData.destination}
                onValueChange={(value) => setFormData({ ...formData, destination: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select destination" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="big_shop">Big Shop</SelectItem>
                  <SelectItem value="small_shop">Small Shop</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sent By */}
            <div className="space-y-2">
              <Label>Sent By *</Label>
              <Select
                value={formData.sent_by}
                onValueChange={(value) => setFormData({ ...formData, sent_by: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select staff member" />
                </SelectTrigger>
                <SelectContent>
                  {godownStaff.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Fare Payment */}
            <div className="space-y-3">
              <Label>Auto Fare Payment</Label>
              <RadioGroup
                value={formData.fare_payment}
                onValueChange={(value) => setFormData({ ...formData, fare_payment: value })}
                className="grid grid-cols-1 gap-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="paid_by_sender" id="paid_sender" />
                  <Label htmlFor="paid_sender" className="text-sm">
                    Paid by Sender
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="to_be_paid_by_receiver" id="paid_receiver" />
                  <Label htmlFor="paid_receiver" className="text-sm">
                    To Be Paid by Receiver
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Accompanying Person */}
            <div className="space-y-2">
              <Label htmlFor="accompanying">Person Accompanying Auto (Optional)</Label>
              <Input
                id="accompanying"
                placeholder="Enter name if someone is accompanying"
                value={formData.accompanying_person}
                onChange={(e) => setFormData({ ...formData, accompanying_person: e.target.value })}
              />
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Dispatching...' : 'Dispatch Goods'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
