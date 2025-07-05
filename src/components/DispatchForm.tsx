
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Staff, GoodsMovement } from '@/types';
import { toast } from 'sonner';

interface DispatchFormProps {
  staff: Staff[];
  onDispatch: (movement: Omit<GoodsMovement, 'id' | 'created_at' | 'updated_at'>) => void;
}

export function DispatchForm({ staff, onDispatch }: DispatchFormProps) {
  const [formData, setFormData] = useState({
    bundles_count: '',
    item: '',
    destination: '',
    sent_by: '',
    fare_payment: 'paid_by_sender',
    accompanying_person: '',
    auto_name: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const godownStaff = staff.filter(s => s.location === 'godown');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (!formData.bundles_count || !formData.item || !formData.destination || !formData.sent_by || !formData.accompanying_person || !formData.auto_name) {
        toast.error('Please fill in all required fields');
        return;
      }

      const selectedStaff = staff.find(s => s.id === formData.sent_by);
      
      const movement: Omit<GoodsMovement, 'id' | 'created_at' | 'updated_at'> = {
        dispatch_date: new Date().toISOString(),
        bundles_count: parseInt(formData.bundles_count),
        item: formData.item as 'shirt' | 'pant',
        destination: formData.destination as 'big_shop' | 'small_shop',
        sent_by: formData.sent_by,
        sent_by_name: selectedStaff?.name,
        fare_payment: formData.fare_payment as 'paid_by_sender' | 'to_be_paid_by_receiver',
        accompanying_person: formData.accompanying_person,
        auto_name: formData.auto_name,
        status: 'dispatched',
      };

      onDispatch(movement);
      
      // Reset form
      setFormData({
        bundles_count: '',
        item: '',
        destination: '',
        sent_by: '',
        fare_payment: 'paid_by_sender',
        accompanying_person: '',
        auto_name: '',
      });

      toast.success('Goods dispatched successfully!');
    } catch (error) {
      toast.error('Failed to dispatch goods');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 p-4">
      <Card className="backdrop-blur-xl bg-white/10 border-white/20 shadow-2xl">
        <CardHeader>
          <CardTitle className="text-white text-xl font-bold">
            Dispatch Goods
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Date & Time (Auto-filled) */}
            <div className="space-y-2">
              <Label className="text-white">Dispatch Date & Time</Label>
              <Input 
                value={new Date().toLocaleString()} 
                disabled 
                className="bg-white/10 border-white/20 text-white"
              />
            </div>

            {/* Number of Bundles */}
            <div className="space-y-2">
              <Label htmlFor="bundles" className="text-white">Number of Bundles *</Label>
              <Input
                id="bundles"
                type="number"
                placeholder="Enter number of bundles"
                value={formData.bundles_count}
                onChange={(e) => setFormData({ ...formData, bundles_count: e.target.value })}
                required
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
              />
            </div>

            {/* Item Dropdown */}
            <div className="space-y-2">
              <Label className="text-white">Item (Shirt/Pant) *</Label>
              <Select
                value={formData.item}
                onValueChange={(value) => setFormData({ ...formData, item: value })}
              >
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue placeholder="Select item type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="shirt">Shirt</SelectItem>
                  <SelectItem value="pant">Pant</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Destination */}
            <div className="space-y-2">
              <Label className="text-white">Destination *</Label>
              <Select
                value={formData.destination}
                onValueChange={(value) => setFormData({ ...formData, destination: value })}
              >
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
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
              <Label className="text-white">Sent By *</Label>
              <Select
                value={formData.sent_by}
                onValueChange={(value) => setFormData({ ...formData, sent_by: value })}
              >
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
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
              <Label className="text-white">Auto Fare Payment</Label>
              <RadioGroup
                value={formData.fare_payment}
                onValueChange={(value) => setFormData({ ...formData, fare_payment: value })}
                className="grid grid-cols-1 gap-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="paid_by_sender" id="paid_sender" />
                  <Label htmlFor="paid_sender" className="text-white text-sm">
                    Paid by Sender
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="to_be_paid_by_receiver" id="paid_receiver" />
                  <Label htmlFor="paid_receiver" className="text-white text-sm">
                    To Be Paid by Receiver
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Person Accompanying Auto - Required */}
            <div className="space-y-2">
              <Label htmlFor="accompanying" className="text-white">Person Accompanying Auto *</Label>
              <Input
                id="accompanying"
                placeholder="Enter name of person accompanying"
                value={formData.accompanying_person}
                onChange={(e) => setFormData({ ...formData, accompanying_person: e.target.value })}
                required
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
              />
            </div>

            {/* Auto Name */}
            <div className="space-y-2">
              <Label htmlFor="auto_name" className="text-white">Auto Name *</Label>
              <Input
                id="auto_name"
                placeholder="Enter vehicle name/type"
                value={formData.auto_name}
                onChange={(e) => setFormData({ ...formData, auto_name: e.target.value })}
                required
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700" 
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
