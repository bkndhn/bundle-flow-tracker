
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface DestinationSelectorProps {
  selectedDestination: 'big_shop' | 'small_shop' | 'both';
  onDestinationChange: (destination: 'big_shop' | 'small_shop' | 'both') => void;
}

export function DestinationSelector({ selectedDestination, onDestinationChange }: DestinationSelectorProps) {
  return (
    <div className="space-y-2">
      <Label className="text-gray-700">Destination *</Label>
      <Select value={selectedDestination} onValueChange={onDestinationChange}>
        <SelectTrigger className="bg-white/90">
          <SelectValue placeholder="Select destination" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="big_shop">Big Shop</SelectItem>
          <SelectItem value="small_shop">Small Shop</SelectItem>
          <SelectItem value="both">Both</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
