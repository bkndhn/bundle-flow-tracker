
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ItemSelectorProps {
  selectedItem: 'shirt' | 'pant' | 'both';
  onItemChange: (item: 'shirt' | 'pant' | 'both') => void;
}

export function ItemSelector({ selectedItem, onItemChange }: ItemSelectorProps) {
  return (
    <div className="space-y-2">
      <Label className="text-gray-700">Item *</Label>
      <Select value={selectedItem} onValueChange={onItemChange}>
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
  );
}
