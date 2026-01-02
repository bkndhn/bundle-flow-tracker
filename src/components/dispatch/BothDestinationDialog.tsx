
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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

interface BothDestinationDialogProps {
  data: BothDestinationData;
  onChange: (data: BothDestinationData) => void;
}

export function BothDestinationDialog({ data, onChange }: BothDestinationDialogProps) {
  const updateData = (shop: 'big_shop' | 'small_shop', item: 'shirt' | 'pant', value: string) => {
    onChange({
      ...data,
      [shop]: {
        ...data[shop],
        [item]: value
      }
    });
  };

  // Calculate totals
  const bigShopTotal = (parseInt(data.big_shop.shirt) || 0) + (parseInt(data.big_shop.pant) || 0);
  const smallShopTotal = (parseInt(data.small_shop.shirt) || 0) + (parseInt(data.small_shop.pant) || 0);
  const grandTotal = bigShopTotal + smallShopTotal;

  return (
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
          value={data.big_shop.shirt}
          onChange={(e) => updateData('big_shop', 'shirt', e.target.value)}
          className="bg-white/90"
        />
        <Input
          type="number"
          placeholder="0"
          value={data.small_shop.shirt}
          onChange={(e) => updateData('small_shop', 'shirt', e.target.value)}
          className="bg-white/90"
        />

        <div className="flex items-center">Pant</div>
        <Input
          type="number"
          placeholder="0"
          value={data.big_shop.pant}
          onChange={(e) => updateData('big_shop', 'pant', e.target.value)}
          className="bg-white/90"
        />
        <Input
          type="number"
          placeholder="0"
          value={data.small_shop.pant}
          onChange={(e) => updateData('small_shop', 'pant', e.target.value)}
          className="bg-white/90"
        />

        {/* Totals Row */}
        <div className="flex items-center font-semibold text-gray-700 border-t pt-2">Total</div>
        <div className="flex items-center justify-center font-semibold text-blue-600 border-t pt-2 bg-blue-100/50 rounded">
          {bigShopTotal}
        </div>
        <div className="flex items-center justify-center font-semibold text-blue-600 border-t pt-2 bg-blue-100/50 rounded">
          {smallShopTotal}
        </div>
      </div>

      {/* Grand Total */}
      <div className="flex justify-between items-center p-3 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-lg">
        <span className="font-bold text-gray-800">Grand Total</span>
        <span className="text-xl font-bold text-blue-700">{grandTotal}</span>
      </div>
    </div>
  );
}
