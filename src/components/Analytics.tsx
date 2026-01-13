import { useMemo, useState, useCallback, memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { GoodsMovement } from '@/types';
import { 
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';
import { format, subDays, startOfDay, endOfDay, eachDayOfInterval, getHours, parseISO, addDays, isWithinInterval } from 'date-fns';
import { TrendingUp, Clock, Package, Target, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { AnalyticsDateFilter, DateRange } from './analytics/AnalyticsDateFilter';
import { ItemWiseCharts } from './analytics/ItemWiseCharts';

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

// Helper to format hour in 12-hour format
const formatHour12 = (hour: number): string => {
  if (hour === 0) return '12 AM';
  if (hour === 12) return '12 PM';
  if (hour < 12) return `${hour} AM`;
  return `${hour - 12} PM`;
};

// Memoized summary card component
const SummaryCard = memo(function SummaryCard({ 
  title, 
  value, 
  subtitle, 
  change, 
  gradient, 
  icon: Icon 
}: { 
  title: string; 
  value: string | number; 
  subtitle: string; 
  change?: number; 
  gradient: string;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card className={`${gradient} text-white border-0`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/80 text-xs font-medium">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-white/80 text-xs">{subtitle}</p>
          </div>
          {change !== undefined ? (
            <div className={`flex items-center text-sm ${change >= 0 ? 'text-green-200' : 'text-red-200'}`}>
              {change >= 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
              {Math.abs(change)}%
            </div>
          ) : Icon ? (
            <Icon className="h-8 w-8 text-white/60" />
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
});

export const Analytics = memo(function Analytics({ movements }: AnalyticsProps) {
  // Date range state - default to last 30 days
  const [dateRange, setDateRange] = useState<DateRange>(() => ({
    from: startOfDay(subDays(new Date(), 29)),
    to: endOfDay(new Date()),
  }));

  // Item-wise chart filters
  const [metricFilter, setMetricFilter] = useState<'bundles' | 'pieces' | 'all'>('all');
  const [itemFilter, setItemFilter] = useState<'all' | 'shirt' | 'pant'>('all');

  // Filter movements by date range
  const filteredMovements = useMemo(() => {
    return movements.filter(m => {
      const dispatchDate = parseISO(m.dispatch_date);
      return isWithinInterval(dispatchDate, { start: dateRange.from, end: dateRange.to });
    });
  }, [movements, dateRange]);

  // Calculate movement trends within date range
  const movementTrends = useMemo(() => {
    const days = eachDayOfInterval({
      start: dateRange.from,
      end: dateRange.to,
    });

    return days.map(day => {
      const dayStart = startOfDay(day);
      const dayEnd = endOfDay(day);
      
      const dayMovements = filteredMovements.filter(m => {
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
  }, [filteredMovements, dateRange]);

  // Calculate peak hours analysis with 12-hour format
  const peakHoursData = useMemo(() => {
    const hourlyData: { [key: number]: { dispatches: number; receives: number; bundles: number } } = {};
    
    // Initialize all hours
    for (let i = 0; i < 24; i++) {
      hourlyData[i] = { dispatches: 0, receives: 0, bundles: 0 };
    }

    filteredMovements.forEach(m => {
      const dispatchHour = getHours(parseISO(m.dispatch_date));
      hourlyData[dispatchHour].dispatches++;
      hourlyData[dispatchHour].bundles += m.bundles_count;

      if (m.received_at) {
        const receiveHour = getHours(parseISO(m.received_at));
        hourlyData[receiveHour].receives++;
      }
    });

    return Object.entries(hourlyData).map(([hour, data]) => ({
      hour: formatHour12(parseInt(hour)),
      hourNum: parseInt(hour),
      ...data,
    }));
  }, [filteredMovements]);

  // Find peak dispatch hour
  const peakDispatchHour = useMemo(() => {
    const maxDispatches = Math.max(...peakHoursData.map(h => h.dispatches));
    return peakHoursData.find(h => h.dispatches === maxDispatches);
  }, [peakHoursData]);

  // Calculate destination distribution
  const destinationData = useMemo(() => {
    const bigShop = filteredMovements.filter(m => m.destination === 'big_shop');
    const smallShop = filteredMovements.filter(m => m.destination === 'small_shop');

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
  }, [filteredMovements]);

  // Calculate bundle volume forecasting (simple moving average)
  const forecastData = useMemo(() => {
    const last14Days = movementTrends.slice(-14);
    if (last14Days.length === 0) return [];
    
    const avgBundles = last14Days.reduce((sum, d) => sum + d.bundles, 0) / last14Days.length;
    
    // Calculate trend
    const firstHalf = last14Days.slice(0, Math.floor(last14Days.length / 2));
    const secondHalf = last14Days.slice(Math.floor(last14Days.length / 2));
    const firstAvg = firstHalf.length ? firstHalf.reduce((sum, d) => sum + d.bundles, 0) / firstHalf.length : 0;
    const secondAvg = secondHalf.length ? secondHalf.reduce((sum, d) => sum + d.bundles, 0) / secondHalf.length : 0;
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
    const historical = last14Days.map(d => ({
      date: d.date,
      bundles: d.bundles,
      forecast: null,
      type: 'historical',
    }));

    return [...historical, ...forecast];
  }, [movementTrends]);

  // Calculate comparison with previous period
  const periodComparison = useMemo(() => {
    const periodLength = movementTrends.length;
    const halfLength = Math.floor(periodLength / 2);
    
    const currentPeriod = movementTrends.slice(-halfLength);
    const previousPeriod = movementTrends.slice(-periodLength, -halfLength);

    const currentBundles = currentPeriod.reduce((sum, d) => sum + d.bundles, 0);
    const previousBundles = previousPeriod.reduce((sum, d) => sum + d.bundles, 0);
    
    const currentDispatches = currentPeriod.reduce((sum, d) => sum + d.dispatches, 0);
    const previousDispatches = previousPeriod.reduce((sum, d) => sum + d.dispatches, 0);

    const bundleChange = previousBundles > 0 
      ? ((currentBundles - previousBundles) / previousBundles * 100)
      : 0;
    
    const dispatchChange = previousDispatches > 0
      ? ((currentDispatches - previousDispatches) / previousDispatches * 100)
      : 0;

    return {
      currentBundles,
      previousBundles,
      currentDispatches,
      previousDispatches,
      bundleChange: parseFloat(bundleChange.toFixed(1)),
      dispatchChange: parseFloat(dispatchChange.toFixed(1)),
    };
  }, [movementTrends]);

  // Callbacks for filter changes
  const handleDateRangeChange = useCallback((range: DateRange) => {
    setDateRange(range);
  }, []);

  const handleMetricFilterChange = useCallback((value: 'bundles' | 'pieces' | 'all') => {
    setMetricFilter(value);
  }, []);

  const handleItemFilterChange = useCallback((value: 'all' | 'shirt' | 'pant') => {
    setItemFilter(value);
  }, []);

  const avgDailyBundles = movementTrends.length > 0 
    ? Math.round(movementTrends.reduce((sum, d) => sum + d.bundles, 0) / movementTrends.length)
    : 0;

  return (
    <div className="p-4 space-y-6">
      {/* Date Range Filter */}
      <AnalyticsDateFilter 
        dateRange={dateRange} 
        onDateRangeChange={handleDateRangeChange} 
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard
          title="Period Bundles"
          value={periodComparison.currentBundles}
          subtitle="Current period"
          change={periodComparison.bundleChange}
          gradient="bg-gradient-to-br from-blue-500 to-blue-600"
        />
        <SummaryCard
          title="Dispatches"
          value={periodComparison.currentDispatches}
          subtitle="Current period"
          change={periodComparison.dispatchChange}
          gradient="bg-gradient-to-br from-green-500 to-green-600"
        />
        <SummaryCard
          title="Peak Hour"
          value={peakDispatchHour?.hour || 'N/A'}
          subtitle={`${peakDispatchHour?.dispatches || 0} dispatches`}
          gradient="bg-gradient-to-br from-purple-500 to-purple-600"
          icon={Clock}
        />
        <SummaryCard
          title="Avg Daily"
          value={avgDailyBundles}
          subtitle="Bundles"
          gradient="bg-gradient-to-br from-amber-500 to-amber-600"
          icon={Target}
        />
      </div>

      {/* Movement Trends Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            Movement Trends
          </CardTitle>
          <CardDescription>
            Daily dispatch count and bundle volume ({format(dateRange.from, 'MMM dd')} - {format(dateRange.to, 'MMM dd')})
          </CardDescription>
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

      {/* Item-wise Charts Section */}
      <div className="space-y-2">
        <h2 className="text-lg font-semibold px-1">Item-wise Analysis</h2>
        <ItemWiseCharts
          movements={filteredMovements}
          metricFilter={metricFilter}
          itemFilter={itemFilter}
          onMetricFilterChange={handleMetricFilterChange}
          onItemFilterChange={handleItemFilterChange}
        />
      </div>

      {/* Two column layout for smaller charts */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Peak Hours Analysis with 12-hour format */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="h-5 w-5 text-purple-600" />
              Peak Hours Analysis
            </CardTitle>
            <CardDescription>Dispatch activity by hour of day (12-hour format)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={peakHoursData.filter(h => h.hourNum >= 6 && h.hourNum <= 22)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="hour" 
                    tick={{ fontSize: 9 }}
                    stroke="#9ca3af"
                    interval={1}
                    angle={-45}
                    textAnchor="end"
                    height={50}
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
      {forecastData.length > 0 && (
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
      )}
    </div>
  );
});
