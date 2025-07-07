
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface DestinationSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export function DestinationSelector({ value, onChange }: DestinationSelectorProps) {
  return (
    <div className="space-y-2">
      <Label className="text-gray-700">Destination *</Label>
      <Select value={value} onValueChange={onChange}>
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
  );
}
