import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MessageSquare, Save, Loader2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import {
    WhatsAppSettings,
    getWhatsAppSettings,
    updateWhatsAppSetting,
} from '@/services/whatsappService';

export function WhatsAppSettingsPanel() {
    const [settings, setSettings] = useState<WhatsAppSettings>({
        whatsapp_enabled: false,
        whatsapp_mode: 'single',
        whatsapp_global_group: '',
        whatsapp_godown_group: '',
        whatsapp_big_shop_group: '',
        whatsapp_small_shop_group: '',
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        setLoading(true);
        const data = await getWhatsAppSettings();
        setSettings(data);
        setLoading(false);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const updates = [
                updateWhatsAppSetting('whatsapp_enabled', String(settings.whatsapp_enabled)),
                updateWhatsAppSetting('whatsapp_mode', settings.whatsapp_mode),
                updateWhatsAppSetting('whatsapp_global_group', settings.whatsapp_global_group),
                updateWhatsAppSetting('whatsapp_godown_group', settings.whatsapp_godown_group),
                updateWhatsAppSetting('whatsapp_big_shop_group', settings.whatsapp_big_shop_group),
                updateWhatsAppSetting('whatsapp_small_shop_group', settings.whatsapp_small_shop_group),
            ];

            const results = await Promise.all(updates);

            if (results.every(r => r)) {
                toast.success('WhatsApp settings saved successfully!');
            } else {
                toast.error('Some settings failed to save');
            }
        } catch (error) {
            toast.error('Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <Card className="backdrop-blur-sm bg-white/80 border-white/40">
                <CardContent className="flex items-center justify-center h-32">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="backdrop-blur-sm bg-white/80 border-white/40">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-800">
                    <MessageSquare className="h-5 w-5 text-green-600" />
                    WhatsApp Sharing Settings
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Enable/Disable Toggle */}
                <div className="flex items-center justify-between p-4 bg-gray-50/60 rounded-lg">
                    <div className="space-y-1">
                        <Label className="text-base font-medium">Enable WhatsApp Sharing</Label>
                        <p className="text-sm text-gray-500">
                            Show "Share to WhatsApp" button after dispatch
                        </p>
                    </div>
                    <Switch
                        checked={settings.whatsapp_enabled}
                        onCheckedChange={(checked) =>
                            setSettings({ ...settings, whatsapp_enabled: checked })
                        }
                    />
                </div>

                {settings.whatsapp_enabled && (
                    <>
                        {/* Mode Selection */}
                        <div className="space-y-2">
                            <Label>Sharing Mode</Label>
                            <Select
                                value={settings.whatsapp_mode}
                                onValueChange={(value: 'single' | 'multi') =>
                                    setSettings({ ...settings, whatsapp_mode: value })
                                }
                            >
                                <SelectTrigger className="bg-white/80">
                                    <SelectValue placeholder="Select mode" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="single">
                                        Single Group (All locations in one group)
                                    </SelectItem>
                                    <SelectItem value="multi">
                                        Multiple Groups (Separate group per location)
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Group Links */}
                        {settings.whatsapp_mode === 'single' ? (
                            <div className="space-y-2">
                                <Label>WhatsApp Group Invite Link</Label>
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="https://chat.whatsapp.com/AbCdEfGhIjKl..."
                                        value={settings.whatsapp_global_group}
                                        onChange={(e) =>
                                            setSettings({ ...settings, whatsapp_global_group: e.target.value })
                                        }
                                        className="bg-white/80"
                                    />
                                    {settings.whatsapp_global_group && (
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={() => window.open(settings.whatsapp_global_group, '_blank')}
                                        >
                                            <ExternalLink className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                                <p className="text-xs text-gray-500">
                                    Get this link from WhatsApp Group → Settings → Invite via link
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Godown Group Link</Label>
                                    <Input
                                        placeholder="https://chat.whatsapp.com/..."
                                        value={settings.whatsapp_godown_group}
                                        onChange={(e) =>
                                            setSettings({ ...settings, whatsapp_godown_group: e.target.value })
                                        }
                                        className="bg-white/80"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Big Shop Group Link</Label>
                                    <Input
                                        placeholder="https://chat.whatsapp.com/..."
                                        value={settings.whatsapp_big_shop_group}
                                        onChange={(e) =>
                                            setSettings({ ...settings, whatsapp_big_shop_group: e.target.value })
                                        }
                                        className="bg-white/80"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Small Shop Group Link</Label>
                                    <Input
                                        placeholder="https://chat.whatsapp.com/..."
                                        value={settings.whatsapp_small_shop_group}
                                        onChange={(e) =>
                                            setSettings({ ...settings, whatsapp_small_shop_group: e.target.value })
                                        }
                                        className="bg-white/80"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Help Text */}
                        <div className="bg-blue-50/60 p-4 rounded-lg text-sm text-blue-800">
                            <p className="font-medium mb-2">📱 How to get WhatsApp Group Link:</p>
                            <ol className="list-decimal list-inside space-y-1 text-xs">
                                <li>Open WhatsApp and go to your group</li>
                                <li>Tap group name at top → Group settings</li>
                                <li>Tap "Invite via link"</li>
                                <li>Tap "Copy link" and paste it here</li>
                            </ol>
                        </div>
                    </>
                )}

                {/* Save Button */}
                <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                >
                    {saving ? (
                        <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Save className="h-4 w-4 mr-2" />
                            Save WhatsApp Settings
                        </>
                    )}
                </Button>
            </CardContent>
        </Card>
    );
}
