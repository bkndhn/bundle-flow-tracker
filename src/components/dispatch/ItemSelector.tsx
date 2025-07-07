
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ItemSelectorProps {
  value: string;
  onChange: (value: string) => void;
  destination: string;
}

export function ItemSelector({ value, onChange, destination }: ItemSelectorProps) {
  if (destination === 'both') return null;

  return (
    <div className="space-y-2">
      <Label className="text-gray-700">Item *</Label>
      <Select value={value} onValueChange={onChange}>
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
