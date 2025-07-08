
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface BothDestinationData {
  big_shop: { shirt: string; pant: string };
  small_shop: { shirt: string; pant: string };
}

interface BothDestinationDialogProps {
  open: boolean;
  bothDestinationData: BothDestinationData;
  onDataChange: (data: BothDestinationData) => void;
  onSubmit: () => void;
  onCancel: () => void;
  grandTotalRow?: React.ReactNode;
}

export function BothDestinationDialog({
  open,
  bothDestinationData,
  onDataChange,
  onSubmit,
  onCancel,
  grandTotalRow,
}: BothDestinationDialogProps) {
  const updateData = (shop: 'big_shop' | 'small_shop', item: 'shirt' | 'pant', value: string) => {
    onDataChange({
      ...bothDestinationData,
      [shop]: {
        ...bothDestinationData[shop],
        [item]: value,
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Distribution for Both Shops</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Header Row */}
          <div className="grid grid-cols-3 gap-4 text-sm font-medium text-gray-700 border-b-2 border-gray-300 pb-2">
            <div className="font-semibold">ITEM</div>
            <div className="text-center font-semibold">BIG SHOP</div>
            <div className="text-center font-semibold">SMALL SHOP</div>
          </div>
          
          {/* Pant Row */}
          <div className="grid grid-cols-3 gap-4 items-center border-b border-gray-200 pb-2">
            <Label className="text-gray-700 font-medium">PANT</Label>
            <Input
              type="number"
              placeholder="INPUT"
              value={bothDestinationData.big_shop.pant}
              onChange={(e) => updateData('big_shop', 'pant', e.target.value)}
              min="0"
              className="text-center bg-blue-50"
            />
            <Input
              type="number"
              placeholder="INPUT"
              value={bothDestinationData.small_shop.pant}
              onChange={(e) => updateData('small_shop', 'pant', e.target.value)}
              min="0"
              className="text-center bg-green-50"
            />
          </div>
          
          {/* Shirt Row */}
          <div className="grid grid-cols-3 gap-4 items-center border-b border-gray-200 pb-2">
            <Label className="text-gray-700 font-medium">SHIRT</Label>
            <Input
              type="number"
              placeholder="INPUT"
              value={bothDestinationData.big_shop.shirt}
              onChange={(e) => updateData('big_shop', 'shirt', e.target.value)}
              min="0"
              className="text-center bg-blue-50"
            />
            <Input
              type="number"
              placeholder="INPUT"
              value={bothDestinationData.small_shop.shirt}
              onChange={(e) => updateData('small_shop', 'shirt', e.target.value)}
              min="0"
              className="text-center bg-green-50"
            />
          </div>
          
          {/* Grand Total Row */}
          {grandTotalRow}
        </div>
        
        <div className="flex gap-2 pt-4">
          <Button onClick={onSubmit} className="flex-1">
            Dispatch to Both Shops
          </Button>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
