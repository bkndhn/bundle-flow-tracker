
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Staff } from '@/types';
import { LOCATIONS, ROLES } from '@/lib/constants';
import { toast } from 'sonner';
import { Users, Plus } from 'lucide-react';

interface StaffManagementProps {
  staff: Staff[];
  onAddStaff: (staff: Omit<Staff, 'id' | 'created_at'>) => void;
}

export function StaffManagement({ staff, onAddStaff }: StaffManagementProps) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    location: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (!formData.name || !formData.role || !formData.location) {
        toast.error('Please fill in all fields');
        return;
      }

      const newStaff: Omit<Staff, 'id' | 'created_at'> = {
        name: formData.name,
        role: formData.role as Staff['role'],
        location: formData.location as Staff['location'],
      };

      onAddStaff(newStaff);
      
      // Reset form
      setFormData({
        name: '',
        role: '',
        location: '',
      });
      setShowForm(false);

      toast.success('Staff member added successfully!');
    } catch (error) {
      toast.error('Failed to add staff member');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRoleBadgeVariant = (role: Staff['role']) => {
    switch (role) {
      case 'admin': return 'default';
      case 'godown_staff': return 'secondary';
      case 'shop_staff': return 'outline';
      default: return 'secondary';
    }
  };

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Users className="h-5 w-5" />
          <h2 className="text-lg font-semibold text-gray-900">Staff Management</h2>
        </div>
        <Button 
          onClick={() => setShowForm(!showForm)}
          size="sm"
          className="flex items-center space-x-1"
        >
          <Plus className="h-4 w-4" />
          <span>Add Staff</span>
        </Button>
      </div>

      {/* Add Staff Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Staff Member</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  placeholder="Enter staff member name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Role *</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => setFormData({ ...formData, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="godown_staff">Godown Staff</SelectItem>
                    <SelectItem value="shop_staff">Shop Staff</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Location *</Label>
                <Select
                  value={formData.location}
                  onValueChange={(value) => setFormData({ ...formData, location: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="godown">Godown</SelectItem>
                    <SelectItem value="big_shop">Big Shop</SelectItem>
                    <SelectItem value="small_shop">Small Shop</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex space-x-2">
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  {isSubmitting ? 'Adding...' : 'Add Staff'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Staff List */}
      <div className="space-y-3">
        {staff.map((member) => (
          <Card key={member.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{member.name}</h3>
                  <p className="text-sm text-gray-600">{LOCATIONS[member.location]}</p>
                </div>
                <Badge variant={getRoleBadgeVariant(member.role)}>
                  {ROLES[member.role]}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {staff.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No staff members added yet</p>
          <Button 
            onClick={() => setShowForm(true)}
            className="mt-2"
          >
            Add First Staff Member
          </Button>
        </div>
      )}
    </div>
  );
}
