import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { GoodsMovement, Staff } from '@/types';
import { BothDestinationDialog } from '@/components/dispatch/BothDestinationDialog';

interface DispatchFormProps {
  staff: Staff[];
  onDispatch: (movement: Omit<GoodsMovement, 'id' | 'created_at' | 'updated_at'>) => void;
}

interface BothDestinationData {
  big_shop: { shirt: string; pant: string };
  small_shop: { shirt: string; pant: string };
}

export function DispatchForm({ staff, onDispatch }: DispatchFormProps) {
  const [timestamp] = useState(new Date().toISOString());
  const [destination, setDestination] = useState<'big_shop' | 'small_shop' | 'both' | ''>('');
  const [item, setItem] = useState<'shirt' | 'pant' | 'both' | ''>('');
  const [shirtBundles, setShirtBundles] = useState('');
  const [pantBundles, setPantBundles] = useState('');
  const [totalBundles, setTotalBundles] = useState('');
  const [farePayment, setFarePayment] = useState<'paid_by_sender' | 'to_be_paid_by_big_shop' | 'to_be_paid_by_small_shop' | ''>('');
  const [accompanyingPerson, setAccompanyingPerson] = useState('');
  const [autoName, setAutoName] = useState('');
  const [notes, setNotes] = useState('');
  const [showBothDialog, setShowBothDialog] = useState(false);
  const [bothDestinationData, setBothDestinationData] = useState<BothDestinationData>({
    big_shop: { shirt: '', pant: '' },
    small_shop: { shirt: '', pant: '' }
  });

  // Get godown staff for sent_by field
  const godownStaff = staff.filter(s => s.location === 'godown');

  // Calculate total bundles when individual counts change
  useEffect(() => {
    if (item === 'both') {
      const shirt = parseInt(shirtBundles) || 0;
      const pant = parseInt(pantBundles) || 0;
      setTotalBundles((shirt + pant).toString());
    } else {
      setTotalBundles('');
    }
  }, [shirtBundles, pantBundles, item]);

  // Reset form fields when destination or item changes (business logic)
  useEffect(() => {
    if (destination === 'both') {
      setItem('');
      setShirtBundles('');
      setPantBundles('');
      setTotalBundles('');
    }
  }, [destination]);

  useEffect(() => {
    if (item !== 'both') {
      setShirtBundles('');
      setPantBundles('');
      setTotalBundles('');
    }
  }, [item]);

  const validateForm = () => {
    if (!destination) {
      toast.error('Please select a destination');
      return false;
    }
    if (!item && destination !== 'both') {
      toast.error('Please select an item type');
      return false;
    }
    if (destination !== 'both' && item !== 'both' && !totalBundles) {
      toast.error('Please enter number of bundles');
      return false;
    }
    if (destination !== 'both' && item === 'both' && (!shirtBundles || !pantBundles)) {
      toast.error('Please enter both shirt and pant bundles');
      return false;
    }
    if (!farePayment) {
      toast.error('Please select fare payment option');
      return false;
    }
    if (!accompanyingPerson) {
      toast.error('Please enter accompanying person name');
      return false;
    }
    if (!autoName) {
      toast.error('Please enter auto name');
      return false;
    }
    return true;
  };

  const handleDispatch = () => {
    if (!validateForm()) return;

    if (destination === 'both') {
      setShowBothDialog(true);
      return;
    }

    // Create movement data
    const movementData: Omit<GoodsMovement, 'id' | 'created_at' | 'updated_at'> = {
      dispatch_date: timestamp,
      destination: destination as 'big_shop' | 'small_shop',
      item: item as 'shirt' | 'pant' | 'both',
      bundles_count: item === 'both' ? parseInt(totalBundles) : parseInt(totalBundles),
      ...(item === 'both' && {
        shirt_bundles: parseInt(shirtBundles),
        pant_bundles: parseInt(pantBundles)
      }),
      sent_by: godownStaff[0]?.id || '', // Use first godown staff
      sent_by_name: godownStaff[0]?.name || '',
      fare_payment: farePayment as 'paid_by_sender' | 'to_be_paid_by_big_shop' | 'to_be_paid_by_small_shop',
      accompanying_person: accompanyingPerson,
      auto_name: autoName,
      condition_notes: notes || undefined,
      status: 'dispatched'
    };

    onDispatch(movementData);
    resetForm();
  };

  const handleBothDestinationSubmit = () => {
    // Create two separate dispatches for both shops
    const bigShopShirt = parseInt(bothDestinationData.big_shop.shirt) || 0;
    const bigShopPant = parseInt(bothDestinationData.big_shop.pant) || 0;
    const smallShopShirt = parseInt(bothDestinationData.small_shop.shirt) || 0;
    const smallShopPant = parseInt(bothDestinationData.small_shop.pant) || 0;

    if (bigShopShirt + bigShopPant > 0) {
      const bigShopMovement: Omit<GoodsMovement, 'id' | 'created_at' | 'updated_at'> = {
        dispatch_date: timestamp,
        destination: 'big_shop',
        item: 'both',
        bundles_count: bigShopShirt + bigShopPant,
        shirt_bundles: bigShopShirt,
        pant_bundles: bigShopPant,
        sent_by: godownStaff[0]?.id || '',
        sent_by_name: godownStaff[0]?.name || '',
        fare_payment: farePayment as 'paid_by_sender' | 'to_be_paid_by_big_shop' | 'to_be_paid_by_small_shop',
        accompanying_person: accompanyingPerson,
        auto_name: autoName,
        condition_notes: notes || undefined,
        status: 'dispatched'
      };
      onDispatch(bigShopMovement);
    }

    if (smallShopShirt + smallShopPant > 0) {
      const smallShopMovement: Omit<GoodsMovement, 'id' | 'created_at' | 'updated_at'> = {
        dispatch_date: timestamp,
        destination: 'small_shop',
        item: 'both',
        bundles_count: smallShopShirt + smallShopPant,
        shirt_bundles: smallShopShirt,
        pant_bundles: smallShopPant,
        sent_by: godownStaff[0]?.id || '',
        sent_by_name: godownStaff[0]?.name || '',
        fare_payment: farePayment as 'paid_by_sender' | 'to_be_paid_by_big_shop' | 'to_be_paid_by_small_shop',
        accompanying_person: accompanyingPerson,
        auto_name: autoName,
        condition_notes: notes || undefined,
        status: 'dispatched'
      };
      onDispatch(smallShopMovement);
    }

    setShowBothDialog(false);
    resetForm();
  };

  const resetForm = () => {
    setDestination('');
    setItem('');
    setShirtBundles('');
    setPantBundles('');
    setTotalBundles('');
    setFarePayment('');
    setAccompanyingPerson('');
    setAutoName('');
    setNotes('');
    setBothDestinationData({
      big_shop: { shirt: '', pant: '' },
      small_shop: { shirt: '', pant: '' }
    });
  };

  return (
    <div className="max-w-md mx-auto p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-bold text-center">Dispatch Goods</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Timestamp - Auto filled */}
          <div>
            <Label>Timestamp</Label>
            <Input 
              value={new Date(timestamp).toLocaleString()} 
              disabled 
              className="bg-gray-100"
            />
          </div>

          {/* Destination Dropdown */}
          <div>
            <Label>Destination *</Label>
            <Select value={destination} onValueChange={(value: any) => setDestination(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select destination" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="big_shop">Big Shop</SelectItem>
                <SelectItem value="small_shop">Small Shop</SelectItem>
                <SelectItem value="both">Both</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Item Type - Show only if destination is not 'both' */}
          {destination && destination !== 'both' && (
            <div>
              <Label>Item *</Label>
              <Select value={item} onValueChange={(value: any) => setItem(value)}>
                <SelectTrigger>
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

          {/* Bundle Inputs - Show based on item selection */}
          {destination && destination !== 'both' && item && (
            <div className="space-y-2">
              {item === 'both' ? (
                <>
                  <div>
                    <Label>Shirt Bundles *</Label>
                    <Input 
                      type="number" 
                      value={shirtBundles}
                      onChange={(e) => setShirtBundles(e.target.value)}
                      placeholder="Enter shirt bundles"
                      min="0"
                    />
                  </div>
                  <div>
                    <Label>Pant Bundles *</Label>
                    <Input 
                      type="number" 
                      value={pantBundles}
                      onChange={(e) => setPantBundles(e.target.value)}
                      placeholder="Enter pant bundles"
                      min="0"
                    />
                  </div>
                  <div>
                    <Label>Total Bundles</Label>
                    <Input 
                      value={totalBundles}
                      disabled 
                      className="bg-gray-100"
                    />
                  </div>
                </>
              ) : (
                <div>
                  <Label>Number of Bundles *</Label>
                  <Input 
                    type="number" 
                    value={totalBundles}
                    onChange={(e) => setTotalBundles(e.target.value)}
                    placeholder="Enter number of bundles"
                    min="0"
                  />
                </div>
              )}
            </div>
          )}

          {/* Fare Payment */}
          <div>
            <Label>Auto Fare *</Label>
            <Select value={farePayment} onValueChange={(value: any) => setFarePayment(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select fare payment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="paid_by_sender">Paid by Sender</SelectItem>
                <SelectItem value="to_be_paid_by_big_shop">To be paid by Big Shop</SelectItem>
                <SelectItem value="to_be_paid_by_small_shop">To be paid by Small Shop</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Accompanying Person */}
          <div>
            <Label>Accompanying Person with Auto *</Label>
            <Input 
              value={accompanyingPerson}
              onChange={(e) => setAccompanyingPerson(e.target.value)}
              placeholder="Enter person name"
            />
          </div>

          {/* Auto Name */}
          <div>
            <Label>Auto Name *</Label>
            <Input 
              value={autoName}
              onChange={(e) => setAutoName(e.target.value)}
              placeholder="Enter auto name"
            />
          </div>

          {/* Notes */}
          <div>
            <Label>Notes</Label>
            <Textarea 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Enter any notes"
              rows={3}
            />
          </div>

          {/* Dispatch Button */}
          <Button 
            onClick={handleDispatch} 
            className="w-full bg-blue-600 hover:bg-blue-700"
            disabled={!destination}
          >
            Dispatch Goods
          </Button>
        </CardContent>
      </Card>

      {/* Both Destination Dialog */}
      <BothDestinationDialog
        open={showBothDialog}
        bothDestinationData={bothDestinationData}
        onDataChange={setBothDestinationData}
        onSubmit={handleBothDestinationSubmit}
        onCancel={() => setShowBothDialog(false)}
        grandTotalRow={
          <div className="grid grid-cols-3 gap-4 items-center border-t-2 border-gray-300 pt-2 font-semibold">
            <div>TOTAL</div>
            <div className="text-center bg-blue-100 p-2 rounded">
              {(parseInt(bothDestinationData.big_shop.shirt) || 0) + (parseInt(bothDestinationData.big_shop.pant) || 0)}
            </div>
            <div className="text-center bg-green-100 p-2 rounded">
              {(parseInt(bothDestinationData.small_shop.shirt) || 0) + (parseInt(bothDestinationData.small_shop.pant) || 0)}
            </div>
          </div>
        }
      />
    </div>
  );
}
