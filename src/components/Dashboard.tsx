import { useState, useMemo, memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { GoodsMovement } from '@/types';
import { Package, Truck, CheckCircle, TrendingUp, Shirt, Clock, AlertTriangle, ArrowRight, Timer } from 'lucide-react';
import { formatDateTime12hr } from '@/lib/utils';
import { LOCATIONS } from '@/lib/constants';

interface DashboardProps {
  movements: GoodsMovement[];
}

// Memoized stat card component
const StatCard = memo(function StatCard({ 
  label, 
  value, 
  icon: Icon, 
  iconColor = 'text-white/70',
  gradient = 'bg-white/10',
}: { 
  label: string; 
  value: number | string; 
  icon: React.ComponentType<{ className?: string }>; 
  iconColor?: string;
  gradient?: string;
}) {
  return (
    <Card className={`backdrop-blur-xl ${gradient} border-white/30 shadow-lg`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white font-semibold text-sm drop-shadow-sm">{label}</p>
            <p className="text-white text-3xl font-extrabold drop-shadow-md">{value}</p>
          </div>
          <Icon className={`h-8 w-8 ${iconColor} drop-shadow-sm`} />
        </div>
      </CardContent>
    </Card>
  );
});

export const Dashboard = memo(function Dashboard({ movements }: DashboardProps) {
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [itemFilter, setItemFilter] = useState<string>('all');
  const [movementTypeFilter, setMovementTypeFilter] = useState<string>('all');

  // Today's date for summary
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  // Today's summary stats
  const todaySummary = useMemo(() => {
    const todayMovements = movements.filter(m => {
      const d = new Date(m.dispatch_date);
      d.setHours(0, 0, 0, 0);
      return d.getTime() === today.getTime();
    });

    const todayDispatched = todayMovements.filter(m => m.status === 'dispatched').length;
    const todayReceived = todayMovements.filter(m => m.status === 'received').length;
    const todayBundles = todayMovements.reduce((sum, m) => sum + m.bundles_count, 0);

    return { total: todayMovements.length, dispatched: todayDispatched, received: todayReceived, bundles: todayBundles };
  }, [movements, today]);

  // Pending receipts count
  const pendingReceipts = useMemo(() => {
    return movements.filter(m => m.status === 'dispatched');
  }, [movements]);

  // Average transit time per route
  const transitTimeByRoute = useMemo(() => {
    const receivedMovements = movements.filter(m => m.status === 'received' && m.received_at);
    const routeMap: Record<string, { totalMinutes: number; count: number }> = {};

    receivedMovements.forEach(m => {
      const route = `${m.source || 'godown'} → ${m.destination}`;
      const dispatchTime = new Date(m.dispatch_date).getTime();
      const receiveTime = new Date(m.received_at!).getTime();
      const transitMinutes = (receiveTime - dispatchTime) / (1000 * 60);

      if (transitMinutes > 0 && transitMinutes < 1440 * 7) { // Ignore outliers > 7 days
        if (!routeMap[route]) routeMap[route] = { totalMinutes: 0, count: 0 };
        routeMap[route].totalMinutes += transitMinutes;
        routeMap[route].count++;
      }
    });

    return Object.entries(routeMap).map(([route, data]) => ({
      route,
      avgMinutes: Math.round(data.totalMinutes / data.count),
      count: data.count,
    })).sort((a, b) => b.count - a.count);
  }, [movements]);

  const formatTransitTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
  };

  // Apply all filters to movements
  const filteredMovements = useMemo(() => {
    return movements.filter(movement => {
      const locationMatch = locationFilter === 'all' || movement.destination === locationFilter;
      const itemMatch = itemFilter === 'all' || movement.item === itemFilter || movement.item === 'both';
      const movementTypeMatch =
        movementTypeFilter === 'all' ||
        (movementTypeFilter === 'bundles' && (movement.movement_type === 'bundles' || !movement.movement_type)) ||
        (movementTypeFilter === 'pieces' && movement.movement_type === 'pieces');
      return locationMatch && itemMatch && movementTypeMatch;
    });
  }, [movements, locationFilter, itemFilter, movementTypeFilter]);

  // Stats based on filtered movements
  const stats = useMemo(() => {
    const calculateQuantity = (mvts: GoodsMovement[]) => {
      return mvts.reduce((sum, m) => {
        if (itemFilter === 'shirt') {
          if (m.item === 'shirt') return sum + m.bundles_count;
          if (m.item === 'both') return sum + (m.shirt_bundles || 0);
          return sum;
        } else if (itemFilter === 'pant') {
          if (m.item === 'pant') return sum + m.bundles_count;
          if (m.item === 'both') return sum + (m.pant_bundles || 0);
          return sum;
        }
        return sum + m.bundles_count;
      }, 0);
    };

    return {
      total: filteredMovements.length,
      dispatched: filteredMovements.filter(m => m.status === 'dispatched').length,
      received: filteredMovements.filter(m => m.status === 'received').length,
      totalQuantity: calculateQuantity(filteredMovements)
    };
  }, [filteredMovements, itemFilter]);

  // Helper to calculate quantities considering item filter
  const calculateTypeQuantities = useMemo(() => {
    return (typeMovements: GoodsMovement[]) => {
      let shirtQ = 0;
      let pantQ = 0;

      typeMovements.forEach(m => {
        if (itemFilter === 'shirt' || itemFilter === 'all') {
          if (m.item === 'shirt') shirtQ += m.bundles_count;
          else if (m.item === 'both') shirtQ += m.shirt_bundles || 0;
        }
        
        if (itemFilter === 'pant' || itemFilter === 'all') {
          if (m.item === 'pant') pantQ += m.bundles_count;
          else if (m.item === 'both') pantQ += m.pant_bundles || 0;
        }
      });

      return { shirtQ, pantQ };
    };
  }, [itemFilter]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 p-4 space-y-6">
      {/* Today's Dispatch Summary */}
      <div className="space-y-3">
        <h2 className="text-white text-lg font-bold flex items-center gap-2">
          <Badge variant="outline" className="bg-white/20 text-white border-white/40">📊</Badge>
          Today's Summary
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Today's Dispatches" value={todaySummary.total} icon={Truck} iconColor="text-blue-300" gradient="bg-gradient-to-br from-blue-500/30 to-blue-600/20" />
          <StatCard label="Today's Bundles" value={todaySummary.bundles} icon={Package} iconColor="text-purple-300" gradient="bg-gradient-to-br from-purple-500/30 to-purple-600/20" />
          <StatCard label="Pending Receipts" value={pendingReceipts.length} icon={AlertTriangle} iconColor="text-amber-300" gradient="bg-gradient-to-br from-amber-500/30 to-amber-600/20" />
          <StatCard label="Today Received" value={todaySummary.received} icon={CheckCircle} iconColor="text-emerald-300" gradient="bg-gradient-to-br from-emerald-500/30 to-emerald-600/20" />
        </div>
      </div>

      {/* Average Transit Time per Route */}
      {transitTimeByRoute.length > 0 && (
        <Card className="backdrop-blur-xl bg-white/10 border-white/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-sm flex items-center gap-2">
              <Timer className="h-4 w-4 text-cyan-300" />
              Average Transit Time per Route
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {transitTimeByRoute.map(({ route, avgMinutes, count }) => {
              const [src, dest] = route.split(' → ');
              return (
                <div key={route} className="flex items-center justify-between p-2.5 bg-white/5 rounded-lg">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-white/80 font-medium">{LOCATIONS[src as keyof typeof LOCATIONS] || src}</span>
                    <ArrowRight className="h-3 w-3 text-white/40" />
                    <span className="text-white/80 font-medium">{LOCATIONS[dest as keyof typeof LOCATIONS] || dest}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="bg-cyan-500/20 text-cyan-200 border-cyan-400/30 text-xs">
                      <Clock className="h-3 w-3 mr-1" />
                      {formatTransitTime(avgMinutes)}
                    </Badge>
                    <span className="text-white/40 text-xs">{count} trips</span>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

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

        {/* Sections for Bundles and Pieces - respecting all filters */}
        {['bundles', 'pieces'].map((type) => {
          // Skip if movement type filter doesn't match
          if (movementTypeFilter !== 'all' && movementTypeFilter !== type) return null;

          // Apply ALL filters to get the type movements
          const typeMovements = filteredMovements.filter(m =>
            type === 'bundles' ? (!m.movement_type || m.movement_type === 'bundles') : m.movement_type === 'pieces'
          );

          // Calculate quantities with item filter applied
          const { shirtQ, pantQ } = calculateTypeQuantities(typeMovements);
          const summaryCount = shirtQ + pantQ;

          // Get recent movements for this type
          const recent = typeMovements
            .sort((a, b) => new Date(b.dispatch_date).getTime() - new Date(a.dispatch_date).getTime())
            .slice(0, 3);

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
                    {(itemFilter === 'all' || itemFilter === 'shirt') && (
                      <div className="flex justify-between">
                        <span className="text-white/60">Shirts</span>
                        <span className="text-white font-bold">{shirtQ} {type}</span>
                      </div>
                    )}
                    {(itemFilter === 'all' || itemFilter === 'pant') && (
                      <div className="flex justify-between">
                        <span className="text-white/60">Pants</span>
                        <span className="text-white font-bold">{pantQ} {type}</span>
                      </div>
                    )}
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
                              <span className="text-white/40">{formatDateTime12hr(m.dispatch_date)} → {m.destination.replace('_', ' ')}</span>
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
