
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Staff, GoodsMovement } from '@/types';
import { LOCATIONS } from '@/lib/constants';
import { ItemSelector } from './dispatch/ItemSelector';
import { DestinationSelector } from './dispatch/DestinationSelector';
import { BundleInputs } from './dispatch/BundleInputs';
import { BothDestinationDialog } from './dispatch/BothDestinationDialog';
import { GrandTotalRow } from './dispatch/GrandTotalRow';
import { DispatchList } from './dispatch/DispatchList';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface DispatchFormProps {
  staff: Staff[];
  onDispatch: (movement: Omit<GoodsMovement, 'id' | 'created_at' | 'updated_at'>) => void;
}

export function DispatchForm({ staff, onDispatch }: DispatchFormProps) {
  const [formData, setFormData] = useState({
    item: 'shirt' as 'shirt' | 'pant' | 'both',
    destination: 'big_shop' as 'big_shop' | 'small_shop' | 'both',
    bundles_count: '',
    sent_by: '',
    fare_payment: 'paid_by_sender' as 'paid_by_sender' | 'to_be_paid_by_small_shop' | 'to_be_paid_by_big_shop',
    accompanying_person: '',
    auto_name: '',
    notes: '',
  });

  const [bothDestinationData, setBothDestinationData] = useState({
    big_shop: { shirt: '', pant: '' },
    small_shop: { shirt: '', pant: '' },
  });

  const [showBothDialog, setShowBothDialog] = useState(false);
  const [movements, setMovements] = useState<GoodsMovement[]>([]);

  // Load movements for edit/delete functionality
  const loadMovements = async () => {
    try {
      const { data, error } = await supabase
        .from('goods_movements')
        .select('*')
        .order('dispatch_date', { ascending: false });
      
      if (error) throw error;
      
      const transformedMovements: GoodsMovement[] = data?.map(movement => ({
        id: movement.id,
        dispatch_date: movement.dispatch_date,
        bundles_count: movement.bundles_count,
        item: movement.item as 'shirt' | 'pant' | 'both',
        shirt_bundles: movement.shirt_bundles || undefined,
        pant_bundles: movement.pant_bundles || undefined,
        destination: movement.destination,
        sent_by: movement.sent_by,
        sent_by_name: '',
        fare_payment: movement.fare_payment as 'paid_by_sender' | 'to_be_paid_by_small_shop' | 'to_be_paid_by_big_shop',
        fare_display_msg: movement.fare_display_msg || undefined,
        fare_payee_tag: movement.fare_payee_tag || undefined,
        item_summary_display: movement.item_summary_display || undefined,
        accompanying_person: movement.accompanying_person || '',
        auto_name: movement.auto_name,
        received_at: movement.received_at || undefined,
        received_by: movement.received_by || undefined,
        received_by_name: '',
        condition_notes: movement.condition_notes || undefined,
        status: movement.status,
        created_at: movement.created_at || '',
        updated_at: movement.updated_at || '',
        last_edited_at: movement.last_edited_at || undefined,
        last_edited_by: movement.last_edited_by || undefined,
        is_editable: movement.is_editable || true,
      })) || [];
      
      setMovements(transformedMovements);
    } catch (error) {
      console.error('Error loading movements:', error);
    }
  };

  const handleUpdateMovement = async (movementId: string, updates: any) => {
    try {
      const { error } = await supabase
        .from('goods_movements')
        .update({
          ...updates,
          last_edited_at: new Date().toISOString(),
          last_edited_by: 'admin@goods.com'
        })
        .eq('id', movementId);
      
      if (error) throw error;
      
      await loadMovements(); // Refresh the list
      toast.success('Dispatch updated successfully');
    } catch (error) {
      console.error('Error updating movement:', error);
      toast.error('Failed to update dispatch');
    }
  };

  const handleDeleteMovement = async (movementId: string) => {
    if (!confirm('Are you sure you want to delete this dispatch?')) return;
    
    try {
      const { error } = await supabase
        .from('goods_movements')
        .delete()
        .eq('id', movementId);
      
      if (error) throw error;
      
      await loadMovements(); // Refresh the list
      toast.success('Dispatch deleted successfully');
    } catch (error) {
      console.error('Error deleting movement:', error);
      toast.error('Failed to delete dispatch');
    }
  };

  // Load movements on component mount
  useEffect(() => {
    loadMovements();
  }, []);

  const generateFareDisplayMsg = (farePayment: string) => {
    switch (farePayment) {
      case 'paid_by_sender': return 'Fare paid by sender';
      case 'to_be_paid_by_small_shop': return 'Fare to be paid by small shop';
      case 'to_be_paid_by_big_shop': return 'Fare to be paid by big shop';
      default: return '';
    }
  };

  const generateFarePayeeTag = (farePayment: string) => {
    switch (farePayment) {
      case 'to_be_paid_by_small_shop': return 'Small Shop';
      case 'to_be_paid_by_big_shop': return 'Big Shop';
      default: return '';
    }
  };

  const generateItemSummaryDisplay = (item: string, shirt: string, pant: string, total: number) => {
    if (item === 'both') {
      return `Shirt - ${shirt}, Pant - ${pant}, Total - ${total}`;
    }
    return '';
  };

  const createBaseMovement = (destination: 'big_shop' | 'small_shop', totalBundles: number): Omit<GoodsMovement, 'id' | 'created_at' | 'updated_at'> => {
    const selectedStaff = staff.find(s => s.id === formData.sent_by);

    return {
      dispatch_date: new Date().toISOString(),
      bundles_count: totalBundles,
      item: 'both',
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

  const createMovement = (destination: 'big_shop' | 'small_shop', item: 'shirt' | 'pant', bundleCount: string): Omit<GoodsMovement, 'id' | 'created_at' | 'updated_at'> => {
    const selectedStaff = staff.find(s => s.id === formData.sent_by);
    const bundles = parseInt(bundleCount);

    return {
      dispatch_date: new Date().toISOString(),
      bundles_count: bundles,
      item,
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

    if (!formData.sent_by || !formData.auto_name) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (formData.destination === 'both') {
      setShowBothDialog(true);
      return;
    }

    if (!formData.bundles_count || parseInt(formData.bundles_count) <= 0) {
      toast.error('Please enter a valid bundle count');
      return;
    }

    const movement = createMovement(formData.destination, formData.item, formData.bundles_count);
    onDispatch(movement);
    
    // Reset form
    setFormData({
      item: 'shirt',
      destination: 'big_shop',
      bundles_count: '',
      sent_by: '',
      fare_payment: 'paid_by_sender',
      accompanying_person: '',
      auto_name: '',
      notes: '',
    });
    
    await loadMovements(); // Refresh the list after dispatch
  };

  const handleBothDestinationSubmit = async () => {
    const movements = [];

    // Big Shop
    const bigShirt = parseInt(bothDestinationData.big_shop.shirt) || 0;
    const bigPant = parseInt(bothDestinationData.big_shop.pant) || 0;
    const bigTotal = bigShirt + bigPant;

    if (bigTotal > 0) {
      movements.push({
        ...createBaseMovement('big_shop', bigTotal),
        shirt_bundles: bigShirt,
        pant_bundles: bigPant,
        item: 'both' as const,
        item_summary_display: generateItemSummaryDisplay('both', String(bigShirt), String(bigPant), bigTotal),
      });
    }

    // Small Shop
    const smallShirt = parseInt(bothDestinationData.small_shop.shirt) || 0;
    const smallPant = parseInt(bothDestinationData.small_shop.pant) || 0;
    const smallTotal = smallShirt + smallPant;

    if (smallTotal > 0) {
      movements.push({
        ...createBaseMovement('small_shop', smallTotal),
        shirt_bundles: smallShirt,
        pant_bundles: smallPant,
        item: 'both' as const,
        item_summary_display: generateItemSummaryDisplay('both', String(smallShirt), String(smallPant), smallTotal),
      });
    }

    if (movements.length === 0) {
      toast.error('Please enter at least one bundle count');
      return;
    }

    for (const movement of movements) {
      onDispatch(movement);
    }
    
    setShowBothDialog(false);
    setBothDestinationData({
      big_shop: { shirt: '', pant: '' },
      small_shop: { shirt: '', pant: '' },
    });
    
    setFormData({
      item: 'shirt',
      destination: 'big_shop',
      bundles_count: '',
      sent_by: '',
      fare_payment: 'paid_by_sender',
      accompanying_person: '',
      auto_name: '',
      notes: '',
    });
    
    await loadMovements(); // Refresh the list after dispatch
  };

  return (
    <div className="p-4 space-y-6">
      <Card className="backdrop-blur-sm bg-white/80 border-white/40">
        <CardHeader>
          <CardTitle className="text-gray-800">Dispatch Goods</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 1. Dispatch Date & Time - Auto generated, display only */}
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
              selectedDestination={formData.destination}
              onDestinationChange={(destination) => setFormData({ ...formData, destination })}
            />

            {/* 3. Item */}
            <ItemSelector
              selectedItem={formData.item}
              onItemChange={(item) => setFormData({ ...formData, item })}
            />

            {/* 4. Number of Bundles */}
            {formData.destination !== 'both' && (
              <BundleInputs
                bundlesCount={formData.bundles_count}
                onBundlesCountChange={(bundles_count) => setFormData({ ...formData, bundles_count })}
              />
            )}

            {/* 5. Sent By */}
            <div className="space-y-2">
              <Label>Sent By *</Label>
              <Select
                value={formData.sent_by}
                onValueChange={(value) => setFormData({ ...formData, sent_by: value })}
              >
                <SelectTrigger className="bg-white/80">
                  <SelectValue placeholder="Select staff member" />
                </SelectTrigger>
                <SelectContent>
                  {staff.filter(s => s.location === 'godown').map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name} ({LOCATIONS[member.location]})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 6. Auto Fare Payment */}
            <div className="space-y-2">
              <Label>Auto Fare Payment *</Label>
              <Select
                value={formData.fare_payment}
                onValueChange={(value) => setFormData({ ...formData, fare_payment: value as 'paid_by_sender' | 'to_be_paid_by_small_shop' | 'to_be_paid_by_big_shop' })}
              >
                <SelectTrigger className="bg-white/80">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="paid_by_sender">Paid by Sender</SelectItem>
                  <SelectItem value="to_be_paid_by_small_shop">To be paid by Small Shop</SelectItem>
                  <SelectItem value="to_be_paid_by_big_shop">To be paid by Big Shop</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 7. Person Accompanying Auto */}
            <div className="space-y-2">
              <Label htmlFor="person">Person Accompanying Auto (Optional)</Label>
              <Input
                id="person"
                placeholder="Enter accompanying person name"
                value={formData.accompanying_person}
                onChange={(e) => setFormData({ ...formData, accompanying_person: e.target.value })}
                className="bg-white/80"
              />
            </div>

            {/* 8. Auto Name */}
            <div className="space-y-2">
              <Label htmlFor="auto">Auto Name *</Label>
              <Input
                id="auto"
                placeholder="Enter auto name"
                value={formData.auto_name}
                onChange={(e) => setFormData({ ...formData, auto_name: e.target.value })}
                required
                className="bg-white/80"
              />
            </div>

            {/* 9. Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Any additional notes..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                className="bg-white/80"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
            >
              Dispatch Goods
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Dispatch List for Admin */}
      <Card className="backdrop-blur-sm bg-white/80 border-white/40">
        <CardHeader>
          <CardTitle className="text-gray-800">Manage Dispatches</CardTitle>
        </CardHeader>
        <CardContent>
          <DispatchList
            movements={movements}
            onUpdate={handleUpdateMovement}
            onDelete={handleDeleteMovement}
          />
        </CardContent>
      </Card>

      <BothDestinationDialog
        open={showBothDialog}
        bothDestinationData={bothDestinationData}
        onDataChange={setBothDestinationData}
        onSubmit={handleBothDestinationSubmit}
        onCancel={() => setShowBothDialog(false)}
        grandTotalRow={
          <GrandTotalRow
            bigShopShirt={parseInt(bothDestinationData.big_shop.shirt) || 0}
            bigShopPant={parseInt(bothDestinationData.big_shop.pant) || 0}
            smallShopShirt={parseInt(bothDestinationData.small_shop.shirt) || 0}
            smallShopPant={parseInt(bothDestinationData.small_shop.pant) || 0}
          />
        }
      />
    </div>
  );
}
