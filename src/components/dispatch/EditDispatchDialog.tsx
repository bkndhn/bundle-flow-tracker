
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { GoodsMovement } from '@/types';
import { toast } from 'sonner';

interface EditDispatchDialogProps {
  movement: GoodsMovement | null;
  open: boolean;
  onClose: () => void;
  onUpdate: (movementId: string, updates: any) => void;
}

export function EditDispatchDialog({ 
  movement, 
  open, 
  onClose, 
  onUpdate 
}: EditDispatchDialogProps) {
  const [formData, setFormData] = useState({
    bundles_count: movement?.bundles_count || 0,
    auto_name: movement?.auto_name || '',
    accompanying_person: movement?.accompanying_person || '',
    condition_notes: movement?.condition_notes || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (movement) {
      onUpdate(movement.id, {
        ...formData,
        last_edited_at: new Date().toISOString(),
        last_edited_by: 'admin@goods.com'
      });
      toast.success('Dispatch updated successfully');
      onClose();
    }
  };

  if (!movement) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Dispatch</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bundles">Bundles Count</Label>
            <Input
              id="bundles"
              type="number"
              value={formData.bundles_count}
              onChange={(e) => setFormData({...formData, bundles_count: parseInt(e.target.value)})}
              min="1"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="auto">Auto Name</Label>
            <Input
              id="auto"
              value={formData.auto_name}
              onChange={(e) => setFormData({...formData, auto_name: e.target.value})}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="person">Accompanying Person</Label>
            <Input
              id="person"
              value={formData.accompanying_person}
              onChange={(e) => setFormData({...formData, accompanying_person: e.target.value})}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.condition_notes}
              onChange={(e) => setFormData({...formData, condition_notes: e.target.value})}
              rows={3}
            />
          </div>
          
          <div className="flex gap-2 pt-4">
            <Button type="submit" className="flex-1">Update Dispatch</Button>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
