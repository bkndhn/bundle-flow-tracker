import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MessageSquare, Save, Loader2, ExternalLink, Image, Type } from 'lucide-react';
import { toast } from 'sonner';
import { WhatsAppSettings, getWhatsAppSettings, updateWhatsAppSetting } from '@/services/whatsappService';

export function WhatsAppSettingsPanel() {
    const [settings, setSettings] = useState<WhatsAppSettings>({
        whatsapp_enabled: false, whatsapp_mode: 'single', whatsapp_share_format: 'text',
        whatsapp_global_group: '', whatsapp_godown_group: '', whatsapp_big_shop_group: '', whatsapp_small_shop_group: '',
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => { loadSettings(); }, []);

    const loadSettings = async () => { setLoading(true); const data = await getWhatsAppSettings(); setSettings(data); setLoading(false); };

    const handleSave = async () => {
        setSaving(true);
        try {
            const updates = [
                updateWhatsAppSetting('whatsapp_enabled', String(settings.whatsapp_enabled)),
                updateWhatsAppSetting('whatsapp_mode', settings.whatsapp_mode),
                updateWhatsAppSetting('whatsapp_share_format', settings.whatsapp_share_format),
                updateWhatsAppSetting('whatsapp_global_group', settings.whatsapp_global_group),
                updateWhatsAppSetting('whatsapp_godown_group', settings.whatsapp_godown_group),
                updateWhatsAppSetting('whatsapp_big_shop_group', settings.whatsapp_big_shop_group),
                updateWhatsAppSetting('whatsapp_small_shop_group', settings.whatsapp_small_shop_group),
            ];
            const results = await Promise.all(updates);
            if (results.every(r => r)) { toast.success('WhatsApp settings saved successfully!'); }
            else { toast.error('Some settings failed to save'); }
        } catch (error) { toast.error('Failed to save settings'); } finally { setSaving(false); }
    };

    if (loading) {
        return (
            <Card className="backdrop-blur-sm bg-card/80 border-border">
                <CardContent className="flex items-center justify-center h-32"><Loader2 className="h-6 w-6 animate-spin text-primary" /></CardContent>
            </Card>
        );
    }

    return (
        <Card className="backdrop-blur-sm bg-card/80 border-border">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                    <MessageSquare className="h-5 w-5 text-green-600 dark:text-green-400" />
                    WhatsApp Sharing Settings
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div className="space-y-1">
                        <Label className="text-base font-medium text-foreground">Enable WhatsApp Sharing</Label>
                        <p className="text-sm text-muted-foreground">Show "Share to WhatsApp" button after dispatch</p>
                    </div>
                    <Switch checked={settings.whatsapp_enabled} onCheckedChange={(checked) => setSettings({ ...settings, whatsapp_enabled: checked })} />
                </div>

                {settings.whatsapp_enabled && (
                    <>
                        <div className="space-y-3">
                            <Label className="text-base font-medium text-foreground">Share Format</Label>
                            <div className="grid grid-cols-2 gap-3">
                                <button type="button" onClick={() => setSettings({ ...settings, whatsapp_share_format: 'text' })}
                                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                                        settings.whatsapp_share_format === 'text'
                                            ? 'border-green-500 bg-green-50 dark:bg-green-900/30 shadow-md'
                                            : 'border-border bg-card hover:border-muted-foreground/30'
                                    }`}>
                                    <Type className={`h-8 w-8 ${settings.whatsapp_share_format === 'text' ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`} />
                                    <span className={`text-sm font-semibold ${settings.whatsapp_share_format === 'text' ? 'text-green-700 dark:text-green-300' : 'text-muted-foreground'}`}>Text Message</span>
                                    <span className="text-xs text-muted-foreground text-center">Copy & paste text to WhatsApp</span>
                                </button>
                                <button type="button" onClick={() => setSettings({ ...settings, whatsapp_share_format: 'image' })}
                                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                                        settings.whatsapp_share_format === 'image'
                                            ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30 shadow-md'
                                            : 'border-border bg-card hover:border-muted-foreground/30'
                                    }`}>
                                    <Image className={`h-8 w-8 ${settings.whatsapp_share_format === 'image' ? 'text-purple-600 dark:text-purple-400' : 'text-muted-foreground'}`} />
                                    <span className={`text-sm font-semibold ${settings.whatsapp_share_format === 'image' ? 'text-purple-700 dark:text-purple-300' : 'text-muted-foreground'}`}>Image Card</span>
                                    <span className="text-xs text-muted-foreground text-center">Beautiful colorful card format</span>
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-foreground">Sharing Mode</Label>
                            <Select value={settings.whatsapp_mode} onValueChange={(value: 'single' | 'multi') => setSettings({ ...settings, whatsapp_mode: value })}>
                                <SelectTrigger className="bg-background"><SelectValue placeholder="Select mode" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="single">Single Group (All locations in one group)</SelectItem>
                                    <SelectItem value="multi">Multiple Groups (Separate group per location)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {settings.whatsapp_mode === 'single' ? (
                            <div className="space-y-2">
                                <Label className="text-foreground">WhatsApp Group Invite Link</Label>
                                <div className="flex gap-2">
                                    <Input placeholder="https://chat.whatsapp.com/AbCdEfGhIjKl..." value={settings.whatsapp_global_group} onChange={(e) => setSettings({ ...settings, whatsapp_global_group: e.target.value })} className="bg-background" />
                                    {settings.whatsapp_global_group && (
                                        <Button variant="outline" size="icon" onClick={() => window.open(settings.whatsapp_global_group, '_blank')}><ExternalLink className="h-4 w-4" /></Button>
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground">Get this link from WhatsApp Group → Settings → Invite via link</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {[{ key: 'whatsapp_godown_group', label: 'Godown Group Link' }, { key: 'whatsapp_big_shop_group', label: 'Big Shop Group Link' }, { key: 'whatsapp_small_shop_group', label: 'Small Shop Group Link' }].map(({ key, label }) => (
                                    <div key={key} className="space-y-2">
                                        <Label className="text-foreground">{label}</Label>
                                        <Input placeholder="https://chat.whatsapp.com/..." value={(settings as any)[key]} onChange={(e) => setSettings({ ...settings, [key]: e.target.value })} className="bg-background" />
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-sm text-blue-800 dark:text-blue-300">
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

                <Button onClick={handleSave} disabled={saving} className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white">
                    {saving ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</>) : (<><Save className="h-4 w-4 mr-2" />Save WhatsApp Settings</>)}
                </Button>
            </CardContent>
        </Card>
    );
}
