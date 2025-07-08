
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GoodsMovement } from '@/types';
import { LOCATIONS } from '@/lib/constants';
import { EditDispatchDialog } from './EditDispatchDialog';
import { Edit2, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface DispatchListProps {
  movements: GoodsMovement[];
  onUpdate: (movementId: string, updates: any) => void;
  onDelete: (movementId: string) => void;
}

export function DispatchList({ movements, onUpdate, onDelete }: DispatchListProps) {
  const { user } = useAuth();
  const [editingMovement, setEditingMovement] = useState<GoodsMovement | null>(null);
  
  const isAdmin = user?.email === 'admin@goods.com';
  const editableMovements = movements.filter(m => m.status === 'dispatched');

  if (editableMovements.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No dispatches available for editing
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Recent Dispatches</h3>
      
      {editableMovements.slice(0, 5).map((movement) => (
        <Card key={movement.id} className="backdrop-blur-sm bg-white/70 border-white/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <Badge variant="secondary" className="bg-blue-100/80 text-blue-800">
                    {movement.bundles_count} bundles
                  </Badge>
                  <Badge variant="outline" className="capitalize bg-white/60">
                    {movement.item === 'both' ? movement.item_summary_display : movement.item}
                  </Badge>
                </div>
                <p className="text-sm text-gray-700">
                  <strong>To:</strong> {LOCATIONS[movement.destination]}
                </p>
                <p className="text-sm text-gray-700">
                  <strong>Auto:</strong> {movement.auto_name}
                </p>
                <p className="text-xs text-gray-500">
                  Sent: {new Date(movement.dispatch_date).toLocaleString()}
                </p>
                {movement.last_edited_at && (
                  <p className="text-xs text-orange-600">
                    Last edited: {new Date(movement.last_edited_at).toLocaleString()}
                  </p>
                )}
              </div>
              
              {isAdmin && (
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditingMovement(movement)}
                    className="h-8 w-8 p-0"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onDelete(movement.id)}
                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
      
      <EditDispatchDialog
        movement={editingMovement}
        open={!!editingMovement}
        onClose={() => setEditingMovement(null)}
        onUpdate={onUpdate}
      />
    </div>
  );
}
