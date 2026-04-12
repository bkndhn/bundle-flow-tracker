
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface BothDestinationData { big_shop: { shirt: string; pant: string; }; small_shop: { shirt: string; pant: string; }; }
interface BothDestinationDialogProps { data: BothDestinationData; onChange: (data: BothDestinationData) => void; }

export function BothDestinationDialog({ data, onChange }: BothDestinationDialogProps) {
  const updateData = (shop: 'big_shop' | 'small_shop', item: 'shirt' | 'pant', value: string) => {
    onChange({ ...data, [shop]: { ...data[shop], [item]: value } });
  };

  const bigShopTotal = (parseInt(data.big_shop.shirt) || 0) + (parseInt(data.big_shop.pant) || 0);
  const smallShopTotal = (parseInt(data.small_shop.shirt) || 0) + (parseInt(data.small_shop.pant) || 0);
  const grandTotal = bigShopTotal + smallShopTotal;

  return (
    <div className="space-y-4 p-4 border border-border rounded-lg bg-blue-50/50 dark:bg-blue-900/10">
      <Label className="text-foreground font-semibold">Distribution for Both Shops</Label>
      <div className="grid grid-cols-3 gap-4">
        <div className="font-medium text-center text-foreground">Item</div>
        <div className="font-medium text-center text-foreground">Big Shop</div>
        <div className="font-medium text-center text-foreground">Small Shop</div>

        <div className="flex items-center text-foreground">Shirt</div>
        <Input type="number" placeholder="0" value={data.big_shop.shirt} onChange={(e) => updateData('big_shop', 'shirt', e.target.value)} className="bg-background" />
        <Input type="number" placeholder="0" value={data.small_shop.shirt} onChange={(e) => updateData('small_shop', 'shirt', e.target.value)} className="bg-background" />

        <div className="flex items-center text-foreground">Pant</div>
        <Input type="number" placeholder="0" value={data.big_shop.pant} onChange={(e) => updateData('big_shop', 'pant', e.target.value)} className="bg-background" />
        <Input type="number" placeholder="0" value={data.small_shop.pant} onChange={(e) => updateData('small_shop', 'pant', e.target.value)} className="bg-background" />

        <div className="flex items-center font-semibold text-foreground border-t border-border pt-2">Total</div>
        <div className="flex items-center justify-center font-semibold text-blue-600 dark:text-blue-400 border-t border-border pt-2 bg-blue-100/50 dark:bg-blue-900/30 rounded">{bigShopTotal}</div>
        <div className="flex items-center justify-center font-semibold text-blue-600 dark:text-blue-400 border-t border-border pt-2 bg-blue-100/50 dark:bg-blue-900/30 rounded">{smallShopTotal}</div>
      </div>

      <div className="flex justify-between items-center p-3 bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-lg">
        <span className="font-bold text-foreground">Grand Total</span>
        <span className="text-xl font-bold text-blue-700 dark:text-blue-300">{grandTotal}</span>
      </div>
    </div>
  );
}
