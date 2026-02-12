
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Users, Edit, Eye, EyeOff, Shield, Key } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface AppUserData {
    id: string;
    email: string;
    role: string;
    created_at: string;
}

const ROLE_LABELS: Record<string, string> = {
    admin: 'Administrator',
    godown_manager: 'Godown Manager',
    big_shop_manager: 'Big Shop Manager',
    small_shop_manager: 'Small Shop Manager'
};

export function UserManagement() {
    const { logout } = useAuth();
    const [users, setUsers] = useState<AppUserData[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingUser, setEditingUser] = useState<AppUserData | null>(null);
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('app_users')
                .select('*')
                .order('role', { ascending: true });

            if (error) throw error;
            setUsers(data || []);
        } catch (error) {
            console.error('Error loading users:', error);
            toast.error('Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    const handleEditClick = (user: AppUserData) => {
        setEditingUser(user);
        setFormData({
            email: user.email,
            password: '',
            confirmPassword: ''
        });
        setShowEditDialog(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUser) return;

        // Validation
        if (!formData.email) {
            toast.error('Email is required');
            return;
        }

        if (formData.password && formData.password !== formData.confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        if (formData.password && formData.password.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }

        setIsSubmitting(true);

        try {
            // Update user email if changed
            if (formData.email !== editingUser.email) {
                const { error: emailError } = await supabase
                    .from('app_users')
                    .update({ email: formData.email })
                    .eq('id', editingUser.id);

                if (emailError) throw emailError;
            }

            // Update password if provided (hash it)
            if (formData.password) {
                const hashedPassword = await hashPassword(formData.password);

                const { error: passError } = await supabase
                    .from('app_users')
                    .update({ password_hash: hashedPassword })
                    .eq('id', editingUser.id);

                if (passError) throw passError;

                // Store a password version timestamp so other logged-in sessions of this user get forced out
                await supabase
                    .from('app_settings' as any)
                    .upsert({
                        setting_key: `password_changed_${editingUser.id}`,
                        setting_value: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    }, { onConflict: 'setting_key' });
            }

            toast.success('User credentials updated successfully');

            // If the admin changed their own credentials, force their own re-login
            const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
            if (currentUser.id === editingUser.id && (formData.email !== editingUser.email || formData.password)) {
                toast.info('Your credentials changed. Please log in again.');
                setTimeout(() => {
                    logout();
                }, 1500);
            } else {
                setShowEditDialog(false);
                loadUsers();
                if (formData.password) {
                    toast.info(`${editingUser.email} will be logged out on their next session check.`);
                }
            }
        } catch (error) {
            console.error('Error updating user:', error);
            toast.error('Failed to update user credentials');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Simple hash function (in production, use bcrypt via backend)
    const hashPassword = async (password: string): Promise<string> => {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <Card className="mt-6">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-800">
                    <Shield className="h-5 w-5" />
                    User Credentials Management
                </CardTitle>
                <CardDescription>
                    Manage login credentials for all system users. Password changes will force the user to log in again.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {users.map((user) => (
                        <div
                            key={user.id}
                            className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg bg-white/60 gap-3"
                        >
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <h3 className="font-medium text-gray-900 truncate">{user.email}</h3>
                                    <Badge variant="secondary" className="text-xs">
                                        {ROLE_LABELS[user.role] || user.role}
                                    </Badge>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                    Created: {new Date(user.created_at).toLocaleDateString()}
                                </p>
                            </div>
                            <Dialog open={showEditDialog && editingUser?.id === user.id} onOpenChange={(open) => {
                                if (!open) {
                                    setShowEditDialog(false);
                                    setEditingUser(null);
                                }
                            }}>
                                <DialogTrigger asChild>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleEditClick(user)}
                                        className="w-full sm:w-auto"
                                    >
                                        <Key className="h-4 w-4 mr-2" />
                                        Edit Credentials
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-md">
                                    <DialogHeader>
                                        <DialogTitle className="flex items-center gap-2">
                                            <Key className="h-5 w-5" />
                                            Edit User Credentials
                                        </DialogTitle>
                                        <DialogDescription>
                                            Update email or password for {ROLE_LABELS[user.role]}. Leave password blank to keep unchanged.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <form onSubmit={handleSubmit} className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="edit-email">Email Address</Label>
                                            <Input
                                                id="edit-email"
                                                type="email"
                                                placeholder="Enter email"
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                required
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="edit-password">New Password (leave blank to keep unchanged)</Label>
                                            <div className="relative">
                                                <Input
                                                    id="edit-password"
                                                    type={showPassword ? 'text' : 'password'}
                                                    placeholder="Enter new password"
                                                    value={formData.password}
                                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                                >
                                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                </button>
                                            </div>
                                        </div>

                                        {formData.password && (
                                            <div className="space-y-2">
                                                <Label htmlFor="edit-confirm-password">Confirm New Password</Label>
                                                <div className="relative">
                                                    <Input
                                                        id="edit-confirm-password"
                                                        type={showConfirmPassword ? 'text' : 'password'}
                                                        placeholder="Confirm new password"
                                                        value={formData.confirmPassword}
                                                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                                    >
                                                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex flex-col sm:flex-row gap-2 pt-2">
                                            <Button
                                                type="submit"
                                                disabled={isSubmitting}
                                                className="flex-1"
                                            >
                                                {isSubmitting ? 'Updating...' : 'Update Credentials'}
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => {
                                                    setShowEditDialog(false);
                                                    setEditingUser(null);
                                                }}
                                                className="flex-1 sm:flex-none"
                                            >
                                                Cancel
                                            </Button>
                                        </div>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        </div>
                    ))}

                    {users.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                            No users found
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
