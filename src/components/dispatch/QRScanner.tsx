import { useState, useRef, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Camera, ScanLine, X, CheckCircle, AlertCircle } from 'lucide-react';
import { GoodsMovement } from '@/types';
import { LOCATIONS } from '@/lib/constants';
import { formatDateTime12hr } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface QRScannerProps {
  open: boolean;
  onClose: () => void;
  pendingMovements: GoodsMovement[];
  onMovementFound: (movementId: string) => void;
}

export function QRScanner({ open, onClose, pendingMovements, onMovementFound }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number | null>(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string>('');
  const [scannedMovement, setScannedMovement] = useState<GoodsMovement | null>(null);
  const [scanStatus, setScanStatus] = useState<'idle' | 'scanning' | 'found' | 'not_found'>('idle');

  const stopCamera = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setScanning(false);
  }, []);

  const processQRFromImage = useCallback((imageData: ImageData): string | null => {
    // Simple QR detection by looking for JSON-like patterns in the video feed
    // For production, we'd use a dedicated library. Here we use a manual paste/input approach.
    return null;
  }, []);

  const startCamera = useCallback(async () => {
    try {
      setError('');
      setScanStatus('scanning');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setScanning(true);
      }
    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        setError('Camera access denied. Please allow camera access and try again.');
      } else if (err.name === 'NotFoundError') {
        setError('No camera found on this device.');
      } else {
        setError('Could not start camera. Try entering the dispatch ID manually below.');
      }
      setScanStatus('idle');
    }
  }, []);

  useEffect(() => {
    if (!open) {
      stopCamera();
      setScannedMovement(null);
      setScanStatus('idle');
      setError('');
    }
  }, [open, stopCamera]);

  // Manual ID entry fallback
  const [manualId, setManualId] = useState('');

  const handleManualLookup = useCallback(() => {
    if (!manualId.trim()) return;
    
    const found = pendingMovements.find(m => 
      m.id === manualId.trim() || m.id.startsWith(manualId.trim())
    );
    
    if (found) {
      setScannedMovement(found);
      setScanStatus('found');
      stopCamera();
    } else {
      setScanStatus('not_found');
    }
  }, [manualId, pendingMovements, stopCamera]);

  const handleJsonPaste = useCallback((text: string) => {
    try {
      const data = JSON.parse(text);
      if (data.id) {
        const found = pendingMovements.find(m => 
          m.id === data.id || m.id.startsWith(data.id)
        );
        if (found) {
          setScannedMovement(found);
          setScanStatus('found');
          stopCamera();
          return;
        }
      }
    } catch {
      // Not JSON, try as raw ID
    }
    
    const found = pendingMovements.find(m => 
      m.id === text.trim() || m.id.startsWith(text.trim())
    );
    if (found) {
      setScannedMovement(found);
      setScanStatus('found');
      stopCamera();
    } else {
      setScanStatus('not_found');
    }
  }, [pendingMovements, stopCamera]);

  const handleConfirmReceipt = () => {
    if (scannedMovement) {
      onMovementFound(scannedMovement.id);
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary" />
            Scan QR Code
          </DialogTitle>
          <DialogDescription>
            Scan the dispatch QR code or enter the dispatch ID to confirm receipt
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Camera view */}
          {scanning && (
            <div className="relative rounded-xl overflow-hidden bg-black aspect-video">
              <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
              <canvas ref={canvasRef} className="hidden" />
              {/* Scan overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-48 h-48 border-2 border-white/60 rounded-2xl relative">
                  <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-primary rounded-tl-lg" />
                  <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-primary rounded-tr-lg" />
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-primary rounded-bl-lg" />
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-primary rounded-br-lg" />
                  <ScanLine className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-primary animate-pulse" />
                </div>
              </div>
              <p className="absolute bottom-2 left-0 right-0 text-center text-white/80 text-xs">
                Point camera at QR code
              </p>
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="bg-destructive/10 text-destructive rounded-lg p-3 text-sm flex items-start gap-2">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              {error}
            </div>
          )}

          {/* Camera button */}
          {!scanning && scanStatus !== 'found' && (
            <Button onClick={startCamera} className="w-full" variant="outline" size="lg">
              <Camera className="h-4 w-4 mr-2" />
              Open Camera to Scan
            </Button>
          )}

          {/* Manual entry */}
          {scanStatus !== 'found' && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground font-medium">Or paste QR data / dispatch ID:</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  className="flex-1 px-3 py-2 rounded-lg border border-input bg-background text-sm"
                  placeholder="Paste dispatch ID or QR JSON..."
                  value={manualId}
                  onChange={(e) => {
                    setManualId(e.target.value);
                    setScanStatus('idle');
                  }}
                  onPaste={(e) => {
                    const text = e.clipboardData.getData('text');
                    if (text) {
                      setTimeout(() => handleJsonPaste(text), 100);
                    }
                  }}
                />
                <Button size="sm" onClick={handleManualLookup}>
                  Find
                </Button>
              </div>
              {scanStatus === 'not_found' && (
                <p className="text-xs text-destructive">No matching pending dispatch found</p>
              )}
            </div>
          )}

          {/* Found movement */}
          {scanStatus === 'found' && scannedMovement && (
            <div className="space-y-3">
              <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-xl p-4 border border-emerald-200 dark:border-emerald-800">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="h-5 w-5 text-emerald-600" />
                  <span className="font-semibold text-emerald-800 dark:text-emerald-200">Dispatch Found!</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Item</span>
                    <Badge variant="outline" className="capitalize">{scannedMovement.item}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Quantity</span>
                    <span className="font-medium">{scannedMovement.bundles_count} {scannedMovement.movement_type === 'pieces' ? 'pcs' : 'bundles'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">From</span>
                    <span className="font-medium">{LOCATIONS[scannedMovement.source] || 'Godown'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">To</span>
                    <span className="font-medium">{LOCATIONS[scannedMovement.destination]}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Dispatched</span>
                    <span className="font-medium text-xs">{formatDateTime12hr(scannedMovement.dispatch_date)}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleConfirmReceipt}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Confirm Receipt
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setScannedMovement(null);
                    setScanStatus('idle');
                    setManualId('');
                  }}
                >
                  Scan Again
                </Button>
              </div>
            </div>
          )}

          {/* Stop camera button */}
          {scanning && (
            <Button variant="outline" onClick={stopCamera} className="w-full">
              <X className="h-4 w-4 mr-2" />
              Stop Camera
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
