import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Staff } from '@/types';
import { LOCATIONS } from '@/lib/constants';
import { toast } from 'sonner';
import { Users, Plus, Edit, Trash2 } from 'lucide-react';
import { UserManagement } from './UserManagement';
import { WhatsAppSettingsPanel } from './WhatsAppSettingsPanel';

interface StaffManagementProps {
  staff: Staff[];
  onAddStaff: (staff: Omit<Staff, 'id' | 'created_at'>) => void;
  onUpdateStaff: (id: string, staff: Omit<Staff, 'id' | 'created_at'>) => void;
  onDeleteStaff: (id: string) => void;
}

export function StaffManagement({ staff, onAddStaff, onUpdateStaff, onDeleteStaff }: StaffManagementProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [addFormData, setAddFormData] = useState({
    name: '',
    location: '',
  });
  const [editFormData, setEditFormData] = useState({
    name: '',
    location: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (!addFormData.name || !addFormData.location) {
        toast.error('Please fill in all fields');
        return;
      }

      const newStaff: Omit<Staff, 'id' | 'created_at'> = {
        name: addFormData.name,
        role: addFormData.location === 'godown' ? 'godown_staff' : 'shop_staff',
        location: addFormData.location as Staff['location'],
      };

      await onAddStaff(newStaff);

      // Reset form
      setAddFormData({
        name: '',
        location: '',
      });
      setShowAddForm(false);
    } catch (error) {
      toast.error('Failed to add staff member');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff) return;

    setIsSubmitting(true);

    try {
      if (!editFormData.name || !editFormData.location) {
        toast.error('Please fill in all fields');
        return;
      }

      const updatedStaff: Omit<Staff, 'id' | 'created_at'> = {
        name: editFormData.name,
        role: editFormData.location === 'godown' ? 'godown_staff' : 'shop_staff',
        location: editFormData.location as Staff['location'],
      };

      await onUpdateStaff(editingStaff.id, updatedStaff);
      setEditingStaff(null);
    } catch (error) {
      toast.error('Failed to update staff member');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (member: Staff) => {
    setEditingStaff(member);
    setEditFormData({
      name: member.name,
      location: member.location,
    });
  };

  const handleDelete = async (id: string) => {
    try {
      await onDeleteStaff(id);
    } catch (error) {
      toast.error('Failed to delete staff member');
    }
  };

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          <Users className="h-5 w-5" />
          <h2 className="text-lg font-semibold text-gray-900">Staff Management</h2>
        </div>
        <Button
          onClick={() => setShowAddForm(!showAddForm)}
          size="sm"
          className="flex items-center space-x-1 w-full sm:w-auto justify-center"
        >
          <Plus className="h-4 w-4" />
          <span>Add Staff</span>
        </Button>
      </div>

      {/* Add Staff Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Staff Member</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="add-name">Name *</Label>
                <Input
                  id="add-name"
                  placeholder="Enter staff member name"
                  value={addFormData.name}
                  onChange={(e) => setAddFormData({ ...addFormData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Location *</Label>
                <Select
                  value={addFormData.location}
                  onValueChange={(value) => setAddFormData({ ...addFormData, location: value })}
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
                  onClick={() => setShowAddForm(false)}
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
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 truncate">{member.name}</h3>
                  <p className="text-sm text-gray-600 truncate">{LOCATIONS[member.location]}</p>
                </div>
                <div className="flex items-center space-x-1 sm:space-x-2">
                  <Badge variant="secondary" className="hidden xs:inline-flex">
                    {LOCATIONS[member.location]}
                  </Badge>

                  {/* Edit Button */}
                  <Dialog open={editingStaff?.id === member.id} onOpenChange={(open) => !open && setEditingStaff(null)}>
                    <DialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(member)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Edit Staff Member</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleEditSubmit} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="edit-name">Name *</Label>
                          <Input
                            id="edit-name"
                            placeholder="Enter staff member name"
                            value={editFormData.name}
                            onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Location *</Label>
                          <Select
                            value={editFormData.location}
                            onValueChange={(value) => setEditFormData({ ...editFormData, location: value })}
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
                            {isSubmitting ? 'Updating...' : 'Update Staff'}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setEditingStaff(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>

                  {/* Delete Button */}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="outline">
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Staff Member</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete {member.name}? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(member.id)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {staff.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No staff members added yet</p>
          <Button
            onClick={() => setShowAddForm(true)}
            className="mt-2"
          >
            Add First Staff Member
          </Button>
        </div>
      )}

      {/* User Credentials Management Section */}
      <UserManagement />

      {/* WhatsApp Settings Section */}
      <WhatsAppSettingsPanel />
    </div>
  );
}
