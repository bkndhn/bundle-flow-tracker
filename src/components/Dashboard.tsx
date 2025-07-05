
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { GoodsMovement } from '@/types';
import { Package, Truck, CheckCircle, Clock, TrendingUp, Shirt } from 'lucide-react';

interface DashboardProps {
  movements: GoodsMovement[];
}

export function Dashboard({ movements }: DashboardProps) {
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [itemFilter, setItemFilter] = useState<string>('all');

  const filterMovements = (movements: GoodsMovement[]) => {
    return movements.filter(movement => {
      const locationMatch = locationFilter === 'all' || movement.destination === locationFilter;
      const itemMatch = itemFilter === 'all' || movement.item === itemFilter;
      return locationMatch && itemMatch;
    });
  };

  const filteredMovements = filterMovements(movements);

  const getStats = () => {
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
    };
  };

  const getItemStats = () => {
    const shirtCount = filteredMovements.filter(m => m.item === 'shirt').length;
    const pantCount = filteredMovements.filter(m => m.item === 'pant').length;
    return { shirt: shirtCount, pant: pantCount };
  };

  const getLocationStats = () => {
    const bigShopCount = filteredMovements.filter(m => m.destination === 'big_shop').length;
    const smallShopCount = filteredMovements.filter(m => m.destination === 'small_shop').length;
    return { big_shop: bigShopCount, small_shop: smallShopCount };
  };

  const stats = getStats();
  const itemStats = getItemStats();
  const locationStats = getLocationStats();

  const recentMovements = filteredMovements
    .sort((a, b) => new Date(b.dispatch_date).getTime() - new Date(a.dispatch_date).getTime())
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 p-4 space-y-6">
      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <Card className="backdrop-blur-xl bg-white/10 border-white/20">
          <CardContent className="p-4">
            <div className="flex gap-4">
              <div className="space-y-2">
                <label className="text-white text-sm font-medium">Location</label>
                <Select value={locationFilter} onValueChange={setLocationFilter}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white w-40">
                    <SelectValue placeholder="All Locations" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Locations</SelectItem>
                    <SelectItem value="big_shop">Big Shop</SelectItem>
                    <SelectItem value="small_shop">Small Shop</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-white text-sm font-medium">Item</label>
                <Select value={itemFilter} onValueChange={setItemFilter}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white w-32">
                    <SelectValue placeholder="All Items" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Items</SelectItem>
                    <SelectItem value="shirt">Shirt</SelectItem>
                    <SelectItem value="pant">Pant</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="backdrop-blur-xl bg-white/10 border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-sm">Total Movements</p>
                <p className="text-white text-2xl font-bold">{stats.total}</p>
              </div>
              <Package className="h-8 w-8 text-white/60" />
            </div>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-xl bg-white/10 border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-sm">Dispatched</p>
                <p className="text-white text-2xl font-bold">{stats.dispatched}</p>
              </div>
              <Truck className="h-8 w-8 text-orange-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-xl bg-white/10 border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-sm">Received</p>
                <p className="text-white text-2xl font-bold">{stats.received}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-xl bg-white/10 border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-sm">Today</p>
                <p className="text-white text-2xl font-bold">{stats.today}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Item & Location Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="backdrop-blur-xl bg-white/10 border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Shirt className="h-5 w-5" />
              Item Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-white/80">Shirts</span>
                <Badge variant="secondary" className="bg-blue-500/20 text-blue-200">
                  {itemStats.shirt}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/80">Pants</span>
                <Badge variant="secondary" className="bg-purple-500/20 text-purple-200">
                  {itemStats.pant}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-xl bg-white/10 border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Location Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-white/80">Big Shop</span>
                <Badge variant="secondary" className="bg-green-500/20 text-green-200">
                  {locationStats.big_shop}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/80">Small Shop</span>
                <Badge variant="secondary" className="bg-orange-500/20 text-orange-200">
                  {locationStats.small_shop}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Movements */}
      <Card className="backdrop-blur-xl bg-white/10 border-white/20">
        <CardHeader>
          <CardTitle className="text-white">Recent Movements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentMovements.length === 0 ? (
              <p className="text-white/60 text-center py-4">No movements found</p>
            ) : (
              recentMovements.map((movement) => (
                <div key={movement.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="border-white/20 text-white">
                      {movement.item}
                    </Badge>
                    <div>
                      <p className="text-white font-medium">
                        {movement.bundles_count} bundles → {movement.destination === 'big_shop' ? 'Big Shop' : 'Small Shop'}
                      </p>
                      <p className="text-white/60 text-sm">
                        {new Date(movement.dispatch_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Badge variant={movement.status === 'received' ? 'default' : 'secondary'}>
                    {movement.status}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
