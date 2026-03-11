import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Staff } from '@/types';
import { LOCATIONS } from '@/lib/constants';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { UserPlus, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';

interface StaffLoginGeneratorProps {
  staff: Staff[];
  onComplete: () => void;
}

const LOCATION_EMAIL_MAP: Record<string, string> = {
  godown: 'godown',
  big_shop: 'bigshop',
  small_shop: 'smallshop',
};

const LOCATION_ROLE_MAP: Record<string, string> = {
  godown: 'godown_manager',
  big_shop: 'big_shop_manager',
  small_shop: 'small_shop_manager',
};

export function StaffLoginGenerator({ staff, onComplete }: StaffLoginGeneratorProps) {
  const [passwords, setPasswords] = useState({
    godown: '',
    big_shop: '',
    small_shop: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    godown: false,
    big_shop: false,
    small_shop: false,
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [results, setResults] = useState<{ name: string; email: string; status: 'success' | 'exists' | 'error' }[]>([]);

  const activeStaff = staff.filter(s => s.is_active !== false);

  const hashPassword = async (password: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const generateEmail = (staffName: string, location: string): string => {
    const cleanName = staffName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const domain = LOCATION_EMAIL_MAP[location] || 'staff';
    return `${cleanName}@${domain}.com`;
  };

  const handleGenerate = async () => {
    // Validate passwords
    const locations = ['godown', 'big_shop', 'small_shop'] as const;
    const staffByLocation = locations.reduce((acc, loc) => {
      acc[loc] = activeStaff.filter(s => s.location === loc);
      return acc;
    }, {} as Record<string, Staff[]>);

    for (const loc of locations) {
      if (staffByLocation[loc].length > 0 && !passwords[loc]) {
        toast.error(`Please set password for ${LOCATIONS[loc]} staff`);
        return;
      }
    }

    setIsGenerating(true);
    const generationResults: typeof results = [];

    try {
      for (const member of activeStaff) {
        const email = generateEmail(member.name, member.location);
        const role = LOCATION_ROLE_MAP[member.location];
        const password = passwords[member.location as keyof typeof passwords];

        if (!password) continue;

        // Check if user already exists
        const { data: existing } = await supabase
          .from('app_users')
          .select('id')
          .eq('email', email)
          .single();

        if (existing) {
          // Update linked_staff_id and password
          const hashedPassword = await hashPassword(password);
          await supabase
            .from('app_users')
            .update({
              password_hash: hashedPassword,
              role,
              linked_staff_id: member.id,
            } as any)
            .eq('id', existing.id);

          generationResults.push({ name: member.name, email, status: 'exists' });
        } else {
          // Create new user
          const hashedPassword = await hashPassword(password);
          const { error } = await supabase
            .from('app_users')
            .insert({
              email,
              password_hash: hashedPassword,
              role,
              linked_staff_id: member.id,
            } as any);

          if (error) {
            console.error(`Failed to create login for ${member.name}:`, error);
            generationResults.push({ name: member.name, email, status: 'error' });
          } else {
            generationResults.push({ name: member.name, email, status: 'success' });
          }
        }
      }

      setResults(generationResults);
      const successCount = generationResults.filter(r => r.status === 'success' || r.status === 'exists').length;
      toast.success(`${successCount} staff logins generated/updated successfully!`);
      onComplete();
    } catch (error) {
      console.error('Error generating logins:', error);
      toast.error('Failed to generate staff logins');
    } finally {
      setIsGenerating(false);
    }
  };

  const locationGroups = [
    { key: 'godown' as const, label: 'Godown' },
    { key: 'big_shop' as const, label: 'Big Shop' },
    { key: 'small_shop' as const, label: 'Small Shop' },
  ];

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-gray-800">
          <UserPlus className="h-5 w-5" />
          Generate Staff Logins
        </CardTitle>
        <CardDescription>
          Create login accounts for all staff members. Email format: staffname@location.com. 
          Set one password per location — all staff at the same location share the same password.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Password inputs per location */}
        {locationGroups.map(({ key, label }) => {
          const locationStaff = activeStaff.filter(s => s.location === key);
          if (locationStaff.length === 0) return null;

          return (
            <div key={key} className="space-y-3 p-4 border rounded-lg bg-white/60">
              <div className="flex items-center justify-between">
                <Label className="font-semibold text-gray-800">{label} Password</Label>
                <Badge variant="secondary" className="text-xs">
                  {locationStaff.length} staff
                </Badge>
              </div>
              <div className="relative">
                <Input
                  type={showPasswords[key] ? 'text' : 'password'}
                  placeholder={`Set password for all ${label} staff`}
                  value={passwords[key]}
                  onChange={(e) => setPasswords({ ...passwords, [key]: e.target.value })}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords({ ...showPasswords, [key]: !showPasswords[key] })}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPasswords[key] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <div className="flex flex-wrap gap-1">
                {locationStaff.map(s => (
                  <Badge key={s.id} variant="outline" className="text-xs">
                    {generateEmail(s.name, s.location)}
                  </Badge>
                ))}
              </div>
            </div>
          );
        })}

        <Button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="w-full"
        >
          {isGenerating ? 'Generating Logins...' : 'Generate All Staff Logins'}
        </Button>

        {/* Results */}
        {results.length > 0 && (
          <div className="space-y-2 mt-4">
            <Label className="font-semibold">Results</Label>
            <div className="space-y-1 max-h-60 overflow-y-auto">
              {results.map((r, i) => (
                <div key={i} className="flex items-center gap-2 text-sm p-2 rounded bg-gray-50">
                  {r.status === 'success' ? (
                    <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
                  ) : r.status === 'exists' ? (
                    <CheckCircle className="h-4 w-4 text-blue-600 shrink-0" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
                  )}
                  <span className="font-medium">{r.name}</span>
                  <span className="text-gray-500">→</span>
                  <span className="text-gray-700 truncate">{r.email}</span>
                  {r.status === 'exists' && (
                    <Badge variant="secondary" className="text-xs ml-auto">Updated</Badge>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
