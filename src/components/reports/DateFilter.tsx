
import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from 'lucide-react';
import { DATE_FILTER_OPTIONS } from '@/lib/constants';

interface DateFilterProps {
  onFilterChange: (filter: {
    type: string;
    startDate?: string;
    endDate?: string;
  }) => void;
}

export function DateFilter({ onFilterChange }: DateFilterProps) {
  const [filterType, setFilterType] = useState('today');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handleFilterTypeChange = (value: string) => {
    setFilterType(value);
    if (value !== 'custom') {
      onFilterChange({ type: value });
    }
  };

  const handleDateRangeChange = () => {
    if (startDate && endDate) {
      onFilterChange({
        type: 'custom',
        startDate,
        endDate
      });
    }
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
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-sm">From Date</Label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                if (endDate) handleDateRangeChange();
              }}
              className="bg-white/90"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm">To Date</Label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                if (startDate) handleDateRangeChange();
              }}
              className="bg-white/90"
            />
          </div>
        </div>
      )}
    </div>
  );
}
