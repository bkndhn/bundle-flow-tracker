import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { MessageSquare, Copy, Check, X, Image, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import {
    WhatsAppSettings,
    generateWhatsAppMessage,
    generateBatchWhatsAppMessage,
    getWhatsAppGroupLink,
    copyToClipboard,
    openWhatsAppGroup,
} from '@/services/whatsappService';
import { generateDispatchImageBlob, DispatchImageData } from '@/services/whatsappImageService';

interface DispatchDataItem {
    item: string;
    bundles_count: number;
    movement_type: string;
    source: string;
    destination: string;
    transport_method?: string;
    auto_name?: string;
    sent_by_name: string;
    accompanying_person?: string;
    dispatch_notes?: string;
    fare_display_msg?: string;
    shirt_bundles?: number;
    pant_bundles?: number;
}

interface WhatsAppShareDialogProps {
    open: boolean;
    onClose: () => void;
    settings: WhatsAppSettings;
    dispatchData: DispatchDataItem | DispatchDataItem[];
}

export function WhatsAppShareDialog({
    open,
    onClose,
    settings,
    dispatchData,
}: WhatsAppShareDialogProps) {
    const [copied, setCopied] = useState(false);
    const [sharingImage, setSharingImage] = useState(false);

    const isBatch = Array.isArray(dispatchData);
    const dispatches = isBatch ? dispatchData : [dispatchData];

    const message = dispatches.length > 1
        ? generateBatchWhatsAppMessage(dispatches)
        : generateWhatsAppMessage(dispatches[0]);

    const groupLink = getWhatsAppGroupLink(settings, dispatches[0].destination);

    const isImageMode = settings.whatsapp_share_format === 'image';

    // Auto-execute text mode: copy + open WhatsApp immediately
    useEffect(() => {
        if (open && !isImageMode) {
            handleTextShare();
        }
    }, [open]);

    const handleTextShare = async () => {
        const success = await copyToClipboard(message);
        if (success) {
            setCopied(true);
            toast.success('📋 Message copied! Paste in WhatsApp group.');
            
            setTimeout(() => {
                if (groupLink) {
                    openWhatsAppGroup(groupLink);
                }
                setTimeout(() => {
                    setCopied(false);
                    onClose();
                }, 1000);
            }, 300);
        } else {
            toast.error('Failed to copy message');
        }
    };

    const handleImageShare = async () => {
        setSharingImage(true);
        try {
            const imageData: DispatchImageData[] = dispatches.map(d => ({
                ...d,
                transport_method: d.transport_method || 'auto',
                auto_name: d.auto_name || '',
            }));

            const blob = await generateDispatchImageBlob(imageData.length > 1 ? imageData : imageData[0]);

            if (blob && navigator.share && navigator.canShare) {
            const file = new File([blob], 'dispatched.png', { type: 'image/png' });
                const shareData = { files: [file], title: 'Dispatched', text: 'Dispatched' };
                
                if (navigator.canShare(shareData)) {
                    await navigator.share(shareData);
                    toast.success('Image shared successfully!');
                    onClose();
                    return;
                }
            }

            // Fallback: download the image
            if (blob) {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'dispatched.png';
                a.click();
                URL.revokeObjectURL(url);
                toast.success('Image downloaded! Share it on WhatsApp manually.');
                
                if (groupLink) {
                    setTimeout(() => openWhatsAppGroup(groupLink), 500);
                }
                onClose();
            }
        } catch (error: any) {
            if (error.name !== 'AbortError') {
                console.error('Image share error:', error);
                toast.error('Failed to share image. Try again.');
            }
        } finally {
            setSharingImage(false);
        }
    };

    const handleCopyOnly = async () => {
        const success = await copyToClipboard(message);
        if (success) {
            setCopied(true);
            toast.success('Message copied! Open WhatsApp manually to paste.');
            setTimeout(() => setCopied(false), 2000);
        } else {
            toast.error('Failed to copy message');
        }
    };

    const locationNames: Record<string, string> = {
        godown: 'Godown',
        big_shop: 'Big Shop',
        small_shop: 'Small Shop',
    };

    // For text mode, we auto-execute and show minimal UI
    if (!isImageMode) {
        return (
            <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <MessageSquare className="h-5 w-5 text-green-600" />
                            Sharing to WhatsApp...
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="bg-green-50 p-4 rounded-lg text-center">
                            {copied ? (
                                <div className="flex items-center justify-center gap-2 text-green-700 font-medium">
                                    <Check className="h-5 w-5" />
                                    Message copied! Opening WhatsApp...
                                </div>
                            ) : (
                                <div className="flex items-center justify-center gap-2 text-gray-600">
                                    <Copy className="h-5 w-5 animate-pulse" />
                                    Copying message...
                                </div>
                            )}
                        </div>

                        {/* Fallback buttons */}
                        <div className="flex flex-col gap-2">
                            {groupLink && (
                                <Button
                                    onClick={() => { openWhatsAppGroup(groupLink); }}
                                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                                >
                                    <ExternalLink className="h-4 w-4 mr-2" />
                                    Open WhatsApp Group
                                </Button>
                            )}
                            <Button variant="outline" onClick={handleCopyOnly} className="w-full">
                                <Copy className="h-4 w-4 mr-2" />
                                Copy Message Again
                            </Button>
                            <Button variant="ghost" onClick={onClose} className="w-full text-gray-500">
                                <X className="h-4 w-4 mr-2" />
                                Close
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    // Image mode UI
    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Image className="h-5 w-5 text-purple-600" />
                        Share Dispatch Image
                    </DialogTitle>
                    <DialogDescription>
                        {dispatches.length > 1
                            ? 'Share batch dispatch image to WhatsApp'
                            : `Share dispatch to ${locationNames[dispatches[0].destination]} via image`}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Preview summary */}
                    <div className="bg-purple-50 p-3 rounded-lg">
                        <div className="text-sm text-purple-800 font-medium mb-1">📦 Dispatch Summary</div>
                        {dispatches.map((d, i) => (
                            <div key={i} className="text-xs text-purple-700">
                                {locationNames[d.source]} → {locationNames[d.destination]}: {d.bundles_count} {d.movement_type === 'pieces' ? 'Pcs' : 'Bundles'}
                            </div>
                        ))}
                    </div>

                    <div className="flex flex-col gap-2">
                        <Button
                            onClick={handleImageShare}
                            disabled={sharingImage}
                            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
                        >
                            {sharingImage ? (
                                <>
                                    <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                    Generating Image...
                                </>
                            ) : (
                                <>
                                    <Image className="h-4 w-4 mr-2" />
                                    Share Image to WhatsApp
                                </>
                            )}
                        </Button>

                        <Button
                            variant="outline"
                            onClick={handleTextShare}
                            className="w-full"
                        >
                            <Copy className="h-4 w-4 mr-2" />
                            Share as Text Instead
                        </Button>

                        <Button variant="ghost" onClick={onClose} className="w-full text-gray-500">
                            <X className="h-4 w-4 mr-2" />
                            Skip Sharing
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
