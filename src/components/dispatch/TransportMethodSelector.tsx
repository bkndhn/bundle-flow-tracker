import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Truck, Bike, Footprints } from 'lucide-react';

interface TransportMethodSelectorProps {
  value: 'auto' | 'bike' | 'by_walk';
  onChange: (value: 'auto' | 'bike' | 'by_walk') => void;
}

export function TransportMethodSelector({ value, onChange }: TransportMethodSelectorProps) {
  return (
    <div className="space-y-3">
      <Label className="text-gray-700">Transport Method *</Label>
      <RadioGroup
        value={value}
        onValueChange={(val) => onChange(val as 'auto' | 'bike' | 'by_walk')}
        className="grid grid-cols-3 gap-3"
      >
        <div className="relative">
          <RadioGroupItem value="auto" id="transport_auto" className="peer sr-only" />
          <label
            htmlFor="transport_auto"
            className="flex flex-col items-center justify-center p-4 border-2 rounded-lg cursor-pointer transition-all
                       peer-checked:border-blue-500 peer-checked:bg-blue-50
                       hover:border-blue-300 hover:bg-blue-50/50"
          >
            <Truck className="h-6 w-6 mb-2 text-blue-600" />
            <span className="text-sm font-medium text-gray-700">Auto</span>
          </label>
        </div>
        <div className="relative">
          <RadioGroupItem value="bike" id="transport_bike" className="peer sr-only" />
          <label
            htmlFor="transport_bike"
            className="flex flex-col items-center justify-center p-4 border-2 rounded-lg cursor-pointer transition-all
                       peer-checked:border-green-500 peer-checked:bg-green-50
                       hover:border-green-300 hover:bg-green-50/50"
          >
            <Bike className="h-6 w-6 mb-2 text-green-600" />
            <span className="text-sm font-medium text-gray-700">Bike</span>
          </label>
        </div>
        <div className="relative">
          <RadioGroupItem value="by_walk" id="transport_walk" className="peer sr-only" />
          <label
            htmlFor="transport_walk"
            className="flex flex-col items-center justify-center p-4 border-2 rounded-lg cursor-pointer transition-all
                       peer-checked:border-orange-500 peer-checked:bg-orange-50
                       hover:border-orange-300 hover:bg-orange-50/50"
          >
            <Footprints className="h-6 w-6 mb-2 text-orange-600" />
            <span className="text-sm font-medium text-gray-700">Walk</span>
          </label>
        </div>
      </RadioGroup>
    </div>
  );
}
