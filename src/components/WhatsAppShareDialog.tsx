import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { MessageSquare, Copy, Check, X, Image } from 'lucide-react';
import { toast } from 'sonner';
import {
    WhatsAppSettings,
    generateWhatsAppMessage,
    generateBatchWhatsAppMessage,
    getWhatsAppGroupLink,
    copyToClipboard,
    openWhatsAppGroup,
} from '@/services/whatsappService';
import { openDispatchImageCard, DispatchImageData } from '@/services/whatsappImageService';

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

    const isBatch = Array.isArray(dispatchData);
    const dispatches = isBatch ? dispatchData : [dispatchData];

    const message = dispatches.length > 1
        ? generateBatchWhatsAppMessage(dispatches)
        : generateWhatsAppMessage(dispatches[0]);

    const groupLink = getWhatsAppGroupLink(settings, dispatches[0].destination);

    const isImageMode = settings.whatsapp_share_format === 'image';

    const handleCopyAndShare = async () => {
        const success = await copyToClipboard(message);

        if (success) {
            setCopied(true);
            toast.success('Message copied to clipboard!');

            setTimeout(() => {
                if (groupLink) {
                    openWhatsAppGroup(groupLink);
                }
                setTimeout(() => {
                    setCopied(false);
                    onClose();
                }, 1000);
            }, 500);
        } else {
            toast.error('Failed to copy message');
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

    const handleImageShare = () => {
        const data: DispatchImageData = {
            ...dispatches[0],
            transport_method: dispatches[0].transport_method || 'auto',
            auto_name: dispatches[0].auto_name || '',
        };
        openDispatchImageCard(data);
        onClose();
    };

    const locationNames: Record<string, string> = {
        godown: 'Godown',
        big_shop: 'Big Shop',
        small_shop: 'Small Shop',
    };

    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5 text-green-600" />
                        Share to WhatsApp
                    </DialogTitle>
                    <DialogDescription>
                        {settings.whatsapp_mode === 'single'
                            ? (dispatches.length > 1 ? 'Share batch dispatch to the team group' : 'Share dispatch details to the team group')
                            : `Share dispatch details to ${locationNames[dispatches[0].destination]} group`}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Message Preview */}
                    <div className="bg-gray-50 p-3 rounded-lg max-h-48 overflow-y-auto">
                        <pre className="text-xs text-gray-700 whitespace-pre-wrap font-sans">
                            {message}
                        </pre>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-2">
                        {/* Image Card Button - shown prominently if image mode */}
                        {isImageMode && (
                            <Button
                                onClick={handleImageShare}
                                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
                            >
                                <Image className="h-4 w-4 mr-2" />
                                Open Image Card (Save & Share)
                            </Button>
                        )}

                        {groupLink ? (
                            <Button
                                onClick={handleCopyAndShare}
                                className={`w-full ${isImageMode ? 'bg-green-500 hover:bg-green-600' : 'bg-green-600 hover:bg-green-700'} text-white`}
                                disabled={copied}
                            >
                                {copied ? (
                                    <>
                                        <Check className="h-4 w-4 mr-2" />
                                        Copied! Opening WhatsApp...
                                    </>
                                ) : (
                                    <>
                                        <Copy className="h-4 w-4 mr-2" />
                                        Copy Text & Open WhatsApp
                                    </>
                                )}
                            </Button>
                        ) : (
                            !isImageMode && (
                                <div className="text-center text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
                                    ⚠️ No group link configured for this destination.
                                    <br />
                                    <span className="text-xs text-gray-500">
                                        Ask admin to set up WhatsApp group links in settings.
                                    </span>
                                </div>
                            )
                        )}

                        {!isImageMode && (
                            <Button
                                variant="outline"
                                onClick={handleCopyOnly}
                                className="w-full"
                            >
                                <Copy className="h-4 w-4 mr-2" />
                                Copy Message Only
                            </Button>
                        )}

                        <Button
                            variant="ghost"
                            onClick={onClose}
                            className="w-full text-gray-500"
                        >
                            <X className="h-4 w-4 mr-2" />
                            Skip WhatsApp Sharing
                        </Button>
                    </div>

                    {/* Help Text */}
                    <p className="text-xs text-gray-500 text-center">
                        {isImageMode 
                            ? 'Image card opens in new window. Screenshot or print to share.'
                            : 'After copying, paste the message in your WhatsApp group and send.'}
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
}
