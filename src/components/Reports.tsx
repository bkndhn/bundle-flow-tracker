
import { useState } from 'react';
import { GoodsMovement } from '@/types';
import { LOCATIONS, MOVEMENT_STATUS, FARE_PAYMENT_OPTIONS } from '@/lib/constants';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Download, Search } from 'lucide-react';
import { format, isToday, isYesterday, isThisWeek, isThisMonth, isThisYear, parseISO, isWithinInterval } from 'date-fns';
import { DateFilter } from './reports/DateFilter';

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

export function Reports({ movements }: ReportsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'dispatched' | 'received'>('all');
  const [locationFilter, setLocationFilter] = useState<'all' | 'big_shop' | 'small_shop'>('all');
  const [itemFilter, setItemFilter] = useState<'all' | 'shirt' | 'pant' | 'both'>('all');
  const [movementTypeFilter, setMovementTypeFilter] = useState<'all' | 'bundles' | 'pieces'>('all');
  const [dateFilter, setDateFilter] = useState<DateFilterType>({ type: 'today' });

  // Expand movements for display (split 'both' items into separate rows)
  const expandedMovements = expandMovementsForDisplay(movements);

  const filteredMovements = expandedMovements.filter(movement => {
    const matchesSearch =
      movement.sent_by_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      movement.received_by_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      movement.accompanying_person?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      movement.auto_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      movement.destination.toLowerCase().includes(searchTerm.toLowerCase()) ||
      movement.condition_notes?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || movement.status === statusFilter;
    const matchesLocation = locationFilter === 'all' || movement.destination === locationFilter;
    const matchesItem = itemFilter === 'all' || movement.item === itemFilter;
    const matchesMovementType =
      movementTypeFilter === 'all' ||
      (movementTypeFilter === 'bundles' && (movement.movement_type === 'bundles' || !movement.movement_type)) ||
      (movementTypeFilter === 'pieces' && movement.movement_type === 'pieces');

    // Date filtering
    const movementDate = parseISO(movement.dispatch_date);
    let matchesDate = true;

    switch (dateFilter.type) {
      case 'today':
        matchesDate = isToday(movementDate);
        break;
      case 'yesterday':
        matchesDate = isYesterday(movementDate);
        break;
      case 'this_week':
        matchesDate = isThisWeek(movementDate);
        break;
      case 'this_month':
        matchesDate = isThisMonth(movementDate);
        break;
      case 'this_year':
        matchesDate = isThisYear(movementDate);
        break;
      case 'custom':
        if (dateFilter.startDate && dateFilter.endDate) {
          matchesDate = isWithinInterval(movementDate, {
            start: parseISO(dateFilter.startDate),
            end: parseISO(dateFilter.endDate)
          });
        }
        break;
    }

    return matchesSearch && matchesStatus && matchesLocation && matchesItem && matchesDate && matchesMovementType;
  });

  const formatDateTime = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy hh:mm a');
  };

  const getStatusBadge = (status: string) => {
    return status === 'received' ? (
      <Badge variant="default" className="bg-green-100 text-green-800">
        {MOVEMENT_STATUS.received}
      </Badge>
    ) : (
      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
        {MOVEMENT_STATUS.dispatched}
      </Badge>
    );
  };

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
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by staff name, destination, auto name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white/90"
                />
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                <SelectTrigger className="w-[140px] bg-white/90">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="dispatched">Dispatched</SelectItem>
                  <SelectItem value="received">Received</SelectItem>
                </SelectContent>
              </Select>

              <Select value={locationFilter} onValueChange={(value: any) => setLocationFilter(value)}>
                <SelectTrigger className="w-[140px] bg-white/90">
                  <SelectValue placeholder="All Locations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  <SelectItem value="big_shop">Big Shop</SelectItem>
                  <SelectItem value="small_shop">Small Shop</SelectItem>
                </SelectContent>
              </Select>

              <Select value={itemFilter} onValueChange={(value: any) => setItemFilter(value)}>
                <SelectTrigger className="w-[120px] bg-white/90">
                  <SelectValue placeholder="All Items" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Items</SelectItem>
                  <SelectItem value="shirt">Shirt</SelectItem>
                  <SelectItem value="pant">Pant</SelectItem>
                  <SelectItem value="both">Both</SelectItem>
                </SelectContent>
              </Select>

              <Select value={movementTypeFilter} onValueChange={(value: any) => setMovementTypeFilter(value)}>
                <SelectTrigger className="w-[140px] bg-white/90">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="bundles">Bundles</SelectItem>
                  <SelectItem value="pieces">Pieces</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" size="sm" className="bg-white/70">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          {/* Date Filter */}
          <div className="mb-6">
            <DateFilter onFilterChange={setDateFilter} />
          </div>

          {/* Summary Stats - Updated to use original movements for totals */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50/80 p-3 rounded-lg backdrop-blur-sm">
              <div className="text-sm text-blue-600 font-medium">Total Movements</div>
              <div className="text-2xl font-bold text-blue-900">{movements.length}</div>
            </div>
            <div className="bg-green-50/80 p-3 rounded-lg backdrop-blur-sm">
              <div className="text-sm text-green-600 font-medium">Completed</div>
              <div className="text-2xl font-bold text-green-900">
                {movements.filter(m => m.status === 'received').length}
              </div>
            </div>
            <div className="bg-yellow-50/80 p-3 rounded-lg backdrop-blur-sm">
              <div className="text-sm text-yellow-600 font-medium">Pending</div>
              <div className="text-2xl font-bold text-yellow-900">
                {movements.filter(m => m.status === 'dispatched').length}
              </div>
            </div>
            <div className="bg-purple-50/80 p-3 rounded-lg backdrop-blur-sm">
              <div className="text-sm text-purple-600 font-medium">Total Volume</div>
              <div className="text-2xl font-bold text-purple-900">
                {movements.reduce((sum, m) => sum + m.bundles_count, 0)}
              </div>
            </div>
          </div>

          {/* Movements Table - Updated to use filtered expanded movements */}
          <div className="border rounded-lg overflow-hidden bg-white/60 backdrop-blur-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/80">
                  <TableHead className="font-semibold">Dispatch Date</TableHead>
                  <TableHead className="font-semibold">Item</TableHead>
                  <TableHead className="font-semibold">Bundles</TableHead>
                  <TableHead className="font-semibold">Pieces</TableHead>
                  <TableHead className="font-semibold">Destination</TableHead>
                  <TableHead className="font-semibold">Auto Name</TableHead>
                  <TableHead className="font-semibold">Sent By</TableHead>
                  <TableHead className="font-semibold">Accompanying</TableHead>
                  <TableHead className="font-semibold">Fare Payment</TableHead>
                  <TableHead className="font-semibold">Received By</TableHead>
                  <TableHead className="font-semibold">Received At</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold">Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMovements.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={12} className="text-center py-8 text-gray-500">
                      No movements found matching your criteria
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMovements.map((movement, index) => (
                    <TableRow key={`${movement.id}-${movement.item}-${index}`} className="hover:bg-gray-50/60">
                      <TableCell className="font-medium">
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
                        <span className="font-medium text-blue-600">
                          {LOCATIONS[movement.destination]}
                        </span>
                      </TableCell>
                      <TableCell className="font-medium">
                        {movement.auto_name || (
                          <span className="text-gray-400 italic text-sm">Not specified</span>
                        )}
                      </TableCell>
                      <TableCell>{movement.sent_by_name || 'Unknown'}</TableCell>
                      <TableCell>
                        {movement.accompanying_person || (
                          <span className="text-gray-400 italic text-sm">None</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-xs">
                          {movement.fare_display_msg || FARE_PAYMENT_OPTIONS[movement.fare_payment]}
                        </span>
                      </TableCell>
                      <TableCell>
                        {movement.received_by_name || (
                          <span className="text-gray-400 italic text-sm">Pending</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {movement.received_at ? (
                          formatDateTime(movement.received_at)
                        ) : (
                          <span className="text-gray-400 italic text-sm">Pending</span>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(movement.status)}</TableCell>
                      <TableCell>
                        {movement.condition_notes ? (
                          <span className="text-sm">{movement.condition_notes}</span>
                        ) : (
                          <span className="text-gray-400 italic text-sm">No notes</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
