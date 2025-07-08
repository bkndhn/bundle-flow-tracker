import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Staff, GoodsMovement } from '@/types';
import { FARE_PAYMENT_OPTIONS } from '@/lib/constants';
import { toast } from 'sonner';
import { DestinationSelector } from './dispatch/DestinationSelector';
import { ItemSelector } from './dispatch/ItemSelector';
import { BundleInputs } from './dispatch/BundleInputs';
import { BothDestinationDialog } from './dispatch/BothDestinationDialog';

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

  const [isSubmitting, setIsSubmitting] = useState(false);

  const godownStaff = staff.filter(s => s.location === 'godown');
  const showBothDialog = formData.destination === 'both';

  const calculateTotalBundles = (data: BothDestinationData) => {
    const bigShirtCount = parseInt(data.big_shop.shirt) || 0;
    const bigPantCount = parseInt(data.big_shop.pant) || 0;
    const smallShirtCount = parseInt(data.small_shop.shirt) || 0;
    const smallPantCount = parseInt(data.small_shop.pant) || 0;
    const bigTotal = bigShirtCount + bigPantCount;
    const smallTotal = smallShirtCount + smallPantCount;
    return { bigTotal, smallTotal };
  };

  const generateFareDisplayMsg = (farePayment: string) => {
    switch (farePayment) {
      case 'paid_by_sender':
        return 'Fare: Paid by Sender';
      case 'to_be_paid_by_small_shop':
        return 'Fare to be paid by Small Shop';
      case 'to_be_paid_by_big_shop':
        return 'Fare to be paid by Big Shop';
      default:
        return '';
    }
  };

  const generateFarePayeeTag = (farePayment: string) => {
    switch (farePayment) {
      case 'paid_by_sender':
        return 'Sender';
      case 'to_be_paid_by_small_shop':
        return 'Small Shop';
      case 'to_be_paid_by_big_shop':
        return 'Big Shop';
      default:
        return '';
    }
  };

  const handleDestinationChange = (value: string) => {
    setFormData({ 
      ...formData, 
      destination: value,
      item: '',
      bundles_count: '',
      shirt_bundles: '',
      pant_bundles: ''
    });
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

  const handleInputChange = (shop: 'big_shop' | 'small_shop', type: 'shirt' | 'pant', value: string) => {
    setBothDestinationData(prevData => ({
      ...prevData,
      [shop]: {
        ...prevData[shop],
        [type]: value
      }
    }));
  };

  const createBaseMovement = (destination: 'big_shop' | 'small_shop', totalBundles: number): Omit<GoodsMovement, 'id' | 'created_at' | 'updated_at'> => {
    if (!formData.sent_by || !formData.accompanying_person || !formData.auto_name) {
      throw new Error('Please fill in all required fields');
    }

    const selectedStaff = staff.find(s => s.id === formData.sent_by);

    return {
      dispatch_date: new Date().toISOString(),
      bundles_count: totalBundles,
      item: 'shirt',
      destination,
      sent_by: formData.sent_by,
      sent_by_name: selectedStaff?.name,
      fare_payment: formData.fare_payment as 'paid_by_sender' | 'to_be_paid_by_small_shop' | 'to_be_paid_by_big_shop',
      fare_display_msg: generateFareDisplayMsg(formData.fare_payment),
      fare_payee_tag: generateFarePayeeTag(formData.fare_payment),
      accompanying_person: formData.accompanying_person,
      auto_name: formData.auto_name,
      status: 'dispatched',
      condition_notes: formData.notes || undefined,
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (formData.destination === 'both') {
        // Handle "Both" destination - create one record per destination
        const { bigTotal, smallTotal } = calculateTotalBundles(bothDestinationData);
        if (bigTotal === 0 && smallTotal === 0) {
          toast.error('Please enter at least one bundle count');
          return;
        }

        // Dispatch big shop if bundles > 0
        if (bigTotal > 0) {
          const bigMovement = createBaseMovement('big_shop', bigTotal);
          onDispatch({ ...bigMovement, item: 'both' });
        }

        // Dispatch small shop if bundles > 0
        if (smallTotal > 0) {
          const smallMovement = createBaseMovement('small_shop', smallTotal);
          onDispatch({ ...smallMovement, item: 'both' });
        }
      } else {
        // Handle single destination dispatch logic here
        if (!formData.bundles_count) {
          toast.error('Please enter number of bundles');
          return;
        }
        onDispatch(createBaseMovement(formData.destination as 'big_shop' | 'small_shop', parseInt(formData.bundles_count)));
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

      toast.success('Goods dispatched successfully!');
    } catch (error) {
      toast.error('Failed to dispatch goods');
    } finally {
      setIsSubmitting(false);
    }
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
            {/* 1. Date & Time */}
            <div className="space-y-2">
              <Label className="text-gray-700">Dispatch Date & Time</Label>
              <Input 
                value={new Date().toLocaleString()} 
                disabled 
                className="bg-gray-50/60"
              />
            </div>

            {/* 2. Destination */}
            <DestinationSelector 
              value={formData.destination}
              onChange={handleDestinationChange}
            />

            {/* 3. Item */}
            <ItemSelector 
              value={formData.item}
              onChange={handleItemChange}
              destination={formData.destination}
            />

            {/* 4. Bundle Inputs */}
            <BundleInputs 
              destination={formData.destination}
              item={formData.item}
              bundlesCount={formData.bundles_count}
              shirtBundles={formData.shirt_bundles}
              pantBundles={formData.pant_bundles}
              onBundlesCountChange={(value) => setFormData({ ...formData, bundles_count: value })}
              onShirtBundlesChange={(value) => setFormData({ ...formData, shirt_bundles: value })}
              onPantBundlesChange={(value) => setFormData({ ...formData, pant_bundles: value })}
            />

            {/* Both Destination Dialog */}
            {showBothDialog && (
              <BothDestinationDialog
                bigShopData={bothDestinationData.big_shop}
                smallShopData={bothDestinationData.small_shop}
                onInputChange={handleInputChange}
                totals={calculateTotalBundles(bothDestinationData)}
              />
            )}

            {/* 5. Other Form Fields */}
            <div className="space-y-2">
              <Label className="text-gray-700">Sent By</Label>
              <Select value={formData.sent_by} onValueChange={(value) => setFormData({ ...formData, sent_by: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select staff" />
                </SelectTrigger>
                <SelectContent>
                  {godownStaff.map(staffMember => (
                    <SelectItem key={staffMember.id} value={staffMember.id}>
                      {staffMember.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? 'Processing...' : 'Dispatch Goods'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
