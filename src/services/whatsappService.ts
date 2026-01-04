import { supabase } from '@/integrations/supabase/client';

export interface WhatsAppSettings {
    whatsapp_enabled: boolean;
    whatsapp_mode: 'single' | 'multi';
    whatsapp_global_group: string;
    whatsapp_godown_group: string;
    whatsapp_big_shop_group: string;
    whatsapp_small_shop_group: string;
}

const DEFAULT_SETTINGS: WhatsAppSettings = {
    whatsapp_enabled: false,
    whatsapp_mode: 'single',
    whatsapp_global_group: '',
    whatsapp_godown_group: '',
    whatsapp_big_shop_group: '',
    whatsapp_small_shop_group: '',
};

export const getWhatsAppSettings = async (): Promise<WhatsAppSettings> => {
    try {
        const { data, error } = await supabase
            .from('app_settings' as any)
            .select('setting_key, setting_value');

        if (error) {
            console.error('Error fetching WhatsApp settings:', error);
            return DEFAULT_SETTINGS;
        }

        const settings = { ...DEFAULT_SETTINGS };

        data?.forEach((row: any) => {
            if (row.setting_key === 'whatsapp_enabled') {
                settings.whatsapp_enabled = row.setting_value === 'true';
            } else if (row.setting_key === 'whatsapp_mode') {
                settings.whatsapp_mode = row.setting_value as 'single' | 'multi';
            } else if (row.setting_key in settings) {
                (settings as any)[row.setting_key] = row.setting_value || '';
            }
        });

        return settings;
    } catch (error) {
        console.error('Error fetching WhatsApp settings:', error);
        return DEFAULT_SETTINGS;
    }
};

export const updateWhatsAppSetting = async (key: string, value: string): Promise<boolean> => {
    try {
        const { error } = await supabase
            .from('app_settings' as any)
            .upsert({
                setting_key: key,
                setting_value: value,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'setting_key'
            });

        if (error) {
            console.error('Error updating WhatsApp setting:', error);
            return false;
        }

        return true;
    } catch (error) {
        console.error('Error updating WhatsApp setting:', error);
        return false;
    }
};

export const generateWhatsAppMessage = (dispatchData: {
    item: string;
    bundles_count: number;
    movement_type: string;
    source: string;
    destination: string;
    auto_name: string;
    sent_by_name: string;
    accompanying_person?: string;
    dispatch_notes?: string;
    fare_display_msg?: string;
    shirt_bundles?: number;
    pant_bundles?: number;
}): string => {
    const locationNames: Record<string, string> = {
        godown: 'Godown',
        big_shop: 'Big Shop',
        small_shop: 'Small Shop',
    };

    const now = new Date();
    const dateStr = now.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
    const timeStr = now.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
    });

    const countLabel = dispatchData.movement_type === 'pieces' ? 'Pcs' : 'Bundles';

    // Build item details based on item type
    let itemDetails = '';
    if (dispatchData.item === 'both') {
        itemDetails = `📦 *Item:* Both (Shirt + Pant)
👕 *Shirt:* ${dispatchData.shirt_bundles || 0} ${countLabel}
👖 *Pant:* ${dispatchData.pant_bundles || 0} ${countLabel}
📊 *Total:* ${dispatchData.bundles_count} ${countLabel}`;
    } else {
        const itemName = dispatchData.item.charAt(0).toUpperCase() + dispatchData.item.slice(1);
        const itemEmoji = dispatchData.item === 'shirt' ? '👕' : '👖';
        itemDetails = `📦 *Item:* ${itemName}
${itemEmoji} *${countLabel}:* ${dispatchData.bundles_count}`;
    }

    let message = `🚚 *DISPATCH ALERT*
━━━━━━━━━━━━━━━━━

${itemDetails}
🏭 *From:* ${locationNames[dispatchData.source] || dispatchData.source}
🏪 *To:* ${locationNames[dispatchData.destination] || dispatchData.destination}

🚗 *Auto:* ${dispatchData.auto_name}
👤 *Sent by:* ${dispatchData.sent_by_name}
🧑 *Accompanying:* ${dispatchData.accompanying_person || 'N/A'}`;

    if (dispatchData.fare_display_msg) {
        message += `\n💰 *${dispatchData.fare_display_msg}*`;
    }

    message += `\n📝 *Notes:* ${dispatchData.dispatch_notes || 'None'}`;

    message += `

⏰ *Dispatched:* ${dateStr}, ${timeStr}

━━━━━━━━━━━━━━━━━
Please confirm receipt in app ✅`;

    return message;
};

export const getWhatsAppGroupLink = (
    settings: WhatsAppSettings,
    destination: string
): string | null => {
    if (!settings.whatsapp_enabled) {
        return null;
    }

    if (settings.whatsapp_mode === 'single') {
        return settings.whatsapp_global_group || null;
    }

    // Multi-group mode
    switch (destination) {
        case 'godown':
            return settings.whatsapp_godown_group || null;
        case 'big_shop':
            return settings.whatsapp_big_shop_group || null;
        case 'small_shop':
            return settings.whatsapp_small_shop_group || null;
        default:
            return settings.whatsapp_global_group || null;
    }
};

export const copyToClipboard = async (text: string): Promise<boolean> => {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (error) {
        console.error('Failed to copy to clipboard:', error);
        return false;
    }
};

export const openWhatsAppGroup = (groupLink: string): void => {
    // Extract the group ID from the link
    const groupId = groupLink.replace('https://chat.whatsapp.com/', '');

    // On mobile, this will open WhatsApp app
    // On desktop, this will open WhatsApp Web
    window.open(groupLink, '_blank');
};

// Generate a combined message for batch dispatches (multiple movements at once)
export const generateBatchWhatsAppMessage = (dispatches: Array<{
    item: string;
    bundles_count: number;
    movement_type: string;
    source: string;
    destination: string;
    auto_name: string;
    sent_by_name: string;
    accompanying_person?: string;
    dispatch_notes?: string;
    fare_display_msg?: string;
    shirt_bundles?: number;
    pant_bundles?: number;
}>): string => {
    const locationNames: Record<string, string> = {
        godown: 'Godown',
        big_shop: 'Big Shop',
        small_shop: 'Small Shop',
    };

    const now = new Date();
    const dateStr = now.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
    const timeStr = now.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
    });

    // Get common data from first dispatch
    const firstDispatch = dispatches[0];
    const countLabel = firstDispatch.movement_type === 'pieces' ? 'Pcs' : 'Bundles';

    // Build dispatch details for each destination
    let dispatchDetails = '';
    let grandTotalShirt = 0;
    let grandTotalPant = 0;
    let grandTotal = 0;

    dispatches.forEach((dispatch, index) => {
        const shirtCount = dispatch.shirt_bundles || 0;
        const pantCount = dispatch.pant_bundles || 0;

        grandTotalShirt += shirtCount;
        grandTotalPant += pantCount;
        grandTotal += dispatch.bundles_count;

        dispatchDetails += `
📍 *To ${locationNames[dispatch.destination] || dispatch.destination}:*
   👕 Shirt: ${shirtCount} ${countLabel}
   👖 Pant: ${pantCount} ${countLabel}
   📊 Subtotal: ${dispatch.bundles_count} ${countLabel}
`;
    });

    let message = `🚚 *DISPATCH ALERT*
━━━━━━━━━━━━━━━━━

📦 *Batch Dispatch Summary*
${dispatchDetails}
━━━━━━━━━━━━━━━━━
📊 *GRAND TOTAL:*
   👕 Shirt: ${grandTotalShirt} ${countLabel}
   👖 Pant: ${grandTotalPant} ${countLabel}
   📦 Total: ${grandTotal} ${countLabel}
━━━━━━━━━━━━━━━━━

🏭 *From:* ${locationNames[firstDispatch.source] || firstDispatch.source}
🚗 *Auto:* ${firstDispatch.auto_name}
👤 *Sent by:* ${firstDispatch.sent_by_name}
🧑 *Accompanying:* ${firstDispatch.accompanying_person || 'N/A'}`;

    if (firstDispatch.fare_display_msg) {
        message += `\n💰 *${firstDispatch.fare_display_msg}*`;
    }

    message += `\n📝 *Notes:* ${firstDispatch.dispatch_notes || 'None'}`;

    message += `

⏰ *Dispatched:* ${dateStr}, ${timeStr}

━━━━━━━━━━━━━━━━━
Please confirm receipt in app ✅`;

    return message;
};
