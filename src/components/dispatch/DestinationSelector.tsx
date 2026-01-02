
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface DestinationOption {
  value: string;
  label: string;
}

interface DestinationSelectorProps {
  value: string;
  onChange: (value: string) => void;
  availableDestinations?: DestinationOption[];
}

export function DestinationSelector({ value, onChange, availableDestinations }: DestinationSelectorProps) {
  // Default destinations for backward compatibility
  const destinations = availableDestinations || [
    { value: 'small_shop', label: 'Small Shop' },
    { value: 'big_shop', label: 'Big Shop' },
    { value: 'both', label: 'Both' }
  ];

  return (
    <div className="space-y-2">
      <Label className="text-gray-700">Destination *</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="bg-white/90">
          <SelectValue placeholder="Select destination" />
        </SelectTrigger>
        <SelectContent>
          {destinations.map((dest) => (
            <SelectItem key={dest.value} value={dest.value}>
              {dest.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
