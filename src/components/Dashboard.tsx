import { useState, useMemo, useCallback, memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { GoodsMovement } from '@/types';
import { Package, Truck, CheckCircle, TrendingUp, Shirt } from 'lucide-react';

interface DashboardProps {
  movements: GoodsMovement[];
}

// Memoized stat card component
const StatCard = memo(function StatCard({ 
  label, 
  value, 
  icon: Icon, 
  iconColor = 'text-white/60' 
}: { 
  label: string; 
  value: number | string; 
  icon: React.ComponentType<{ className?: string }>; 
  iconColor?: string;
}) {
  return (
    <Card className="backdrop-blur-xl bg-white/10 border-white/20">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/80 text-sm">{label}</p>
            <p className="text-white text-2xl font-bold">{value}</p>
          </div>
          <Icon className={`h-8 w-8 ${iconColor}`} />
        </div>
      </CardContent>
    </Card>
  );
});

export const Dashboard = memo(function Dashboard({ movements }: DashboardProps) {
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [itemFilter, setItemFilter] = useState<string>('all');
  const [movementTypeFilter, setMovementTypeFilter] = useState<string>('all');

  const filteredMovements = useMemo(() => {
    return movements.filter(movement => {
      const locationMatch = locationFilter === 'all' || movement.destination === locationFilter;
      const itemMatch = itemFilter === 'all' || movement.item === itemFilter;
      const movementTypeMatch =
        movementTypeFilter === 'all' ||
        (movementTypeFilter === 'bundles' && (movement.movement_type === 'bundles' || !movement.movement_type)) ||
        (movementTypeFilter === 'pieces' && movement.movement_type === 'pieces');
      return locationMatch && itemMatch && movementTypeMatch;
    });
  }, [movements, locationFilter, itemFilter, movementTypeFilter]);

  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayMovements = filteredMovements.filter(m =>
      new Date(m.dispatch_date) >= today
    );

    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - 7);
    const weekMovements = filteredMovements.filter(m =>
      new Date(m.dispatch_date) >= weekStart
    );

    const monthStart = new Date(today);
    monthStart.setDate(today.getDate() - 30);
    const monthMovements = filteredMovements.filter(m =>
      new Date(m.dispatch_date) >= monthStart
    );

    return {
      total: filteredMovements.length,
      dispatched: filteredMovements.filter(m => m.status === 'dispatched').length,
      received: filteredMovements.filter(m => m.status === 'received').length,
      today: todayMovements.length,
      week: weekMovements.length,
      month: monthMovements.length,
      totalQuantity: filteredMovements.reduce((sum, m) => sum + m.bundles_count, 0)
    };
  }, [filteredMovements]);

  const itemStats = useMemo(() => {
    const shirtCount = filteredMovements
      .filter(m => m.item === 'shirt')
      .reduce((sum, m) => sum + m.bundles_count, 0);
    const pantCount = filteredMovements
      .filter(m => m.item === 'pant')
      .reduce((sum, m) => sum + m.bundles_count, 0);
    const bothShirtCount = filteredMovements
      .filter(m => m.item === 'both')
      .reduce((sum, m) => sum + (m.shirt_bundles || 0), 0);
    const bothPantCount = filteredMovements
      .filter(m => m.item === 'both')
      .reduce((sum, m) => sum + (m.pant_bundles || 0), 0);

    return {
      shirt: shirtCount + bothShirtCount,
      pant: pantCount + bothPantCount
    };
  }, [filteredMovements]);

  const locationStats = useMemo(() => {
    const bigShopCount = filteredMovements
      .filter(m => m.destination === 'big_shop')
      .reduce((sum, m) => sum + m.bundles_count, 0);
    const smallShopCount = filteredMovements
      .filter(m => m.destination === 'small_shop')
      .reduce((sum, m) => sum + m.bundles_count, 0);
    return { big_shop: bigShopCount, small_shop: smallShopCount };
  }, [filteredMovements]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 p-4 space-y-6">
      {/* Filters */}
      <div className="mb-6">
        <Card className="backdrop-blur-xl bg-white/10 border-white/20">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="space-y-2 flex-1">
                <label className="text-white text-sm font-medium">Location</label>
                <Select value={locationFilter} onValueChange={setLocationFilter}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white w-full sm:w-40">
                    <SelectValue placeholder="All Locations" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Locations</SelectItem>
                    <SelectItem value="godown">Godown</SelectItem>
                    <SelectItem value="big_shop">Big Shop</SelectItem>
                    <SelectItem value="small_shop">Small Shop</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 flex-1">
                <label className="text-white text-sm font-medium">Item</label>
                <Select value={itemFilter} onValueChange={setItemFilter}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white w-full sm:w-32">
                    <SelectValue placeholder="All Items" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Items</SelectItem>
                    <SelectItem value="shirt">Shirt</SelectItem>
                    <SelectItem value="pant">Pant</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 flex-1">
                <label className="text-white text-sm font-medium">Type</label>
                <Select value={movementTypeFilter} onValueChange={setMovementTypeFilter}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white w-full sm:w-32">
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All types</SelectItem>
                    <SelectItem value="bundles">Bundles</SelectItem>
                    <SelectItem value="pieces">Pieces</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-8">
        {/* Overall Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Combined Volume" value={stats.totalQuantity} icon={TrendingUp} />
          <StatCard label="Movements" value={stats.total} icon={Package} />
          <StatCard label="Dispatched" value={stats.dispatched} icon={Truck} iconColor="text-orange-400" />
          <StatCard label="Received" value={stats.received} icon={CheckCircle} iconColor="text-green-400" />
        </div>

        {/* Sections for Bundles and Pieces */}
        {['bundles', 'pieces'].map((type) => {
          const typeMovements = movements.filter(m =>
            type === 'bundles' ? (!m.movement_type || m.movement_type === 'bundles') : m.movement_type === 'pieces'
          );

          if (movementTypeFilter !== 'all' && movementTypeFilter !== type) return null;

          const summaryCount = typeMovements.reduce((sum, m) => sum + m.bundles_count, 0);
          const recent = typeMovements
            .sort((a, b) => new Date(b.dispatch_date).getTime() - new Date(a.dispatch_date).getTime())
            .slice(0, 3);

          const shirtQ = typeMovements.filter(m => m.item === 'shirt').reduce((sum, m) => sum + m.bundles_count, 0) +
            typeMovements.filter(m => m.item === 'both').reduce((sum, m) => sum + (m.shirt_bundles || 0), 0);
          const pantQ = typeMovements.filter(m => m.item === 'pant').reduce((sum, m) => sum + m.bundles_count, 0) +
            typeMovements.filter(m => m.item === 'both').reduce((sum, m) => sum + (m.pant_bundles || 0), 0);

          return (
            <div key={type} className="space-y-4">
              <h2 className="text-white text-xl font-bold capitalize flex items-center gap-2">
                <Badge variant="outline" className="bg-white/20 text-white border-white/40">
                  {type === 'bundles' ? '📦' : '🧩'}
                </Badge>
                {type} Movement Analysis
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Distribution Card */}
                <Card className="backdrop-blur-xl bg-white/10 border-white/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-white text-sm flex items-center gap-2">
                      <Shirt className="h-4 w-4" />
                      Item Distribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-white/60">Shirts</span>
                      <span className="text-white font-bold">{shirtQ} {type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">Pants</span>
                      <span className="text-white font-bold">{pantQ} {type}</span>
                    </div>
                    <div className="border-t border-white/10 pt-2 flex justify-between">
                      <span className="text-white/80">Total Volume</span>
                      <span className="text-white font-bold underline decoration-white/30">{summaryCount} {type}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Type Movements */}
                <Card className="md:col-span-2 backdrop-blur-xl bg-white/10 border-white/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-white text-sm">Recent {type} Movements</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {recent.length === 0 ? (
                        <p className="text-white/40 text-xs italic">No recent {type} recorded</p>
                      ) : (
                        recent.map((m) => (
                          <div key={m.id} className="flex items-center justify-between text-xs p-2 bg-white/5 rounded">
                            <div className="flex flex-col">
                              <span className="text-white font-medium">{m.bundles_count} {type} of {m.item}</span>
                              <span className="text-white/40">{new Date(m.dispatch_date).toLocaleDateString()} → {m.destination.replace('_', ' ')}</span>
                            </div>
                            <Badge variant={m.status === 'received' ? 'default' : 'secondary'} className="text-[10px] py-0 px-1">
                              {m.status}
                            </Badge>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});
