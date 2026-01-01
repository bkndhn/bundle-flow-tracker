
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
  movementType?: 'bundles' | 'pieces';
}

export function BundleInputs({
  destination,
  item,
  bundlesCount,
  shirtBundles,
  pantBundles,
  onBundlesCountChange,
  onShirtBundlesChange,
  onPantBundlesChange,
  movementType = 'bundles'
}: BundleInputsProps) {
  if (destination === 'both') return null;

  const calculateTotalBundles = () => {
    const shirtCount = parseInt(shirtBundles) || 0;
    const pantCount = parseInt(pantBundles) || 0;
    return shirtCount + pantCount;
  };

  const labelSuffix = movementType === 'bundles' ? 'Bundles' : 'Pieces';
  const labelSuffixSingular = movementType === 'bundles' ? 'bundles' : 'pieces';

  if (item === 'both') {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-gray-700">Shirt {labelSuffix} *</Label>
            <Input
              type="number"
              placeholder={`Enter shirt ${labelSuffixSingular}`}
              value={shirtBundles}
              onChange={(e) => onShirtBundlesChange(e.target.value)}
              className="bg-white/90"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-gray-700">Pant {labelSuffix} *</Label>
            <Input
              type="number"
              placeholder={`Enter pant ${labelSuffixSingular}`}
              value={pantBundles}
              onChange={(e) => onPantBundlesChange(e.target.value)}
              className="bg-white/90"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label className="text-gray-700">Total {labelSuffix}</Label>
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
        <Label className="text-gray-700">Number of {labelSuffix} *</Label>
        <Input
          type="number"
          placeholder={`Enter number of ${labelSuffixSingular}`}
          value={bundlesCount}
          onChange={(e) => onBundlesCountChange(e.target.value)}
          className="bg-white/90"
        />
      </div>
    );
  }

  return null;
}
