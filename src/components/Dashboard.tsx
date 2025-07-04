
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Truck, Package, Calendar, TrendingUp } from 'lucide-react';
import { GoodsMovement, MovementSummary } from '@/types';
import { LOCATIONS } from '@/lib/constants';

interface DashboardProps {
  movements: GoodsMovement[];
}

export function Dashboard({ movements }: DashboardProps) {
  const [summary, setSummary] = useState<MovementSummary[]>([]);

  useEffect(() => {
    // Calculate movement summaries
    const today = new Date().toDateString();
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const bigShopSummary = {
      location: 'Big Shop',
      today: movements.filter(m => 
        m.destination === 'big_shop' && 
        new Date(m.dispatch_date).toDateString() === today
      ).reduce((sum, m) => sum + m.bundles_count, 0),
      week: movements.filter(m => 
        m.destination === 'big_shop' && 
        new Date(m.dispatch_date) >= weekAgo
      ).reduce((sum, m) => sum + m.bundles_count, 0),
      month: movements.filter(m => 
        m.destination === 'big_shop' && 
        new Date(m.dispatch_date) >= monthAgo
      ).reduce((sum, m) => sum + m.bundles_count, 0),
    };

    const smallShopSummary = {
      location: 'Small Shop',
      today: movements.filter(m => 
        m.destination === 'small_shop' && 
        new Date(m.dispatch_date).toDateString() === today
      ).reduce((sum, m) => sum + m.bundles_count, 0),
      week: movements.filter(m => 
        m.destination === 'small_shop' && 
        new Date(m.dispatch_date) >= weekAgo
      ).reduce((sum, m) => sum + m.bundles_count, 0),
      month: movements.filter(m => 
        m.destination === 'small_shop' && 
        new Date(m.dispatch_date) >= monthAgo
      ).reduce((sum, m) => sum + m.bundles_count, 0),
    };

    setSummary([bigShopSummary, smallShopSummary]);
  }, [movements]);

  const recentMovements = movements
    .sort((a, b) => new Date(b.dispatch_date).getTime() - new Date(a.dispatch_date).getTime())
    .slice(0, 5);

  const pendingReceives = movements.filter(m => m.status === 'dispatched');

  return (
    <div className="p-4 space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Truck className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Dispatched Today</p>
                <p className="text-2xl font-bold text-gray-900">
                  {movements.filter(m => 
                    new Date(m.dispatch_date).toDateString() === new Date().toDateString()
                  ).reduce((sum, m) => sum + m.bundles_count, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Package className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Receive</p>
                <p className="text-2xl font-bold text-gray-900">{pendingReceives.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Movement Summary */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Movement Summary</h2>
        {summary.map((item) => (
          <Card key={item.location}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{item.location}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-blue-600">{item.today}</p>
                  <p className="text-xs text-gray-600">Today</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">{item.week}</p>
                  <p className="text-xs text-gray-600">This Week</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-purple-600">{item.month}</p>
                  <p className="text-xs text-gray-600">This Month</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Movements */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Recent Movements</h2>
        <div className="space-y-3">
          {recentMovements.map((movement) => (
            <Card key={movement.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <Badge variant={movement.status === 'received' ? 'default' : 'secondary'}>
                        {movement.status === 'received' ? 'Received' : 'Dispatched'}
                      </Badge>
                      <span className="text-sm font-medium">
                        {movement.bundles_count} bundles
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      To {LOCATIONS[movement.destination]}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(movement.dispatch_date).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{movement.sent_by_name}</p>
                    <p className="text-xs text-gray-500">Sent by</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
