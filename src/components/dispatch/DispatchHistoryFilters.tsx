import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { CalendarIcon, Filter, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export interface DispatchFilters { dateFrom?: Date; dateTo?: Date; itemType: string; source: string; destination: string; }
interface DispatchHistoryFiltersProps { filters: DispatchFilters; onFiltersChange: (filters: DispatchFilters) => void; }

export function DispatchHistoryFilters({ filters, onFiltersChange }: DispatchHistoryFiltersProps) {
  const [showFilters, setShowFilters] = useState(false);

  const activeFilterCount = [filters.dateFrom || filters.dateTo, filters.itemType !== 'all', filters.source !== 'all', filters.destination !== 'all'].filter(Boolean).length;

  const clearFilters = () => { onFiltersChange({ itemType: 'all', source: 'all', destination: 'all' }); };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)} className="text-xs gap-1.5">
          <Filter className="h-3 w-3" /> Filters
          {activeFilterCount > 0 && (<Badge className="bg-blue-600 text-white text-[10px] px-1.5 py-0 ml-1">{activeFilterCount}</Badge>)}
        </Button>
        {activeFilterCount > 0 && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs text-muted-foreground h-7 px-2"><X className="h-3 w-3 mr-1" /> Clear</Button>
        )}
      </div>

      {showFilters && (
        <div className="grid grid-cols-2 gap-3 p-3 bg-muted/30 rounded-lg border border-border">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">From Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className={cn("w-full justify-start text-left text-xs h-8", !filters.dateFrom && "text-muted-foreground")}>
                  <CalendarIcon className="h-3 w-3 mr-1" />
                  {filters.dateFrom ? format(filters.dateFrom, "dd/MM/yyyy") : "Start date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={filters.dateFrom} onSelect={(date) => onFiltersChange({ ...filters, dateFrom: date || undefined })} initialFocus className={cn("p-3 pointer-events-auto")} />
              </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">To Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className={cn("w-full justify-start text-left text-xs h-8", !filters.dateTo && "text-muted-foreground")}>
                  <CalendarIcon className="h-3 w-3 mr-1" />
                  {filters.dateTo ? format(filters.dateTo, "dd/MM/yyyy") : "End date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={filters.dateTo} onSelect={(date) => onFiltersChange({ ...filters, dateTo: date || undefined })} initialFocus className={cn("p-3 pointer-events-auto")} />
              </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Item</label>
            <Select value={filters.itemType} onValueChange={(v) => onFiltersChange({ ...filters, itemType: v })}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Items</SelectItem>
                <SelectItem value="shirt">Shirt</SelectItem>
                <SelectItem value="pant">Pant</SelectItem>
                <SelectItem value="both">Both</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Source</label>
            <Select value={filters.source} onValueChange={(v) => onFiltersChange({ ...filters, source: v })}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="godown">Godown</SelectItem>
                <SelectItem value="big_shop">Big Shop</SelectItem>
                <SelectItem value="small_shop">Small Shop</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2 space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Destination</label>
            <Select value={filters.destination} onValueChange={(v) => onFiltersChange({ ...filters, destination: v })}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Destinations</SelectItem>
                <SelectItem value="godown">Godown</SelectItem>
                <SelectItem value="big_shop">Big Shop</SelectItem>
                <SelectItem value="small_shop">Small Shop</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    </div>
  );
}
