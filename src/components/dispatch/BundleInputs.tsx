
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface BundleInputsProps {
  destination: string;
  item: string;
  bundlesCount: string;
  shirtBundles: string;
  pantBundles: string;
  onBundlesCountChange: (value: string) => void;
  onShirtBundlesChange: (value: string) => void;
  onPantBundlesChange: (value: string) => void;
}

export function BundleInputs({
  destination,
  item,
  bundlesCount,
  shirtBundles,
  pantBundles,
  onBundlesCountChange,
  onShirtBundlesChange,
  onPantBundlesChange
}: BundleInputsProps) {
  if (destination === 'both') return null;

  const calculateTotalBundles = () => {
    const shirtCount = parseInt(shirtBundles) || 0;
    const pantCount = parseInt(pantBundles) || 0;
    return shirtCount + pantCount;
  };

  if (item === 'both') {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-gray-700">Shirt Bundles *</Label>
            <Input
              type="number"
              placeholder="Enter shirt bundles"
              value={shirtBundles}
              onChange={(e) => onShirtBundlesChange(e.target.value)}
              className="bg-white/90"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-gray-700">Pant Bundles *</Label>
            <Input
              type="number"
              placeholder="Enter pant bundles"
              value={pantBundles}
              onChange={(e) => onPantBundlesChange(e.target.value)}
              className="bg-white/90"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label className="text-gray-700">Total Bundles</Label>
          <Input
            value={calculateTotalBundles()}
            disabled
            className="bg-gray-50/60"
          />
        </div>
      </div>
    );
  }

  if (item && item !== 'both') {
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

  return null;
}
