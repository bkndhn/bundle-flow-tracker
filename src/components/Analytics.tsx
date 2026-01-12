import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { GoodsMovement } from '@/types';
import { 
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';
import { format, subDays, startOfDay, endOfDay, eachDayOfInterval, getHours, parseISO, addDays } from 'date-fns';
import { TrendingUp, Clock, Package, Target, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface AnalyticsProps {
  movements: GoodsMovement[];
}

const CHART_COLORS = {
  primary: 'hsl(221, 83%, 53%)',
  secondary: 'hsl(142, 76%, 36%)',
  accent: 'hsl(262, 83%, 58%)',
  warning: 'hsl(38, 92%, 50%)',
  muted: 'hsl(215, 16%, 47%)',
  big_shop: 'hsl(221, 83%, 53%)',
  small_shop: 'hsl(142, 76%, 36%)',
};

export function Analytics({ movements }: AnalyticsProps) {
  // Calculate movement trends (last 30 days)
  const movementTrends = useMemo(() => {
    const last30Days = eachDayOfInterval({
      start: subDays(new Date(), 29),
      end: new Date(),
    });

    return last30Days.map(day => {
      const dayStart = startOfDay(day);
      const dayEnd = endOfDay(day);
      
      const dayMovements = movements.filter(m => {
        const dispatchDate = parseISO(m.dispatch_date);
        return dispatchDate >= dayStart && dispatchDate <= dayEnd;
      });

      const totalBundles = dayMovements.reduce((sum, m) => sum + m.bundles_count, 0);
      const dispatched = dayMovements.filter(m => m.status === 'dispatched').length;
      const received = dayMovements.filter(m => m.status === 'received').length;

      return {
        date: format(day, 'MMM dd'),
        shortDate: format(day, 'dd'),
        dispatches: dayMovements.length,
        bundles: totalBundles,
        dispatched,
        received,
      };
    });
  }, [movements]);

  // Calculate peak hours analysis
  const peakHoursData = useMemo(() => {
    const hourlyData: { [key: number]: { dispatches: number; receives: number; bundles: number } } = {};
    
    // Initialize all hours
    for (let i = 0; i < 24; i++) {
      hourlyData[i] = { dispatches: 0, receives: 0, bundles: 0 };
    }

    movements.forEach(m => {
      const dispatchHour = getHours(parseISO(m.dispatch_date));
      hourlyData[dispatchHour].dispatches++;
      hourlyData[dispatchHour].bundles += m.bundles_count;

      if (m.received_at) {
        const receiveHour = getHours(parseISO(m.received_at));
        hourlyData[receiveHour].receives++;
      }
    });

    return Object.entries(hourlyData).map(([hour, data]) => ({
      hour: `${hour.toString().padStart(2, '0')}:00`,
      hourNum: parseInt(hour),
      ...data,
    }));
  }, [movements]);

  // Find peak dispatch hour
  const peakDispatchHour = useMemo(() => {
    const maxDispatches = Math.max(...peakHoursData.map(h => h.dispatches));
    return peakHoursData.find(h => h.dispatches === maxDispatches);
  }, [peakHoursData]);

  // Calculate destination distribution
  const destinationData = useMemo(() => {
    const bigShop = movements.filter(m => m.destination === 'big_shop');
    const smallShop = movements.filter(m => m.destination === 'small_shop');

    return [
      { 
        name: 'Big Shop', 
        value: bigShop.length, 
        bundles: bigShop.reduce((sum, m) => sum + m.bundles_count, 0),
        color: CHART_COLORS.big_shop
      },
      { 
        name: 'Small Shop', 
        value: smallShop.length, 
        bundles: smallShop.reduce((sum, m) => sum + m.bundles_count, 0),
        color: CHART_COLORS.small_shop
      },
    ];
  }, [movements]);

  // Calculate bundle volume forecasting (simple moving average)
  const forecastData = useMemo(() => {
    const last14Days = movementTrends.slice(-14);
    const avgBundles = last14Days.reduce((sum, d) => sum + d.bundles, 0) / last14Days.length;
    
    // Calculate trend
    const firstHalf = last14Days.slice(0, 7);
    const secondHalf = last14Days.slice(7);
    const firstAvg = firstHalf.reduce((sum, d) => sum + d.bundles, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, d) => sum + d.bundles, 0) / secondHalf.length;
    const trendMultiplier = secondAvg > 0 ? (secondAvg - firstAvg) / secondAvg : 0;

    // Generate forecast for next 7 days
    const forecast = [];
    for (let i = 1; i <= 7; i++) {
      const forecastDay = addDays(new Date(), i);
      const forecastValue = Math.max(0, Math.round(avgBundles * (1 + trendMultiplier * (i / 7))));
      forecast.push({
        date: format(forecastDay, 'MMM dd'),
        bundles: null,
        forecast: forecastValue,
        type: 'forecast',
      });
    }

    // Combine historical and forecast data
    const historical = movementTrends.slice(-14).map(d => ({
      date: d.date,
      bundles: d.bundles,
      forecast: null,
      type: 'historical',
    }));

    return [...historical, ...forecast];
  }, [movementTrends]);

  // Calculate weekly comparison
  const weeklyComparison = useMemo(() => {
    const thisWeek = movementTrends.slice(-7);
    const lastWeek = movementTrends.slice(-14, -7);

    const thisWeekBundles = thisWeek.reduce((sum, d) => sum + d.bundles, 0);
    const lastWeekBundles = lastWeek.reduce((sum, d) => sum + d.bundles, 0);
    
    const thisWeekDispatches = thisWeek.reduce((sum, d) => sum + d.dispatches, 0);
    const lastWeekDispatches = lastWeek.reduce((sum, d) => sum + d.dispatches, 0);

    const bundleChange = lastWeekBundles > 0 
      ? ((thisWeekBundles - lastWeekBundles) / lastWeekBundles * 100).toFixed(1)
      : '0';
    
    const dispatchChange = lastWeekDispatches > 0
      ? ((thisWeekDispatches - lastWeekDispatches) / lastWeekDispatches * 100).toFixed(1)
      : '0';

    return {
      thisWeekBundles,
      lastWeekBundles,
      thisWeekDispatches,
      lastWeekDispatches,
      bundleChange: parseFloat(bundleChange),
      dispatchChange: parseFloat(dispatchChange),
    };
  }, [movementTrends]);

  // Item type distribution
  const itemTypeData = useMemo(() => {
    const shirts = movements.filter(m => m.item === 'shirt');
    const pants = movements.filter(m => m.item === 'pant');
    const both = movements.filter(m => m.item === 'both');

    return [
      { name: 'Shirts', value: shirts.length, bundles: shirts.reduce((sum, m) => sum + (m.shirt_bundles || m.bundles_count), 0) },
      { name: 'Pants', value: pants.length, bundles: pants.reduce((sum, m) => sum + (m.pant_bundles || m.bundles_count), 0) },
      { name: 'Both', value: both.length, bundles: both.reduce((sum, m) => sum + m.bundles_count, 0) },
    ].filter(item => item.value > 0);
  }, [movements]);

  const ITEM_COLORS = ['#3b82f6', '#22c55e', '#a855f7'];

  return (
    <div className="p-4 space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-xs font-medium">This Week</p>
                <p className="text-2xl font-bold">{weeklyComparison.thisWeekBundles}</p>
                <p className="text-blue-100 text-xs">Bundles</p>
              </div>
              <div className={`flex items-center text-sm ${weeklyComparison.bundleChange >= 0 ? 'text-green-200' : 'text-red-200'}`}>
                {weeklyComparison.bundleChange >= 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                {Math.abs(weeklyComparison.bundleChange)}%
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-xs font-medium">Dispatches</p>
                <p className="text-2xl font-bold">{weeklyComparison.thisWeekDispatches}</p>
                <p className="text-green-100 text-xs">This week</p>
              </div>
              <div className={`flex items-center text-sm ${weeklyComparison.dispatchChange >= 0 ? 'text-green-200' : 'text-red-200'}`}>
                {weeklyComparison.dispatchChange >= 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                {Math.abs(weeklyComparison.dispatchChange)}%
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-xs font-medium">Peak Hour</p>
                <p className="text-2xl font-bold">{peakDispatchHour?.hour || 'N/A'}</p>
                <p className="text-purple-100 text-xs">{peakDispatchHour?.dispatches || 0} dispatches</p>
              </div>
              <Clock className="h-8 w-8 text-purple-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-100 text-xs font-medium">Avg Daily</p>
                <p className="text-2xl font-bold">
                  {Math.round(movementTrends.reduce((sum, d) => sum + d.bundles, 0) / 30)}
                </p>
                <p className="text-amber-100 text-xs">Bundles</p>
              </div>
              <Target className="h-8 w-8 text-amber-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Movement Trends Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            Movement Trends (Last 30 Days)
          </CardTitle>
          <CardDescription>Daily dispatch count and bundle volume</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={movementTrends}>
                <defs>
                  <linearGradient id="colorBundles" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorDispatches" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_COLORS.secondary} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={CHART_COLORS.secondary} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="shortDate" 
                  tick={{ fontSize: 11 }}
                  stroke="#9ca3af"
                />
                <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                  labelFormatter={(value, payload) => {
                    if (payload && payload[0]) {
                      return payload[0].payload.date;
                    }
                    return value;
                  }}
                />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="bundles" 
                  stroke={CHART_COLORS.primary}
                  strokeWidth={2}
                  fill="url(#colorBundles)" 
                  name="Bundles"
                />
                <Area 
                  type="monotone" 
                  dataKey="dispatches" 
                  stroke={CHART_COLORS.secondary}
                  strokeWidth={2}
                  fill="url(#colorDispatches)" 
                  name="Dispatches"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Two column layout for smaller charts */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Peak Hours Analysis */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="h-5 w-5 text-purple-600" />
              Peak Hours Analysis
            </CardTitle>
            <CardDescription>Dispatch activity by hour of day</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={peakHoursData.filter(h => h.hourNum >= 6 && h.hourNum <= 22)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="hour" 
                    tick={{ fontSize: 10 }}
                    stroke="#9ca3af"
                    interval={1}
                  />
                  <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar 
                    dataKey="dispatches" 
                    fill={CHART_COLORS.accent}
                    radius={[4, 4, 0, 0]}
                    name="Dispatches"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Destination Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Package className="h-5 w-5 text-green-600" />
              Destination Distribution
            </CardTitle>
            <CardDescription>Movement distribution by destination</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={destinationData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {destinationData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number, name: string, props: any) => [
                      `${value} movements (${props.payload.bundles} bundles)`,
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
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bundle Volume Forecast */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Target className="h-5 w-5 text-amber-600" />
            Bundle Volume Forecast
          </CardTitle>
          <CardDescription>Historical data with 7-day forecast based on moving average</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={forecastData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 11 }}
                  stroke="#9ca3af"
                />
                <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number, name: string) => [
                    value,
                    name === 'bundles' ? 'Actual Bundles' : 'Forecasted Bundles'
                  ]}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="bundles" 
                  stroke={CHART_COLORS.primary}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  name="Actual"
                  connectNulls={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="forecast" 
                  stroke={CHART_COLORS.warning}
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ r: 3 }}
                  name="Forecast"
                  connectNulls={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Item Type Distribution */}
      {itemTypeData.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Item Type Distribution</CardTitle>
            <CardDescription>Breakdown by item type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={itemTypeData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis type="number" tick={{ fontSize: 11 }} stroke="#9ca3af" />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} stroke="#9ca3af" width={60} />
                  <Tooltip 
                    formatter={(value: number, name: string) => [
                      value,
                      name === 'value' ? 'Movements' : 'Bundles'
                    ]}
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="value" fill={CHART_COLORS.primary} name="Movements" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="bundles" fill={CHART_COLORS.secondary} name="Bundles" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
