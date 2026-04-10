import { memo } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { GoodsMovement } from '@/types';
import { LOCATIONS } from '@/lib/constants';
import { formatDateTime12hr } from '@/lib/utils';
import { QrCode, Package, ArrowRight } from 'lucide-react';

interface QRCodeDisplayProps {
  movement: GoodsMovement;
  open: boolean;
  onClose: () => void;
}

function generateQRData(movement: GoodsMovement): string {
  // Encode essential dispatch info as a compact JSON string
  const qrPayload = {
    id: movement.id,
    item: movement.item,
    qty: movement.bundles_count,
    type: movement.movement_type,
    from: movement.source,
    to: movement.destination,
    date: movement.dispatch_date,
    status: movement.status,
  };
  return JSON.stringify(qrPayload);
}

export const QRCodeDisplay = memo(function QRCodeDisplay({ movement, open, onClose }: QRCodeDisplayProps) {
  const qrData = generateQRData(movement);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5 text-primary" />
            Dispatch QR Code
          </DialogTitle>
          <DialogDescription>
            Scan this QR code at the receiving end to quickly confirm receipt
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-4">
          {/* QR Code */}
          <div className="bg-white p-4 rounded-xl shadow-inner border">
            <QRCodeSVG
              value={qrData}
              size={200}
              level="M"
              includeMargin
              bgColor="#ffffff"
              fgColor="#1e293b"
            />
          </div>

          {/* Movement summary */}
          <div className="w-full space-y-2 text-center">
            <div className="flex items-center justify-center gap-2">
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                {movement.bundles_count} {movement.movement_type === 'pieces' ? 'Pcs' : 'Bundles'}
              </Badge>
              <Badge variant="outline" className="capitalize">
                {movement.item === 'both' ? (movement.item_summary_display || 'Both') : movement.item}
              </Badge>
            </div>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <span className="font-medium">{LOCATIONS[movement.source] || 'Godown'}</span>
              <ArrowRight className="h-3 w-3" />
              <span className="font-medium">{LOCATIONS[movement.destination]}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Dispatched: {formatDateTime12hr(movement.dispatch_date)}
            </p>
            <p className="text-xs text-muted-foreground font-mono bg-muted/50 rounded px-2 py-1 inline-block">
              ID: {movement.id.slice(0, 8)}...
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
});
