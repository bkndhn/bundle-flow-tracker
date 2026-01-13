import { useState, useCallback, memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon, Filter } from 'lucide-react';
import { format, subDays, startOfWeek, startOfMonth, startOfYear, endOfDay, startOfDay } from 'date-fns';
import { cn } from '@/lib/utils';

export interface DateRange {
  from: Date;
  to: Date;
}

interface AnalyticsDateFilterProps {
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
}

const QUICK_FILTERS = [
  { label: 'Last 7 Days', value: '7d' },
  { label: 'Last 30 Days', value: '30d' },
  { label: 'This Week', value: 'week' },
  { label: 'This Month', value: 'month' },
  { label: 'This Year', value: 'year' },
  { label: 'Custom', value: 'custom' },
] as const;

export const AnalyticsDateFilter = memo(function AnalyticsDateFilter({
  dateRange,
  onDateRangeChange,
}: AnalyticsDateFilterProps) {
  const [quickFilter, setQuickFilter] = useState<string>('30d');
  const [fromOpen, setFromOpen] = useState(false);
  const [toOpen, setToOpen] = useState(false);

  const handleQuickFilterChange = useCallback((value: string) => {
    setQuickFilter(value);
    const today = new Date();
    let from: Date;
    let to: Date = endOfDay(today);

    switch (value) {
      case '7d':
        from = startOfDay(subDays(today, 6));
        break;
      case '30d':
        from = startOfDay(subDays(today, 29));
        break;
      case 'week':
        from = startOfWeek(today, { weekStartsOn: 1 });
        break;
      case 'month':
        from = startOfMonth(today);
        break;
      case 'year':
        from = startOfYear(today);
        break;
      default:
        return; // Don't change dates for 'custom'
    }

    onDateRangeChange({ from, to });
  }, [onDateRangeChange]);

  const handleFromDateSelect = useCallback((date: Date | undefined) => {
    if (date) {
      const newFrom = startOfDay(date);
      // If selected from date is after current to date, adjust to date
      const newTo = newFrom > dateRange.to ? endOfDay(date) : dateRange.to;
      onDateRangeChange({ from: newFrom, to: newTo });
      setQuickFilter('custom');
      setFromOpen(false);
    }
  }, [dateRange.to, onDateRangeChange]);

  const handleToDateSelect = useCallback((date: Date | undefined) => {
    if (date) {
      onDateRangeChange({ from: dateRange.from, to: endOfDay(date) });
      setQuickFilter('custom');
      setToOpen(false);
    }
  }, [dateRange.from, onDateRangeChange]);

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm">
      <CardContent className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Filter className="h-4 w-4" />
            <span>Date Range:</span>
          </div>

          <Select value={quickFilter} onValueChange={handleQuickFilterChange}>
            <SelectTrigger className="w-[140px] h-9 bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {QUICK_FILTERS.map((filter) => (
                <SelectItem key={filter.value} value={filter.value}>
                  {filter.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2">
            <Popover open={fromOpen} onOpenChange={setFromOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "h-9 px-3 bg-white justify-start text-left font-normal",
                    !dateRange.from && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(dateRange.from, "MMM dd, yyyy")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateRange.from}
                  onSelect={handleFromDateSelect}
                  disabled={(date) => date > new Date()}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>

            <span className="text-muted-foreground text-sm">to</span>

            <Popover open={toOpen} onOpenChange={setToOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "h-9 px-3 bg-white justify-start text-left font-normal",
                    !dateRange.to && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(dateRange.to, "MMM dd, yyyy")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateRange.to}
                  onSelect={handleToDateSelect}
                  disabled={(date) => date > new Date() || date < dateRange.from}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});
