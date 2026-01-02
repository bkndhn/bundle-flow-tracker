
import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from 'lucide-react';
import { DATE_FILTER_OPTIONS } from '@/lib/constants';
import { format } from 'date-fns';

interface DateFilterProps {
  onFilterChange: (filter: {
    type: string;
    startDate?: string;
    endDate?: string;
  }) => void;
}

export function DateFilter({ onFilterChange }: DateFilterProps) {
  const today = format(new Date(), 'yyyy-MM-dd');
  const [filterType, setFilterType] = useState('today');
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);

  const handleFilterTypeChange = (value: string) => {
    setFilterType(value);
    if (value !== 'custom') {
      onFilterChange({ type: value });
    } else {
      // When switching to custom, apply the current dates
      onFilterChange({ type: 'custom', startDate, endDate });
    }
  };

  const handleStartDateChange = (value: string) => {
    setStartDate(value);
    // If end date is before start date, update end date to match start date
    if (endDate < value) {
      setEndDate(value);
      onFilterChange({ type: 'custom', startDate: value, endDate: value });
    } else {
      onFilterChange({ type: 'custom', startDate: value, endDate });
    }
  };

  const handleEndDateChange = (value: string) => {
    setEndDate(value);
    onFilterChange({ type: 'custom', startDate, endDate: value });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-gray-500" />
        <Label className="text-sm font-medium">Date Filter</Label>
      </div>

      <Select value={filterType} onValueChange={handleFilterTypeChange}>
        <SelectTrigger className="w-[200px] bg-white/90">
          <SelectValue placeholder="Select date range" />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(DATE_FILTER_OPTIONS).map(([key, label]) => (
            <SelectItem key={key} value={key}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {filterType === 'custom' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-sm">From Date</Label>
            <Input
              type="date"
              value={startDate}
              max={today}
              onChange={(e) => handleStartDateChange(e.target.value)}
              className="bg-white/90"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm">To Date</Label>
            <Input
              type="date"
              value={endDate}
              min={startDate}
              max={today}
              onChange={(e) => handleEndDateChange(e.target.value)}
              className="bg-white/90"
            />
          </div>
        </div>
      )}
    </div>
  );
}
