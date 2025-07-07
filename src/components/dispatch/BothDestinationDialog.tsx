
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
      </div>
    </div>
  );
}
