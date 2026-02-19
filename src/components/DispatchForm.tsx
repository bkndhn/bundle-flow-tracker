
import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Staff, GoodsMovement, AppUser } from '@/types';
import { toast } from 'sonner';
import { DestinationSelector } from './dispatch/DestinationSelector';
import { ItemSelector } from './dispatch/ItemSelector';
import { BundleInputs } from './dispatch/BundleInputs';
import { BothDestinationDialog } from './dispatch/BothDestinationDialog';
import { TransportMethodSelector } from './dispatch/TransportMethodSelector';
import { DispatchHistory } from './dispatch/DispatchHistory';
import { formatDateTime12hr } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { X } from 'lucide-react';

interface DispatchFormProps {
  staff: Staff[];
  movements: GoodsMovement[];
  userRole: AppUser['role'];
  onDispatch: (movement: Omit<GoodsMovement, 'id' | 'created_at' | 'updated_at'>) => void;
  onDataRefresh?: () => void;
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

export function DispatchForm({ staff, movements, userRole, onDispatch, onDataRefresh }: DispatchFormProps) {
  const { user } = useAuth();
  const formRef = useRef<HTMLDivElement>(null);

  // Edit mode state
  const [editingMovement, setEditingMovement] = useState<GoodsMovement | null>(null);

  // Determine source and available destinations based on user role
  const getSourceFromRole = (): 'godown' | 'big_shop' | 'small_shop' => {
    switch (userRole) {
      case 'big_shop_manager': return 'big_shop';
      case 'small_shop_manager': return 'small_shop';
      default: return 'godown';
    }
  };

  const getAvailableDestinations = () => {
    switch (userRole) {
      case 'big_shop_manager':
        return [
          { value: 'godown', label: 'Godown' },
          { value: 'small_shop', label: 'Small Shop' }
        ];
      case 'small_shop_manager':
        return [
          { value: 'godown', label: 'Godown' },
          { value: 'big_shop', label: 'Big Shop' }
        ];
      case 'godown_manager':
      case 'admin':
        return [
          { value: 'big_shop', label: 'Big Shop' },
          { value: 'small_shop', label: 'Small Shop' },
          { value: 'both', label: 'Both Shops' }
        ];
      default:
        return [
          { value: 'big_shop', label: 'Big Shop' },
          { value: 'small_shop', label: 'Small Shop' },
          { value: 'both', label: 'Both Shops' }
        ];
    }
  };

  const source = getSourceFromRole();
  const availableDestinations = getAvailableDestinations();

  // Extract unique suggestions from existing movements
  const autoSuggestions = Array.from(new Set(
    movements
      .filter(m => m.auto_name)
      .map(m => m.auto_name)
  )).sort();

  const accompanyingSuggestions = Array.from(new Set(
    movements
      .filter(m => m.accompanying_person)
      .map(m => m.accompanying_person)
  )).sort();

  const getInitialFormData = () => ({
    movement_type: 'bundles' as 'bundles' | 'pieces',
    destination: availableDestinations.length === 1 ? availableDestinations[0].value : '',
    item: '',
    bundles_count: '',
    shirt_bundles: '',
    pant_bundles: '',
    sent_by: '',
    transport_method: 'auto' as 'auto' | 'bike' | 'by_walk',
    fare_payment: 'paid_by_sender',
    accompanying_person: '',
    auto_name: '',
    notes: '',
  });

  const [formData, setFormData] = useState(getInitialFormData());

  const showAutoFields = formData.transport_method === 'auto';

  const [bothDestinationData, setBothDestinationData] = useState<BothDestinationData>({
    big_shop: { shirt: '', pant: '' },
    small_shop: { shirt: '', pant: '' }
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get staff based on source location - only active staff
  const availableStaff = staff.filter(s => s.location === source && s.is_active !== false);
  const showBothDialog = formData.destination === 'both';

  const generateFareDisplayMsg = (farePayment: string) => {
    switch (farePayment) {
      case 'paid_by_sender': return 'Fare: Paid by Sender';
      case 'to_be_paid_by_small_shop': return 'Fare to be paid by Small Shop';
      case 'to_be_paid_by_big_shop': return 'Fare to be paid by Big Shop';
      default: return '';
    }
  };

  const generateFarePayeeTag = (farePayment: string) => {
    switch (farePayment) {
      case 'paid_by_sender': return 'Sender';
      case 'to_be_paid_by_small_shop': return 'Small Shop';
      case 'to_be_paid_by_big_shop': return 'Big Shop';
      default: return '';
    }
  };

  const generateItemSummaryDisplay = (item: string, shirtBundles: string, pantBundles: string, totalBundles: number) => {
    if (item === 'both') {
      const shirtCount = parseInt(shirtBundles) || 0;
      const pantCount = parseInt(pantBundles) || 0;
      return `Shirt - ${shirtCount}, Pant - ${pantCount}, Total - ${totalBundles}`;
    }
    return '';
  };

  const handleMovementTypeChange = (value: 'bundles' | 'pieces') => {
    setFormData({
      ...formData,
      movement_type: value,
      bundles_count: '',
      shirt_bundles: '',
      pant_bundles: ''
    });
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

  // Handle edit: populate form with movement data
  const handleEdit = (movement: GoodsMovement) => {
    setEditingMovement(movement);

    setFormData({
      movement_type: (movement.movement_type || 'bundles') as 'bundles' | 'pieces',
      destination: movement.destination,
      item: movement.item,
      bundles_count: movement.item !== 'both' ? String(movement.bundles_count) : '',
      shirt_bundles: movement.shirt_bundles ? String(movement.shirt_bundles) : '',
      pant_bundles: movement.pant_bundles ? String(movement.pant_bundles) : '',
      sent_by: movement.sent_by,
      transport_method: (movement.transport_method || 'auto') as 'auto' | 'bike' | 'by_walk',
      fare_payment: movement.fare_payment || 'paid_by_sender',
      accompanying_person: movement.accompanying_person || '',
      auto_name: movement.auto_name || '',
      notes: movement.dispatch_notes || movement.condition_notes || '',
    });

    // Scroll to form
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleCancelEdit = () => {
    setEditingMovement(null);
    setFormData(getInitialFormData());
    setBothDestinationData({
      big_shop: { shirt: '', pant: '' },
      small_shop: { shirt: '', pant: '' }
    });
  };

  const handleDelete = (movementId: string) => {
    // Refresh data
    onDataRefresh?.();
  };

  const createBaseMovement = (destination: 'godown' | 'big_shop' | 'small_shop', totalBundles: number): Omit<GoodsMovement, 'id' | 'created_at' | 'updated_at'> => {
    if (!formData.sent_by || !formData.accompanying_person) {
      throw new Error('Please fill in all required fields');
    }

    if (formData.transport_method === 'auto' && !formData.auto_name) {
      throw new Error('Please enter Auto Name');
    }

    const selectedStaff = staff.find(s => s.id === formData.sent_by);

    return {
      dispatch_date: editingMovement ? editingMovement.dispatch_date : new Date().toISOString(),
      movement_type: formData.movement_type,
      bundles_count: totalBundles,
      item: 'shirt',
      source,
      destination,
      sent_by: formData.sent_by,
      sent_by_name: selectedStaff?.name,
      transport_method: formData.transport_method,
      fare_payment: formData.transport_method === 'auto'
        ? formData.fare_payment as 'paid_by_sender' | 'to_be_paid_by_small_shop' | 'to_be_paid_by_big_shop'
        : 'paid_by_sender',
      fare_display_msg: formData.transport_method === 'auto' ? generateFareDisplayMsg(formData.fare_payment) : undefined,
      fare_payee_tag: formData.transport_method === 'auto' ? generateFarePayeeTag(formData.fare_payment) : undefined,
      accompanying_person: formData.accompanying_person,
      auto_name: formData.transport_method === 'auto' ? (formData.auto_name || '') : '',
      status: 'dispatched',
      condition_notes: formData.notes || undefined,
    };
  };

  const createMovement = (dest: 'godown' | 'big_shop' | 'small_shop', itemType: 'shirt' | 'pant', bundleCount: string): Omit<GoodsMovement, 'id' | 'created_at' | 'updated_at'> => {
    const base = createBaseMovement(dest, parseInt(bundleCount));
    return { ...base, item: itemType };
  };

  const createMovementForBothItems = (dest: 'big_shop' | 'small_shop', totalBundles: number): Omit<GoodsMovement, 'id' | 'created_at' | 'updated_at'> => {
    const shirtCount = parseInt(formData.shirt_bundles) || 0;
    const pantCount = parseInt(formData.pant_bundles) || 0;
    const base = createBaseMovement(dest, totalBundles);
    return {
      ...base,
      item: 'both',
      shirt_bundles: shirtCount,
      pant_bundles: pantCount,
      item_summary_display: generateItemSummaryDisplay('both', formData.shirt_bundles, formData.pant_bundles, totalBundles),
    };
  };

  const handleUpdate = async (movement: Omit<GoodsMovement, 'id' | 'created_at' | 'updated_at'>) => {
    if (!editingMovement) return;

    try {
      const updateData: any = {
        movement_type: movement.movement_type || 'bundles',
        bundles_count: movement.bundles_count,
        item: movement.item,
        destination: movement.destination,
        sent_by: movement.sent_by,
        transport_method: movement.transport_method || 'auto',
        fare_payment: movement.fare_payment,
        accompanying_person: movement.accompanying_person,
        auto_name: movement.auto_name || '',
        status: movement.status,
        updated_at: new Date().toISOString(),
      };

      if (movement.shirt_bundles !== undefined) updateData.shirt_bundles = movement.shirt_bundles;
      if (movement.pant_bundles !== undefined) updateData.pant_bundles = movement.pant_bundles;
      if (movement.fare_display_msg) updateData.fare_display_msg = movement.fare_display_msg;
      if (movement.fare_payee_tag) updateData.fare_payee_tag = movement.fare_payee_tag;
      if (movement.item_summary_display) updateData.item_summary_display = movement.item_summary_display;
      if (movement.condition_notes) {
        updateData.condition_notes = movement.condition_notes;
        updateData.dispatch_notes = movement.condition_notes;
      } else {
        updateData.condition_notes = null;
        updateData.dispatch_notes = null;
      }

      const { error } = await supabase
        .from('goods_movements')
        .update(updateData)
        .eq('id', editingMovement.id);

      if (error) {
        toast.error('Failed to update: ' + error.message);
      } else {
        toast.success('Dispatch updated successfully!');
        handleCancelEdit();
        onDataRefresh?.();
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to update dispatch');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (editingMovement) {
        // Update mode - only single destination edit supported (not "both")
        if (formData.item === 'both') {
          const shirtCount = parseInt(formData.shirt_bundles) || 0;
          const pantCount = parseInt(formData.pant_bundles) || 0;
          const totalBundles = shirtCount + pantCount;
          if (totalBundles === 0) {
            toast.error('Please enter bundle counts');
            setIsSubmitting(false);
            return;
          }
          await handleUpdate(createMovementForBothItems(formData.destination as 'big_shop' | 'small_shop', totalBundles));
        } else {
          if (!formData.bundles_count) {
            toast.error(`Please enter number of ${formData.movement_type === 'bundles' ? 'bundles' : 'pieces'}`);
            setIsSubmitting(false);
            return;
          }
          await handleUpdate(createMovement(formData.destination as 'big_shop' | 'small_shop', formData.item as 'shirt' | 'pant', formData.bundles_count));
        }
      } else {
        // New dispatch mode
        if (formData.destination === 'both') {
          const newMovements = [];
          const bigShirt = parseInt(bothDestinationData.big_shop.shirt) || 0;
          const bigPant = parseInt(bothDestinationData.big_shop.pant) || 0;
          const bigTotal = bigShirt + bigPant;

          if (bigTotal > 0) {
            newMovements.push({
              ...createBaseMovement('big_shop', bigTotal),
              item: 'both',
              shirt_bundles: bigShirt,
              pant_bundles: bigPant,
              item_summary_display: generateItemSummaryDisplay('both', String(bigShirt), String(bigPant), bigTotal),
            });
          }

          const smallShirt = parseInt(bothDestinationData.small_shop.shirt) || 0;
          const smallPant = parseInt(bothDestinationData.small_shop.pant) || 0;
          const smallTotal = smallShirt + smallPant;

          if (smallTotal > 0) {
            newMovements.push({
              ...createBaseMovement('small_shop', smallTotal),
              item: 'both',
              shirt_bundles: smallShirt,
              pant_bundles: smallPant,
              item_summary_display: generateItemSummaryDisplay('both', String(smallShirt), String(smallPant), smallTotal),
            });
          }

          if (newMovements.length === 0) {
            toast.error('Please enter at least one bundle count');
            setIsSubmitting(false);
            return;
          }

          for (const movement of newMovements) {
            onDispatch(movement);
          }
        } else {
          if (formData.item === 'both') {
            const shirtCount = parseInt(formData.shirt_bundles) || 0;
            const pantCount = parseInt(formData.pant_bundles) || 0;
            const totalBundles = shirtCount + pantCount;

            if (totalBundles === 0) {
              toast.error('Please enter bundle counts');
              setIsSubmitting(false);
              return;
            }

            onDispatch(createMovementForBothItems(formData.destination as 'big_shop' | 'small_shop', totalBundles));
          } else {
            if (!formData.bundles_count) {
              toast.error(`Please enter number of ${formData.movement_type === 'bundles' ? 'bundles' : 'pieces'}`);
              setIsSubmitting(false);
              return;
            }
            onDispatch(createMovement(formData.destination as 'big_shop' | 'small_shop', formData.item as 'shirt' | 'pant', formData.bundles_count));
          }
        }

        // Reset form after new dispatch
        setFormData(getInitialFormData());
        setBothDestinationData({
          big_shop: { shirt: '', pant: '' },
          small_shop: { shirt: '', pant: '' }
        });
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to dispatch goods');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4">
      <div ref={formRef}>
        <Card className="backdrop-blur-sm bg-white/80 border-white/40 shadow-xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-gray-800 text-xl font-bold">
                {editingMovement ? 'Edit Dispatch' : 'Dispatch Goods'}
              </CardTitle>
              {editingMovement && (
                <Button variant="ghost" size="sm" onClick={handleCancelEdit} className="text-gray-500">
                  <X className="h-4 w-4 mr-1" /> Cancel Edit
                </Button>
              )}
            </div>
            {editingMovement && (
              <p className="text-sm text-amber-600 font-medium">
                Editing dispatch from {formatDateTime12hr(editingMovement.dispatch_date)}
              </p>
            )}
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-3">
                <Label className="text-gray-700">Movement Type</Label>
                <RadioGroup
                  value={formData.movement_type}
                  onValueChange={(value) => handleMovementTypeChange(value as 'bundles' | 'pieces')}
                  className="flex items-center space-x-6"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="bundles" id="bundles" />
                    <Label htmlFor="bundles" className="text-gray-700 font-medium">Bundles</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="pieces" id="pieces" />
                    <Label htmlFor="pieces" className="text-gray-700 font-medium">Pieces</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-700">Dispatch Date & Time</Label>
                <Input
                  value={editingMovement
                    ? formatDateTime12hr(editingMovement.dispatch_date)
                    : formatDateTime12hr(new Date().toISOString())
                  }
                  disabled
                  className="bg-gray-50/60"
                />
              </div>

              {/* Hide destination change during edit if it was 'both' originally - show fixed */}
              {editingMovement ? (
                <div className="space-y-2">
                  <Label className="text-gray-700">Destination</Label>
                  <Input
                    value={formData.destination === 'big_shop' ? 'Big Shop' : formData.destination === 'small_shop' ? 'Small Shop' : formData.destination === 'godown' ? 'Godown' : formData.destination}
                    disabled
                    className="bg-gray-50/60"
                  />
                </div>
              ) : (
                <DestinationSelector
                  value={formData.destination}
                  onChange={handleDestinationChange}
                  availableDestinations={availableDestinations}
                />
              )}

              <ItemSelector
                value={formData.item}
                onChange={handleItemChange}
                destination={formData.destination}
              />

              <BundleInputs
                destination={formData.destination}
                item={formData.item}
                bundlesCount={formData.bundles_count}
                shirtBundles={formData.shirt_bundles}
                pantBundles={formData.pant_bundles}
                onBundlesCountChange={(value) => setFormData({ ...formData, bundles_count: value })}
                onShirtBundlesChange={(value) => setFormData({ ...formData, shirt_bundles: value })}
                onPantBundlesChange={(value) => setFormData({ ...formData, pant_bundles: value })}
                movementType={formData.movement_type}
              />

              {showBothDialog && !editingMovement && (
                <BothDestinationDialog
                  data={bothDestinationData}
                  onChange={setBothDestinationData}
                />
              )}

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
                    {availableStaff.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <TransportMethodSelector
                value={formData.transport_method}
                onChange={(value) => setFormData({ ...formData, transport_method: value })}
              />

              {showAutoFields && (
                <>
                  <div className="space-y-3">
                    <Label className="text-gray-700">Auto Fare Payment</Label>
                    <RadioGroup
                      value={formData.fare_payment}
                      onValueChange={(value) => setFormData({ ...formData, fare_payment: value })}
                      className="grid grid-cols-1 gap-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="paid_by_sender" id="paid_sender" />
                        <Label htmlFor="paid_sender" className="text-gray-700 text-sm">Paid by Sender</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="to_be_paid_by_small_shop" id="paid_small_shop" />
                        <Label htmlFor="paid_small_shop" className="text-gray-700 text-sm">To Be Paid by Small Shop</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="to_be_paid_by_big_shop" id="paid_big_shop" />
                        <Label htmlFor="paid_big_shop" className="text-gray-700 text-sm">To Be Paid by Big Shop</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="auto_name" className="text-gray-700">Auto Name *</Label>
                    <Input
                      id="auto_name"
                      list="auto-list"
                      placeholder="Enter vehicle name/type"
                      value={formData.auto_name}
                      onChange={(e) => setFormData({ ...formData, auto_name: e.target.value })}
                      required
                      className="bg-white/90"
                    />
                    <datalist id="auto-list">
                      {autoSuggestions.map(name => (
                        <option key={name} value={name} />
                      ))}
                    </datalist>
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="accompanying" className="text-gray-700">
                  Person {showAutoFields ? 'Accompanying Auto' : 'Carrying Goods'} *
                </Label>
                <Input
                  id="accompanying"
                  list="accompanying-list"
                  placeholder={showAutoFields ? 'Enter name of person accompanying' : 'Enter name of person carrying goods'}
                  value={formData.accompanying_person}
                  onChange={(e) => setFormData({ ...formData, accompanying_person: e.target.value })}
                  required
                  className="bg-white/90"
                />
                <datalist id="accompanying-list">
                  {accompanyingSuggestions.map(name => (
                    <option key={name} value={name} />
                  ))}
                </datalist>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes" className="text-gray-700">Dispatch Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Any notes about the dispatch (visible in reports)..."
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
                {isSubmitting
                  ? (editingMovement ? 'Updating...' : 'Dispatching...')
                  : (editingMovement ? 'Update Dispatch' : 'Dispatch Goods')
                }
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Recent dispatches with edit/delete/share */}
      {user && (
        <DispatchHistory
          movements={movements}
          currentUser={user}
          onEdit={handleEdit}
          onDelete={handleDelete}
          staff={staff}
        />
      )}
    </div>
  );
}
