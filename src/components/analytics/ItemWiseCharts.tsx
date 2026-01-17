import { useMemo, memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';
import { Shirt, Package } from 'lucide-react';
import { GoodsMovement } from '@/types';

interface ItemWiseChartsProps {
  movements: GoodsMovement[];
  metricFilter: 'bundles' | 'pieces' | 'all';
  itemFilter: 'all' | 'shirt' | 'pant';
  onMetricFilterChange: (value: 'bundles' | 'pieces' | 'all') => void;
  onItemFilterChange: (value: 'all' | 'shirt' | 'pant') => void;
}

const CHART_COLORS = {
  shirt: 'hsl(221, 83%, 53%)',
  pant: 'hsl(142, 76%, 36%)',
  both: 'hsl(262, 83%, 58%)',
  bundles: 'hsl(38, 92%, 50%)',
  pieces: 'hsl(340, 82%, 52%)',
};

const PIE_COLORS = ['#3b82f6', '#22c55e', '#a855f7', '#f59e0b'];

export const ItemWiseCharts = memo(function ItemWiseCharts({
  movements,
  metricFilter,
  itemFilter,
  onMetricFilterChange,
  onItemFilterChange,
}: ItemWiseChartsProps) {
  
  // Filter movements based on metric type and item filter
  const filteredMovements = useMemo(() => {
    let filtered = movements;
    
    if (metricFilter !== 'all') {
      filtered = filtered.filter(m => m.movement_type === metricFilter);
    }
    
    if (itemFilter !== 'all') {
      // When filtering by item, include 'both' movements but only count the relevant part
      filtered = filtered.filter(m => m.item === itemFilter || m.item === 'both');
    }
    
    return filtered;
  }, [movements, metricFilter, itemFilter]);

  // Calculate item-wise distribution with proper filter respect
  const itemDistribution = useMemo(() => {
    const stats = {
      shirt: { count: 0, bundles: 0, total: 0 },
      pant: { count: 0, bundles: 0, total: 0 },
      both: { count: 0, bundles: 0, shirtBundles: 0, pantBundles: 0 },
    };

    filteredMovements.forEach(m => {
      if (m.item === 'shirt') {
        stats.shirt.count++;
        stats.shirt.bundles += m.bundles_count;
        stats.shirt.total += m.bundles_count;
      } else if (m.item === 'pant') {
        stats.pant.count++;
        stats.pant.bundles += m.bundles_count;
        stats.pant.total += m.bundles_count;
      } else if (m.item === 'both') {
        stats.both.count++;
        stats.both.bundles += m.bundles_count;
        stats.both.shirtBundles += m.shirt_bundles || 0;
        stats.both.pantBundles += m.pant_bundles || 0;
      }
    });

    return stats;
  }, [filteredMovements]);

  // Calculate totals with proper filter application
  const { totalShirtBundles, totalPantBundles } = useMemo(() => {
    let shirtTotal = 0;
    let pantTotal = 0;

    // When item filter is applied, only count relevant items
    if (itemFilter === 'shirt') {
      shirtTotal = itemDistribution.shirt.bundles + itemDistribution.both.shirtBundles;
      pantTotal = 0; // Don't count pants when filtering for shirts
    } else if (itemFilter === 'pant') {
      shirtTotal = 0; // Don't count shirts when filtering for pants
      pantTotal = itemDistribution.pant.bundles + itemDistribution.both.pantBundles;
    } else {
      shirtTotal = itemDistribution.shirt.bundles + itemDistribution.both.shirtBundles;
      pantTotal = itemDistribution.pant.bundles + itemDistribution.both.pantBundles;
    }

    return { totalShirtBundles: shirtTotal, totalPantBundles: pantTotal };
  }, [itemDistribution, itemFilter]);

  // Detailed breakdown data for bar chart
  const breakdownData = useMemo(() => {
    const data = [];
    
    if (itemFilter === 'all' || itemFilter === 'shirt') {
      data.push({
        name: 'Shirts',
        movements: itemDistribution.shirt.count + (itemFilter === 'all' ? itemDistribution.both.count : 0),
        bundles: totalShirtBundles,
        color: CHART_COLORS.shirt,
      });
    }
    
    if (itemFilter === 'all' || itemFilter === 'pant') {
      data.push({
        name: 'Pants',
        movements: itemDistribution.pant.count + (itemFilter === 'all' ? itemDistribution.both.count : 0),
        bundles: totalPantBundles,
        color: CHART_COLORS.pant,
      });
    }

    return data;
  }, [itemDistribution, itemFilter, totalShirtBundles, totalPantBundles]);

  // Pie chart data for bundle/pieces distribution - respecting all filters
  const pieData = useMemo(() => {
    // Apply item filter first
    let movementsToAnalyze = movements;
    
    if (itemFilter !== 'all') {
      movementsToAnalyze = movements.filter(m => m.item === itemFilter || m.item === 'both');
    }

    const bundleMovements = movementsToAnalyze.filter(m => m.movement_type === 'bundles' || !m.movement_type);
    const pieceMovements = movementsToAnalyze.filter(m => m.movement_type === 'pieces');
    
    // Calculate totals considering item filter
    const getBundleTotal = (mvts: GoodsMovement[]) => {
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

    const data = [];
    
    // Only show relevant metric types based on metricFilter
    if (metricFilter === 'all' || metricFilter === 'bundles') {
      const bundleCount = bundleMovements.length;
      const bundleTotal = getBundleTotal(bundleMovements);
      if (bundleCount > 0 || metricFilter === 'bundles') {
        data.push({ 
          name: 'Bundles', 
          value: bundleCount,
          total: bundleTotal,
        });
      }
    }
    
    if (metricFilter === 'all' || metricFilter === 'pieces') {
      const pieceCount = pieceMovements.length;
      const pieceTotal = getBundleTotal(pieceMovements);
      if (pieceCount > 0 || metricFilter === 'pieces') {
        data.push({ 
          name: 'Pieces', 
          value: pieceCount,
          total: pieceTotal,
        });
      }
    }

    return data.filter(d => d.value > 0);
  }, [movements, metricFilter, itemFilter]);

  // Combined summary data - properly filtered
  const summaryData = useMemo(() => {
    const data = [];
    
    // Only show shirt stats if not filtered to pants only
    if (itemFilter === 'all' || itemFilter === 'shirt') {
      data.push({ label: 'Total Shirts', value: totalShirtBundles, color: 'bg-blue-500' });
    }
    
    // Only show pant stats if not filtered to shirts only
    if (itemFilter === 'all' || itemFilter === 'pant') {
      data.push({ label: 'Total Pants', value: totalPantBundles, color: 'bg-green-500' });
    }
    
    // Total bundles based on filter
    data.push({ 
      label: 'Total Bundles', 
      value: totalShirtBundles + totalPantBundles, 
      color: 'bg-purple-500' 
    });
    
    data.push({ 
      label: 'Total Movements', 
      value: filteredMovements.length, 
      color: 'bg-amber-500' 
    });

    return data;
  }, [totalShirtBundles, totalPantBundles, filteredMovements.length, itemFilter]);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Package className="h-4 w-4" />
              <span>Filters:</span>
            </div>
            
            <Select value={metricFilter} onValueChange={(v) => onMetricFilterChange(v as any)}>
              <SelectTrigger className="w-[130px] h-9 bg-white">
                <SelectValue placeholder="Metric" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="bundles">Bundles Only</SelectItem>
                <SelectItem value="pieces">Pieces Only</SelectItem>
              </SelectContent>
            </Select>

            <Select value={itemFilter} onValueChange={(v) => onItemFilterChange(v as any)}>
              <SelectTrigger className="w-[130px] h-9 bg-white">
                <SelectValue placeholder="Item" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Items</SelectItem>
                <SelectItem value="shirt">Shirts</SelectItem>
                <SelectItem value="pant">Pants</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards - Dynamic based on filter */}
      <div className={`grid gap-4 ${summaryData.length <= 3 ? 'grid-cols-3' : 'grid-cols-2 md:grid-cols-4'}`}>
        {summaryData.map((item) => (
          <Card key={item.label} className="bg-white border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${item.color}`} />
                <div>
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                  <p className="text-2xl font-bold">{item.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Item Distribution Bar Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shirt className="h-5 w-5 text-blue-600" />
              Item-wise Breakdown
            </CardTitle>
            <CardDescription>
              {itemFilter === 'shirt' ? 'Shirts distribution' : 
               itemFilter === 'pant' ? 'Pants distribution' : 
               'Shirts vs Pants distribution'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {breakdownData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  No data available for selected filters
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={breakdownData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis type="number" tick={{ fontSize: 11 }} stroke="#9ca3af" />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} stroke="#9ca3af" width={60} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                      }}
                      formatter={(value: number, name: string) => [
                        value.toLocaleString(),
                        name === 'movements' ? 'Movements' : 'Bundles'
                      ]}
                    />
                    <Legend />
                    <Bar dataKey="movements" fill={CHART_COLORS.shirt} name="Movements" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="bundles" fill={CHART_COLORS.pant} name="Bundles" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Bundles vs Pieces Pie Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Package className="h-5 w-5 text-purple-600" />
              Movement Type Distribution
            </CardTitle>
            <CardDescription>
              {metricFilter === 'bundles' ? 'Bundles movements' :
               metricFilter === 'pieces' ? 'Pieces movements' :
               'Bundles vs Pieces movements'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center">
              {pieData.length === 0 ? (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  No data available for selected filters
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number, name: string, props: any) => [
                        `${value} movements (${props.payload.total} total)`,
                        name
                      ]}
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
});