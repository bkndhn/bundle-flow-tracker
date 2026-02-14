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
            className={`flex flex-col items-center justify-center p-4 border-2 rounded-lg cursor-pointer transition-all
                       ${value === 'auto' ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-300 shadow-md' : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/50'}`}
          >
            <Truck className={`h-6 w-6 mb-2 ${value === 'auto' ? 'text-blue-700' : 'text-blue-600'}`} />
            <span className={`text-sm font-medium ${value === 'auto' ? 'text-blue-700 font-bold' : 'text-gray-700'}`}>Auto</span>
            {value === 'auto' && <div className="w-2 h-2 rounded-full bg-blue-600 mt-1" />}
          </label>
        </div>
        <div className="relative">
          <RadioGroupItem value="bike" id="transport_bike" className="peer sr-only" />
          <label
            htmlFor="transport_bike"
            className={`flex flex-col items-center justify-center p-4 border-2 rounded-lg cursor-pointer transition-all
                       ${value === 'bike' ? 'border-green-500 bg-green-50 ring-2 ring-green-300 shadow-md' : 'border-gray-200 hover:border-green-300 hover:bg-green-50/50'}`}
          >
            <Bike className={`h-6 w-6 mb-2 ${value === 'bike' ? 'text-green-700' : 'text-green-600'}`} />
            <span className={`text-sm font-medium ${value === 'bike' ? 'text-green-700 font-bold' : 'text-gray-700'}`}>Bike</span>
            {value === 'bike' && <div className="w-2 h-2 rounded-full bg-green-600 mt-1" />}
          </label>
        </div>
        <div className="relative">
          <RadioGroupItem value="by_walk" id="transport_walk" className="peer sr-only" />
          <label
            htmlFor="transport_walk"
            className={`flex flex-col items-center justify-center p-4 border-2 rounded-lg cursor-pointer transition-all
                       ${value === 'by_walk' ? 'border-orange-500 bg-orange-50 ring-2 ring-orange-300 shadow-md' : 'border-gray-200 hover:border-orange-300 hover:bg-orange-50/50'}`}
          >
            <Footprints className={`h-6 w-6 mb-2 ${value === 'by_walk' ? 'text-orange-700' : 'text-orange-600'}`} />
            <span className={`text-sm font-medium ${value === 'by_walk' ? 'text-orange-700 font-bold' : 'text-gray-700'}`}>Walk</span>
            {value === 'by_walk' && <div className="w-2 h-2 rounded-full bg-orange-600 mt-1" />}
          </label>
        </div>
      </RadioGroup>
    </div>
  );
}
