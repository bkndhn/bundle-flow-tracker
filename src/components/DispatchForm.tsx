
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Staff, GoodsMovement } from '@/types';
import { toast } from 'sonner';

interface DispatchFormProps {
  staff: Staff[];
  onDispatch: (movement: Omit<GoodsMovement, 'id' | 'created_at' | 'updated_at'>) => void;
}

interface BothDestinationData {
  big_shop: {
    shirt: string;
    pant: string;
  };
  small_shop: {
    shirt: string;
    pant: string;
  };
}

export function DispatchForm({ staff, onDispatch }: DispatchFormProps) {
  const [formData, setFormData] = useState({
    destination: '',
    item: '',
    bundles_count: '',
    shirt_bundles: '',
    pant_bundles: '',
    sent_by: '',
    fare_payment: 'paid_by_sender',
    accompanying_person: '',
    auto_name: '',
    notes: '',
  });

  const [bothDestinationData, setBothDestinationData] = useState<BothDestinationData>({
    big_shop: { shirt: '', pant: '' },
    small_shop: { shirt: '', pant: '' }
  });

  const [showBothDialog, setShowBothDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const godownStaff = staff.filter(s => s.location === 'godown');

  const handleDestinationChange = (value: string) => {
    setFormData({ 
      ...formData, 
      destination: value,
      item: '',
      bundles_count: '',
      shirt_bundles: '',
      pant_bundles: ''
    });
    setShowBothDialog(value === 'both');
  };

  const handleItemChange = (value: string) => {
    setFormData({ 
      ...formData, 
      item: value,
      bundles_count: '',
      shirt_bundles: '',
      pant_bundles: ''
    });
  };

  const calculateTotalBundles = () => {
    if (formData.item === 'both') {
      const shirtCount = parseInt(formData.shirt_bundles) || 0;
      const pantCount = parseInt(formData.pant_bundles) || 0;
      return shirtCount + pantCount;
    }
    return parseInt(formData.bundles_count) || 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (formData.destination === 'both') {
        // Handle "Both" destination - create separate records
        const movements = [];
        
        // Big Shop movements
        if (parseInt(bothDestinationData.big_shop.shirt) > 0) {
          movements.push(createMovement('big_shop', 'shirt', bothDestinationData.big_shop.shirt));
        }
        if (parseInt(bothDestinationData.big_shop.pant) > 0) {
          movements.push(createMovement('big_shop', 'pant', bothDestinationData.big_shop.pant));
        }
        
        // Small Shop movements
        if (parseInt(bothDestinationData.small_shop.shirt) > 0) {
          movements.push(createMovement('small_shop', 'shirt', bothDestinationData.small_shop.shirt));
        }
        if (parseInt(bothDestinationData.small_shop.pant) > 0) {
          movements.push(createMovement('small_shop', 'pant', bothDestinationData.small_shop.pant));
        }

        if (movements.length === 0) {
          toast.error('Please enter at least one bundle count');
          return;
        }

        // Dispatch all movements
        for (const movement of movements) {
          onDispatch(movement);
        }
      } else {
        // Handle single destination
        if (formData.item === 'both') {
          // Create separate records for shirt and pant
          const shirtCount = parseInt(formData.shirt_bundles);
          const pantCount = parseInt(formData.pant_bundles);
          
          if (shirtCount > 0) {
            onDispatch(createMovement(formData.destination as 'big_shop' | 'small_shop', 'shirt', formData.shirt_bundles));
          }
          if (pantCount > 0) {
            onDispatch(createMovement(formData.destination as 'big_shop' | 'small_shop', 'pant', formData.pant_bundles));
          }
        } else {
          // Single item dispatch
          if (!formData.bundles_count) {
            toast.error('Please enter number of bundles');
            return;
          }
          onDispatch(createMovement(formData.destination as 'big_shop' | 'small_shop', formData.item as 'shirt' | 'pant', formData.bundles_count));
        }
      }
      
      // Reset form
      setFormData({
        destination: '',
        item: '',
        bundles_count: '',
        shirt_bundles: '',
        pant_bundles: '',
        sent_by: '',
        fare_payment: 'paid_by_sender',
        accompanying_person: '',
        auto_name: '',
        notes: '',
      });
      setBothDestinationData({
        big_shop: { shirt: '', pant: '' },
        small_shop: { shirt: '', pant: '' }
      });
      setShowBothDialog(false);

      toast.success('Goods dispatched successfully!');
    } catch (error) {
      toast.error('Failed to dispatch goods');
    } finally {
      setIsSubmitting(false);
    }
  };

  const createMovement = (dest: 'big_shop' | 'small_shop', itemType: 'shirt' | 'pant', bundleCount: string): Omit<GoodsMovement, 'id' | 'created_at' | 'updated_at'> => {
    if (!formData.sent_by || !formData.accompanying_person || !formData.auto_name) {
      throw new Error('Please fill in all required fields');
    }

    const selectedStaff = staff.find(s => s.id === formData.sent_by);
    
    return {
      dispatch_date: new Date().toISOString(),
      bundles_count: parseInt(bundleCount),
      item: itemType,
      destination: dest,
      sent_by: formData.sent_by,
      sent_by_name: selectedStaff?.name,
      fare_payment: formData.fare_payment as 'paid_by_sender' | 'to_be_paid_by_receiver',
      accompanying_person: formData.accompanying_person,
      auto_name: formData.auto_name,
      status: 'dispatched',
      condition_notes: formData.notes || undefined,
    };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4">
      <Card className="backdrop-blur-sm bg-white/80 border-white/40 shadow-xl">
        <CardHeader>
          <CardTitle className="text-gray-800 text-xl font-bold">
            Dispatch Goods
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 1. Date & Time (Auto-filled) */}
            <div className="space-y-2">
              <Label className="text-gray-700">Dispatch Date & Time</Label>
              <Input 
                value={new Date().toLocaleString()} 
                disabled 
                className="bg-gray-50/60"
              />
            </div>

            {/* 2. Destination */}
            <div className="space-y-2">
              <Label className="text-gray-700">Destination *</Label>
              <Select
                value={formData.destination}
                onValueChange={handleDestinationChange}
              >
                <SelectTrigger className="bg-white/90">
                  <SelectValue placeholder="Select destination" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small_shop">Small Shop</SelectItem>
                  <SelectItem value="big_shop">Big Shop</SelectItem>
                  <SelectItem value="both">Both</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 3. Item */}
            {formData.destination && formData.destination !== 'both' && (
              <div className="space-y-2">
                <Label className="text-gray-700">Item *</Label>
                <Select
                  value={formData.item}
                  onValueChange={handleItemChange}
                >
                  <SelectTrigger className="bg-white/90">
                    <SelectValue placeholder="Select item type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="shirt">Shirt</SelectItem>
                    <SelectItem value="pant">Pant</SelectItem>
                    <SelectItem value="both">Both</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* 4. Number of Bundles - Conditional rendering */}
            {formData.destination && formData.destination !== 'both' && (
              <>
                {formData.item === 'both' ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-gray-700">Shirt Bundles *</Label>
                        <Input
                          type="number"
                          placeholder="Enter shirt bundles"
                          value={formData.shirt_bundles}
                          onChange={(e) => setFormData({ ...formData, shirt_bundles: e.target.value })}
                          className="bg-white/90"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-gray-700">Pant Bundles *</Label>
                        <Input
                          type="number"
                          placeholder="Enter pant bundles"
                          value={formData.pant_bundles}
                          onChange={(e) => setFormData({ ...formData, pant_bundles: e.target.value })}
                          className="bg-white/90"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-gray-700">Total Bundles</Label>
                      <Input
                        value={calculateTotalBundles()}
                        disabled
                        className="bg-gray-50/60"
                      />
                    </div>
                  </div>
                ) : formData.item && (
                  <div className="space-y-2">
                    <Label className="text-gray-700">Number of Bundles *</Label>
                    <Input
                      type="number"
                      placeholder="Enter number of bundles"
                      value={formData.bundles_count}
                      onChange={(e) => setFormData({ ...formData, bundles_count: e.target.value })}
                      className="bg-white/90"
                    />
                  </div>
                )}
              </>
            )}

            {/* Both Destination Dialog */}
            {showBothDialog && (
              <div className="space-y-4 p-4 border rounded-lg bg-blue-50/50">
                <Label className="text-gray-700 font-semibold">Distribution for Both Shops</Label>
                <div className="grid grid-cols-3 gap-4">
                  <div className="font-medium text-center">Item</div>
                  <div className="font-medium text-center">Big Shop</div>
                  <div className="font-medium text-center">Small Shop</div>
                  
                  <div className="flex items-center">Shirt</div>
                  <Input
                    type="number"
                    placeholder="0"
                    value={bothDestinationData.big_shop.shirt}
                    onChange={(e) => setBothDestinationData({
                      ...bothDestinationData,
                      big_shop: { ...bothDestinationData.big_shop, shirt: e.target.value }
                    })}
                    className="bg-white/90"
                  />
                  <Input
                    type="number"
                    placeholder="0"
                    value={bothDestinationData.small_shop.shirt}
                    onChange={(e) => setBothDestinationData({
                      ...bothDestinationData,
                      small_shop: { ...bothDestinationData.small_shop, shirt: e.target.value }
                    })}
                    className="bg-white/90"
                  />
                  
                  <div className="flex items-center">Pant</div>
                  <Input
                    type="number"
                    placeholder="0"
                    value={bothDestinationData.big_shop.pant}
                    onChange={(e) => setBothDestinationData({
                      ...bothDestinationData,
                      big_shop: { ...bothDestinationData.big_shop, pant: e.target.value }
                    })}
                    className="bg-white/90"
                  />
                  <Input
                    type="number"
                    placeholder="0"
                    value={bothDestinationData.small_shop.pant}
                    onChange={(e) => setBothDestinationData({
                      ...bothDestinationData,
                      small_shop: { ...bothDestinationData.small_shop, pant: e.target.value }
                    })}
                    className="bg-white/90"
                  />
                </div>
              </div>
            )}

            {/* 5. Sent By */}
            <div className="space-y-2">
              <Label className="text-gray-700">Sent By *</Label>
              <Select
                value={formData.sent_by}
                onValueChange={(value) => setFormData({ ...formData, sent_by: value })}
              >
                <SelectTrigger className="bg-white/90">
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

            {/* 6. Auto Fare Payment */}
            <div className="space-y-3">
              <Label className="text-gray-700">Auto Fare Payment</Label>
              <RadioGroup
                value={formData.fare_payment}
                onValueChange={(value) => setFormData({ ...formData, fare_payment: value })}
                className="grid grid-cols-1 gap-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="paid_by_sender" id="paid_sender" />
                  <Label htmlFor="paid_sender" className="text-gray-700 text-sm">
                    Paid by Sender
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="to_be_paid_by_receiver" id="paid_receiver" />
                  <Label htmlFor="paid_receiver" className="text-gray-700 text-sm">
                    To Be Paid by Receiver
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* 7. Person Accompanying Auto */}
            <div className="space-y-2">
              <Label htmlFor="accompanying" className="text-gray-700">Person Accompanying Auto *</Label>
              <Input
                id="accompanying"
                placeholder="Enter name of person accompanying"
                value={formData.accompanying_person}
                onChange={(e) => setFormData({ ...formData, accompanying_person: e.target.value })}
                required
                className="bg-white/90"
              />
            </div>

            {/* 8. Auto Name */}
            <div className="space-y-2">
              <Label htmlFor="auto_name" className="text-gray-700">Auto Name *</Label>
              <Input
                id="auto_name"
                placeholder="Enter vehicle name/type"
                value={formData.auto_name}
                onChange={(e) => setFormData({ ...formData, auto_name: e.target.value })}
                required
                className="bg-white/90"
              />
            </div>

            {/* 9. Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes" className="text-gray-700">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Any additional notes or instructions..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                className="bg-white/90"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700" 
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
