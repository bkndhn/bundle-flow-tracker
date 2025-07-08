
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface BundleInputsProps {
  bundlesCount: string;
  onBundlesCountChange: (value: string) => void;
}

export function BundleInputs({ bundlesCount, onBundlesCountChange }: BundleInputsProps) {
  return (
    <div className="space-y-2">
      <Label className="text-gray-700">Number of Bundles *</Label>
      <Input
        type="number"
        placeholder="Enter number of bundles"
        value={bundlesCount}
        onChange={(e) => onBundlesCountChange(e.target.value)}
        className="bg-white/90"
      />
    </div>
  );
}
