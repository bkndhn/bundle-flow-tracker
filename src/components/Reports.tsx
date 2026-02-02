
import { useState, useMemo, useCallback, memo } from 'react';
import { GoodsMovement } from '@/types';
import { LOCATIONS, MOVEMENT_STATUS, FARE_PAYMENT_OPTIONS, TRANSPORT_METHODS } from '@/lib/constants';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Download, Printer, Search, ChevronLeft, ChevronRight, CheckSquare, Square, Truck, Bike, Footprints } from 'lucide-react';
import { format, isToday, isYesterday, isThisWeek, isThisMonth, isThisYear } from 'date-fns';
import { DateFilter } from './reports/DateFilter';
import { formatDateTime12hr } from '@/lib/utils';
import * as XLSX from 'xlsx';
import { printReport } from '@/utils/printReport';

interface ReportsProps {
  movements: GoodsMovement[];
}

interface DateFilterType {
  type: string;
  startDate?: string;
  endDate?: string;
}

// Helper function to expand movements for display
const expandMovementsForDisplay = (movements: GoodsMovement[]) => {
  return movements.flatMap((movement) => {
    if (movement.item === 'both') {
      const expandedMovements = [];

      // Create shirt row if shirt bundles exist
      if (movement.shirt_bundles && movement.shirt_bundles > 0) {
        expandedMovements.push({
          ...movement,
          item: 'shirt' as const,
          bundles_count: movement.shirt_bundles,
        });
      }

      // Create pant row if pant bundles exist
      if (movement.pant_bundles && movement.pant_bundles > 0) {
        expandedMovements.push({
          ...movement,
          item: 'pant' as const,
          bundles_count: movement.pant_bundles,
        });
      }

      return expandedMovements;
    } else {
      return [movement];
    }
  });
};

const ITEMS_PER_PAGE = 20;

export const Reports = memo(function Reports({ movements }: ReportsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'dispatched' | 'received'>('all');
  const [locationFilter, setLocationFilter] = useState<'all' | 'big_shop' | 'small_shop'>('all');
  const [itemFilter, setItemFilter] = useState<'all' | 'shirt' | 'pant' | 'both'>('all');
  const [movementTypeFilter, setMovementTypeFilter] = useState<'all' | 'bundles' | 'pieces'>('all');
  const [transportFilter, setTransportFilter] = useState<'all' | 'auto' | 'bike' | 'by_walk'>('all');
  const [dateFilter, setDateFilter] = useState<DateFilterType>({ type: 'today' });
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  // Expand movements for display (split 'both' items into separate rows)
  const expandedMovements = useMemo(() => expandMovementsForDisplay(movements), [movements]);

  const filteredMovements = useMemo(() => {
    return expandedMovements.filter(movement => {
      // Enhanced search - search all available columns
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        movement.sent_by_name?.toLowerCase().includes(searchLower) ||
        movement.received_by_name?.toLowerCase().includes(searchLower) ||
        movement.accompanying_person?.toLowerCase().includes(searchLower) ||
        movement.auto_name?.toLowerCase().includes(searchLower) ||
        movement.destination.toLowerCase().includes(searchLower) ||
        (movement.source && movement.source.toLowerCase().includes(searchLower)) ||
        movement.condition_notes?.toLowerCase().includes(searchLower) ||
        movement.dispatch_notes?.toLowerCase().includes(searchLower) ||
        movement.receive_notes?.toLowerCase().includes(searchLower) ||
        movement.item.toLowerCase().includes(searchLower) ||
        movement.status.toLowerCase().includes(searchLower) ||
        (movement.movement_type || 'bundles').toLowerCase().includes(searchLower) ||
        movement.fare_display_msg?.toLowerCase().includes(searchLower) ||
        movement.fare_payee_tag?.toLowerCase().includes(searchLower) ||
        String(movement.bundles_count).includes(searchLower) ||
        LOCATIONS[movement.destination]?.toLowerCase().includes(searchLower) ||
        LOCATIONS[movement.source]?.toLowerCase().includes(searchLower) ||
        formatDateTime12hr(movement.dispatch_date).toLowerCase().includes(searchLower) ||
        (movement.received_at && formatDateTime12hr(movement.received_at).toLowerCase().includes(searchLower));

      const matchesStatus = statusFilter === 'all' || movement.status === statusFilter;
      const matchesLocation = locationFilter === 'all' || movement.destination === locationFilter;
      const matchesItem = itemFilter === 'all' || movement.item === itemFilter;
      const matchesMovementType =
        movementTypeFilter === 'all' ||
        (movementTypeFilter === 'bundles' && (movement.movement_type === 'bundles' || !movement.movement_type)) ||
        (movementTypeFilter === 'pieces' && movement.movement_type === 'pieces');
      
      const matchesTransport = 
        transportFilter === 'all' || 
        movement.transport_method === transportFilter ||
        (!movement.transport_method && transportFilter === 'auto');

      // Date filtering
      const movementDate = new Date(movement.dispatch_date);
      let matchesDate = true;

      switch (dateFilter.type) {
        case 'today':
          matchesDate = isToday(movementDate);
          break;
        case 'yesterday':
          matchesDate = isYesterday(movementDate);
          break;
        case 'this_week':
          matchesDate = isThisWeek(movementDate, { weekStartsOn: 1 });
          break;
        case 'this_month':
          matchesDate = isThisMonth(movementDate);
          break;
        case 'this_year':
          matchesDate = isThisYear(movementDate);
          break;
        case 'custom':
          if (dateFilter.startDate && dateFilter.endDate) {
            const startDate = new Date(dateFilter.startDate);
            startDate.setHours(0, 0, 0, 0);
            const endDate = new Date(dateFilter.endDate);
            endDate.setHours(23, 59, 59, 999);
            matchesDate = movementDate >= startDate && movementDate <= endDate;
          }
          break;
        case 'all':
          matchesDate = true;
          break;
      }

      return matchesSearch && matchesStatus && matchesLocation && matchesItem && matchesDate && matchesMovementType && matchesTransport;
    });
  }, [expandedMovements, searchTerm, statusFilter, locationFilter, itemFilter, movementTypeFilter, transportFilter, dateFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredMovements.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedMovements = filteredMovements.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Generate unique row keys
  const getRowKey = useCallback((movement: GoodsMovement, index: number) => 
    `${movement.id}-${movement.item}-${index}`, []);

  // Reset to page 1 when filters change
  const handleFilterChange = useCallback((setter: React.Dispatch<React.SetStateAction<any>>, value: any) => {
    setter(value);
    setCurrentPage(1);
    setSelectedRows(new Set()); // Clear selection on filter change
  }, []);

  // Selection handlers
  const toggleRowSelection = useCallback((key: string) => {
    setSelectedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  }, []);

  const selectAllOnPage = useCallback(() => {
    const allPageKeys = paginatedMovements.map((m, i) => getRowKey(m, startIndex + i));
    const allSelected = allPageKeys.every(key => selectedRows.has(key));
    
    setSelectedRows(prev => {
      const newSet = new Set(prev);
      if (allSelected) {
        // Deselect all on page
        allPageKeys.forEach(key => newSet.delete(key));
      } else {
        // Select all on page
        allPageKeys.forEach(key => newSet.add(key));
      }
      return newSet;
    });
  }, [paginatedMovements, startIndex, selectedRows, getRowKey]);

  const selectAllFiltered = useCallback(() => {
    const allKeys = filteredMovements.map((m, i) => getRowKey(m, i));
    const allSelected = allKeys.every(key => selectedRows.has(key));
    
    setSelectedRows(allSelected ? new Set() : new Set(allKeys));
  }, [filteredMovements, selectedRows, getRowKey]);

  const clearSelection = useCallback(() => {
    setSelectedRows(new Set());
  }, []);

  // Use consistent 12hr format helper
  const formatDateTime = formatDateTime12hr;

  const getStatusBadge = useCallback((status: string) => {
    return status === 'received' ? (
      <Badge variant="default" className="bg-green-100 text-green-800">
        {MOVEMENT_STATUS.received}
      </Badge>
    ) : (
      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
        {MOVEMENT_STATUS.dispatched}
      </Badge>
    );
  }, []);

  // Get export data for specific movements
  const getExportData = useCallback((movementsToExport: GoodsMovement[]) => {
    return movementsToExport.map(movement => ({
      'Dispatch Date': formatDateTime(movement.dispatch_date),
      'Item': movement.item.charAt(0).toUpperCase() + movement.item.slice(1),
      'Movement Type': movement.movement_type || 'bundles',
      'Bundles': (!movement.movement_type || movement.movement_type === 'bundles') ? movement.bundles_count : '',
      'Pieces': movement.movement_type === 'pieces' ? movement.bundles_count : '',
      'Source': LOCATIONS[movement.source] || 'Godown',
      'Destination': LOCATIONS[movement.destination],
      'Transport': TRANSPORT_METHODS[movement.transport_method] || 'Auto',
      'Auto Name': movement.transport_method === 'auto' ? (movement.auto_name || '') : '-',
      'Sent By': movement.sent_by_name || 'Unknown',
      'Accompanying Person': movement.accompanying_person || '',
      'Fare Payment': movement.transport_method === 'auto' 
        ? (movement.fare_display_msg || FARE_PAYMENT_OPTIONS[movement.fare_payment]) 
        : '-',
      'Received By': movement.received_by_name || 'Pending',
      'Received At': movement.received_at ? formatDateTime(movement.received_at) : 'Pending',
      'Status': MOVEMENT_STATUS[movement.status],
      'Dispatch Notes': movement.dispatch_notes || movement.condition_notes || '',
      'Receive Notes': movement.receive_notes || ''
    }));
  }, [formatDateTime]);

  // Get selected movements
  const getSelectedMovements = useCallback(() => {
    return filteredMovements.filter((m, i) => selectedRows.has(getRowKey(m, i)));
  }, [filteredMovements, selectedRows, getRowKey]);

  // Get date range string for filename
  const getDateRangeForFilename = useCallback(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    
    switch (dateFilter.type) {
      case 'today':
        return today;
      case 'yesterday': {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        return format(yesterday, 'yyyy-MM-dd');
      }
      case 'this_week': {
        const now = new Date();
        const dayOfWeek = now.getDay();
        const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        const monday = new Date(now);
        monday.setDate(now.getDate() + mondayOffset);
        return `${format(monday, 'yyyy-MM-dd')}_to_${today}`;
      }
      case 'this_month': {
        const firstOfMonth = new Date();
        firstOfMonth.setDate(1);
        return `${format(firstOfMonth, 'yyyy-MM-dd')}_to_${today}`;
      }
      case 'this_year': {
        const firstOfYear = new Date();
        firstOfYear.setMonth(0, 1);
        return `${format(firstOfYear, 'yyyy-MM-dd')}_to_${today}`;
      }
      case 'custom':
        if (dateFilter.startDate && dateFilter.endDate) {
          return dateFilter.startDate === dateFilter.endDate 
            ? dateFilter.startDate 
            : `${dateFilter.startDate}_to_${dateFilter.endDate}`;
        }
        return today;
      case 'all':
        return 'all_time';
      default:
        return today;
    }
  }, [dateFilter]);

  // Export to Excel function
  const exportToExcel = useCallback((useSelection: boolean = false) => {
    const movementsToExport = useSelection ? getSelectedMovements() : filteredMovements;
    const exportData = getExportData(movementsToExport);
    
    if (exportData.length === 0) return;

    const ws = XLSX.utils.json_to_sheet(exportData);

    const colWidths = Object.keys(exportData[0] || {}).map(key => {
      const maxLength = Math.max(
        key.length,
        ...exportData.map(row => String((row as any)[key] || '').length)
      );
      return { wch: Math.min(maxLength + 2, 50) };
    });
    ws['!cols'] = colWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Movements Report');

    const dateRange = getDateRangeForFilename();
    const fileName = `goods_movements_${dateRange}${useSelection ? '_selected' : ''}.xlsx`;

    XLSX.writeFile(wb, fileName);
  }, [filteredMovements, getSelectedMovements, getExportData, getDateRangeForFilename]);

  // Print functions using print dialog
  const handlePrintAll = useCallback(() => {
    const exportData = getExportData(filteredMovements);
    printReport(exportData, 'Goods Movement Report - All Filtered');
  }, [filteredMovements, getExportData]);

  const handlePrintSelected = useCallback(() => {
    const selectedMovements = getSelectedMovements();
    if (selectedMovements.length === 0) {
      alert('Please select at least one row to print');
      return;
    }
    const exportData = getExportData(selectedMovements);
    printReport(exportData, `Goods Movement Report - ${selectedMovements.length} Selected`);
  }, [getSelectedMovements, getExportData]);

  const isAllPageSelected = paginatedMovements.length > 0 && 
    paginatedMovements.every((m, i) => selectedRows.has(getRowKey(m, startIndex + i)));

  return (
    <div className="p-4 space-y-4">
      <Card className="backdrop-blur-sm bg-white/80 border-white/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-800">
            <Calendar className="h-5 w-5" />
            Movement Reports
          </CardTitle>
          <CardDescription className="text-gray-600">
            Complete history of all goods movements with detailed information
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search and Filter Controls */}
          <div className="flex flex-col gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search all columns: staff, auto, notes, dates..."
                  value={searchTerm}
                  onChange={(e) => handleFilterChange(setSearchTerm, e.target.value)}
                  className="pl-10 bg-white/90"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 lg:flex lg:gap-2 gap-2">
              <Select value={statusFilter} onValueChange={(value: any) => handleFilterChange(setStatusFilter, value)}>
                <SelectTrigger className="h-9 bg-white/90 w-full lg:flex-1">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="dispatched">Dispatched</SelectItem>
                  <SelectItem value="received">Received</SelectItem>
                </SelectContent>
              </Select>

              <Select value={locationFilter} onValueChange={(value: any) => handleFilterChange(setLocationFilter, value)}>
                <SelectTrigger className="h-9 bg-white/90 w-full lg:flex-1">
                  <SelectValue placeholder="Location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  <SelectItem value="godown">Godown</SelectItem>
                  <SelectItem value="big_shop">Big Shop</SelectItem>
                  <SelectItem value="small_shop">Small Shop</SelectItem>
                </SelectContent>
              </Select>

              <Select value={itemFilter} onValueChange={(value: any) => handleFilterChange(setItemFilter, value)}>
                <SelectTrigger className="h-9 bg-white/90 w-full lg:flex-1">
                  <SelectValue placeholder="Item" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Items</SelectItem>
                  <SelectItem value="shirt">Shirt</SelectItem>
                  <SelectItem value="pant">Pant</SelectItem>
                  <SelectItem value="both">Both</SelectItem>
                </SelectContent>
              </Select>

              <Select value={movementTypeFilter} onValueChange={(value: any) => handleFilterChange(setMovementTypeFilter, value)}>
                <SelectTrigger className="h-9 bg-white/90 w-full lg:flex-1">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="bundles">Bundles</SelectItem>
                  <SelectItem value="pieces">Pieces</SelectItem>
                </SelectContent>
              </Select>

              <Select value={transportFilter} onValueChange={(value: any) => handleFilterChange(setTransportFilter, value)}>
                <SelectTrigger className="h-9 bg-white/90 w-full lg:flex-1">
                  <SelectValue placeholder="Transport" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Transport</SelectItem>
                  <SelectItem value="auto">
                    <span className="flex items-center gap-1"><Truck className="h-3 w-3" /> Auto</span>
                  </SelectItem>
                  <SelectItem value="bike">
                    <span className="flex items-center gap-1"><Bike className="h-3 w-3" /> Bike</span>
                  </SelectItem>
                  <SelectItem value="by_walk">
                    <span className="flex items-center gap-1"><Footprints className="h-3 w-3" /> Walk</span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Export Buttons Row */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-9 bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                onClick={handlePrintAll}
                disabled={filteredMovements.length === 0}
              >
                <Printer className="h-4 w-4 mr-1" />
                Print All ({filteredMovements.length})
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-9 bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200"
                onClick={handlePrintSelected}
                disabled={selectedRows.size === 0}
              >
                <Printer className="h-4 w-4 mr-1" />
                Print Selected ({selectedRows.size})
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-9 bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                onClick={() => exportToExcel(false)}
                disabled={filteredMovements.length === 0}
              >
                <Download className="h-4 w-4 mr-1" />
                Excel All
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-9 bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                onClick={() => exportToExcel(true)}
                disabled={selectedRows.size === 0}
              >
                <Download className="h-4 w-4 mr-1" />
                Excel Selected
              </Button>
            </div>

            {/* Selection Controls */}
            {filteredMovements.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={selectAllOnPage}
                  className="h-7 text-xs"
                >
                  {isAllPageSelected ? <CheckSquare className="h-3 w-3 mr-1" /> : <Square className="h-3 w-3 mr-1" />}
                  {isAllPageSelected ? 'Deselect Page' : 'Select Page'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={selectAllFiltered}
                  className="h-7 text-xs"
                >
                  Select All ({filteredMovements.length})
                </Button>
                {selectedRows.size > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearSelection}
                    className="h-7 text-xs text-red-600 hover:text-red-700"
                  >
                    Clear Selection
                  </Button>
                )}
                {selectedRows.size > 0 && (
                  <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                    {selectedRows.size} selected
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* Date Filter */}
          <div className="mb-6">
            <DateFilter onFilterChange={(filter) => { setDateFilter(filter); setCurrentPage(1); setSelectedRows(new Set()); }} />
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50/80 p-3 rounded-lg backdrop-blur-sm">
              <div className="text-sm text-blue-600 font-medium">Total Movements</div>
              <div className="text-2xl font-bold text-blue-900">
                {new Set(filteredMovements.map(m => m.id)).size}
              </div>
            </div>
            <div className="bg-green-50/80 p-3 rounded-lg backdrop-blur-sm">
              <div className="text-sm text-green-600 font-medium">Completed</div>
              <div className="text-2xl font-bold text-green-900">
                {new Set(filteredMovements.filter(m => m.status === 'received').map(m => m.id)).size}
              </div>
            </div>
            <div className="bg-yellow-50/80 p-3 rounded-lg backdrop-blur-sm">
              <div className="text-sm text-yellow-600 font-medium">Pending</div>
              <div className="text-2xl font-bold text-yellow-900">
                {new Set(filteredMovements.filter(m => m.status === 'dispatched').map(m => m.id)).size}
              </div>
            </div>
            <div className="bg-purple-50/80 p-3 rounded-lg backdrop-blur-sm">
              <div className="text-sm text-purple-600 font-medium">Total Volume</div>
              <div className="text-2xl font-bold text-purple-900">
                {filteredMovements.reduce((sum, m) => sum + m.bundles_count, 0)}
              </div>
            </div>
          </div>

          {/* Movements Table */}
          <div className="border rounded-lg overflow-x-auto bg-white/60 backdrop-blur-sm">
            <div className="min-w-[1400px]">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/80">
                    <TableHead className="w-10">
                      <Checkbox 
                        checked={isAllPageSelected && paginatedMovements.length > 0}
                        onCheckedChange={selectAllOnPage}
                        aria-label="Select all on page"
                      />
                    </TableHead>
                    <TableHead className="font-semibold">Dispatch Date</TableHead>
                    <TableHead className="font-semibold">Item</TableHead>
                    <TableHead className="font-semibold">Bundles</TableHead>
                    <TableHead className="font-semibold">Pieces</TableHead>
                    <TableHead className="font-semibold">Source</TableHead>
                    <TableHead className="font-semibold">Destination</TableHead>
                    <TableHead className="font-semibold">Transport</TableHead>
                    <TableHead className="font-semibold">Auto Name</TableHead>
                    <TableHead className="font-semibold">Sent By</TableHead>
                    <TableHead className="font-semibold">Accompanying</TableHead>
                    <TableHead className="font-semibold">Fare Payment</TableHead>
                    <TableHead className="font-semibold">Received By</TableHead>
                    <TableHead className="font-semibold">Received At</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold">Dispatch Notes</TableHead>
                    <TableHead className="font-semibold">Receive Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedMovements.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={17} className="text-center py-8 text-gray-500">
                        No movements found matching your criteria
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedMovements.map((movement, index) => {
                      const rowKey = getRowKey(movement, startIndex + index);
                      const isSelected = selectedRows.has(rowKey);
                      
                      return (
                        <TableRow 
                          key={rowKey} 
                          className={`hover:bg-gray-50/60 cursor-pointer ${isSelected ? 'bg-blue-50/60' : ''}`}
                          onClick={() => toggleRowSelection(rowKey)}
                        >
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <Checkbox 
                              checked={isSelected}
                              onCheckedChange={() => toggleRowSelection(rowKey)}
                              aria-label={`Select row ${index + 1}`}
                            />
                          </TableCell>
                          <TableCell className="font-medium whitespace-nowrap">
                            {formatDateTime(movement.dispatch_date)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize bg-white/80">
                              {movement.item}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {(!movement.movement_type || movement.movement_type === 'bundles') ? (
                              <Badge variant="outline" className="bg-white/80">{movement.bundles_count}</Badge>
                            ) : '-'}
                          </TableCell>
                          <TableCell>
                            {movement.movement_type === 'pieces' ? (
                              <Badge variant="outline" className="bg-white/80">{movement.bundles_count}</Badge>
                            ) : '-'}
                          </TableCell>
                          <TableCell>
                            <span className="font-medium text-purple-600 whitespace-nowrap">
                              {LOCATIONS[movement.source] || 'Godown'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="font-medium text-blue-600 whitespace-nowrap">
                              {LOCATIONS[movement.destination]}
                            </span>
                          </TableCell>
                          <TableCell>
                            {movement.transport_method === 'auto' && (
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                <Truck className="h-3 w-3 mr-1" />
                                Auto
                              </Badge>
                            )}
                            {movement.transport_method === 'bike' && (
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                <Bike className="h-3 w-3 mr-1" />
                                Bike
                              </Badge>
                            )}
                            {movement.transport_method === 'by_walk' && (
                              <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                                <Footprints className="h-3 w-3 mr-1" />
                                Walk
                              </Badge>
                            )}
                            {!movement.transport_method && (
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                <Truck className="h-3 w-3 mr-1" />
                                Auto
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="font-medium whitespace-nowrap">
                            {movement.transport_method === 'auto' || !movement.transport_method ? (
                              movement.auto_name || (
                                <span className="text-gray-400 italic text-sm">Not specified</span>
                              )
                            ) : (
                              <span className="text-gray-400 italic text-sm">-</span>
                            )}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">{movement.sent_by_name || 'Unknown'}</TableCell>
                          <TableCell className="whitespace-nowrap">
                            {movement.accompanying_person || (
                              <span className="text-gray-400 italic text-sm">None</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {movement.transport_method === 'auto' || !movement.transport_method ? (
                              <span className="text-xs">
                                {movement.fare_display_msg || FARE_PAYMENT_OPTIONS[movement.fare_payment]}
                              </span>
                            ) : (
                              <span className="text-gray-400 italic text-sm">-</span>
                            )}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {movement.received_by_name || (
                              <span className="text-gray-400 italic text-sm">Pending</span>
                            )}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {movement.received_at ? (
                              formatDateTime(movement.received_at)
                            ) : (
                              <span className="text-gray-400 italic text-sm">Pending</span>
                            )}
                          </TableCell>
                          <TableCell>{getStatusBadge(movement.status)}</TableCell>
                          <TableCell>
                            {movement.dispatch_notes || movement.condition_notes ? (
                              <span className="text-sm line-clamp-2 max-w-[150px]">{movement.dispatch_notes || movement.condition_notes}</span>
                            ) : (
                              <span className="text-gray-400 italic text-sm">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {movement.receive_notes ? (
                              <span className="text-sm line-clamp-2 max-w-[150px]">{movement.receive_notes}</span>
                            ) : (
                              <span className="text-gray-400 italic text-sm">-</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between mt-4 px-2 gap-3">
              <div className="text-sm text-gray-600 text-center sm:text-left">
                Showing {startIndex + 1} to {Math.min(startIndex + ITEMS_PER_PAGE, filteredMovements.length)} of {filteredMovements.length} entries
              </div>
              <div className="flex items-center gap-1 flex-wrap justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="bg-white/80 px-2 sm:px-3"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">Previous</span>
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage <= 2) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 1) {
                      pageNum = totalPages - 2 + i;
                    } else {
                      pageNum = currentPage - 1 + i;
                    }
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className={`${currentPage === pageNum ? "bg-blue-600" : "bg-white/80"} min-w-[36px]`}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="bg-white/80 px-2 sm:px-3"
                >
                  <span className="hidden sm:inline">Next</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
});

export { Reports as default };
