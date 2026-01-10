
import { useState } from 'react';
import { GoodsMovement } from '@/types';
import { LOCATIONS, MOVEMENT_STATUS, FARE_PAYMENT_OPTIONS } from '@/lib/constants';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Download, FileText, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, isToday, isYesterday, isThisWeek, isThisMonth, isThisYear } from 'date-fns';
import { DateFilter } from './reports/DateFilter';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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

export function Reports({ movements }: ReportsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'dispatched' | 'received'>('all');
  const [locationFilter, setLocationFilter] = useState<'all' | 'big_shop' | 'small_shop'>('all');
  const [itemFilter, setItemFilter] = useState<'all' | 'shirt' | 'pant' | 'both'>('all');
  const [movementTypeFilter, setMovementTypeFilter] = useState<'all' | 'bundles' | 'pieces'>('all');
  const [dateFilter, setDateFilter] = useState<DateFilterType>({ type: 'today' });
  const [currentPage, setCurrentPage] = useState(1);

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

    // Date filtering - use new Date() for proper timezone handling
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
        matchesDate = isThisWeek(movementDate, { weekStartsOn: 1 }); // Monday as week start
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

    return matchesSearch && matchesStatus && matchesLocation && matchesItem && matchesDate && matchesMovementType;
  });

  // Pagination
  const totalPages = Math.ceil(filteredMovements.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedMovements = filteredMovements.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Reset to page 1 when filters change
  const handleFilterChange = (setter: React.Dispatch<React.SetStateAction<any>>, value: any) => {
    setter(value);
    setCurrentPage(1);
  };

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

  // Define export columns - add any new columns here and they will be exported to both PDF and Excel
  const getExportData = () => {
    return filteredMovements.map(movement => ({
      'Dispatch Date': formatDateTime(movement.dispatch_date),
      'Item': movement.item.charAt(0).toUpperCase() + movement.item.slice(1),
      'Movement Type': movement.movement_type || 'bundles',
      'Bundles': (!movement.movement_type || movement.movement_type === 'bundles') ? movement.bundles_count : '',
      'Pieces': movement.movement_type === 'pieces' ? movement.bundles_count : '',
      'Source': LOCATIONS[movement.source] || 'Godown',
      'Destination': LOCATIONS[movement.destination],
      'Auto Name': movement.auto_name || '',
      'Sent By': movement.sent_by_name || 'Unknown',
      'Accompanying Person': movement.accompanying_person || '',
      'Fare Payment': movement.fare_display_msg || FARE_PAYMENT_OPTIONS[movement.fare_payment],
      'Received By': movement.received_by_name || 'Pending',
      'Received At': movement.received_at ? formatDateTime(movement.received_at) : 'Pending',
      'Status': MOVEMENT_STATUS[movement.status],
      'Dispatch Notes': movement.dispatch_notes || movement.condition_notes || '',
      'Receive Notes': movement.receive_notes || ''
    }));
  };

  // Export to Excel function
  const exportToExcel = () => {
    const exportData = getExportData();
    
    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(exportData);

    // Auto-fit columns
    const colWidths = Object.keys(exportData[0] || {}).map(key => {
      const maxLength = Math.max(
        key.length,
        ...exportData.map(row => String((row as any)[key] || '').length)
      );
      return { wch: Math.min(maxLength + 2, 50) };
    });
    ws['!cols'] = colWidths;

    // Create workbook and add worksheet
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Movements Report');

    // Generate filename with date
    const fileName = `goods_movements_report_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.xlsx`;

    // Download file
    XLSX.writeFile(wb, fileName);
  };

  // Export to PDF function
  const exportToPDF = () => {
    const exportData = getExportData();
    
    if (exportData.length === 0) return;

    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    // Add title
    doc.setFontSize(16);
    doc.text('Goods Movement Report', 14, 15);
    
    // Add date
    doc.setFontSize(10);
    doc.text(`Generated: ${format(new Date(), 'dd/MM/yyyy hh:mm a')}`, 14, 22);

    // Get column headers dynamically from the first row
    const headers = Object.keys(exportData[0]);
    
    // Convert data to array format for autoTable
    const tableData = exportData.map(row => 
      headers.map(header => String((row as any)[header] || ''))
    );

    // Generate table
    autoTable(doc, {
      head: [headers],
      body: tableData,
      startY: 28,
      styles: {
        fontSize: 7,
        cellPadding: 1.5,
      },
      headStyles: {
        fillColor: [59, 130, 246],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 7,
      },
      alternateRowStyles: {
        fillColor: [245, 247, 250]
      },
      margin: { left: 5, right: 5 },
      tableWidth: 'auto',
    });

    // Generate filename with date
    const fileName = `goods_movements_report_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.pdf`;

    // Download file
    doc.save(fileName);
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
          <div className="flex flex-col gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by staff name, destination, auto name..."
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

              <div className="flex gap-2 col-span-2 lg:col-span-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 h-9 bg-red-50 hover:bg-red-100 text-red-700 border-red-200"
                  onClick={exportToPDF}
                  disabled={filteredMovements.length === 0}
                >
                  <FileText className="h-4 w-4 mr-1" />
                  PDF
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 h-9 bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                  onClick={exportToExcel}
                  disabled={filteredMovements.length === 0}
                >
                  <Download className="h-4 w-4 mr-1" />
                  Excel
                </Button>
              </div>
            </div>
          </div>

          {/* Date Filter */}
          <div className="mb-6">
            <DateFilter onFilterChange={(filter) => { setDateFilter(filter); setCurrentPage(1); }} />
          </div>

          {/* Summary Stats - Using unique movement IDs for accurate count */}
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
            <div className="min-w-[1200px]">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/80">
                    <TableHead className="font-semibold">Dispatch Date</TableHead>
                    <TableHead className="font-semibold">Item</TableHead>
                    <TableHead className="font-semibold">Bundles</TableHead>
                    <TableHead className="font-semibold">Pieces</TableHead>
                    <TableHead className="font-semibold">Source</TableHead>
                    <TableHead className="font-semibold">Destination</TableHead>
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
                      <TableCell colSpan={15} className="text-center py-8 text-gray-500">
                        No movements found matching your criteria
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedMovements.map((movement, index) => (
                      <TableRow key={`${movement.id}-${movement.item}-${index}`} className="hover:bg-gray-50/60">
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
                        <TableCell className="font-medium whitespace-nowrap">
                          {movement.auto_name || (
                            <span className="text-gray-400 italic text-sm">Not specified</span>
                          )}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">{movement.sent_by_name || 'Unknown'}</TableCell>
                        <TableCell className="whitespace-nowrap">
                          {movement.accompanying_person || (
                            <span className="text-gray-400 italic text-sm">None</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="text-xs">
                            {movement.fare_display_msg || FARE_PAYMENT_OPTIONS[movement.fare_payment]}
                          </span>
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
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Pagination Controls */}
          {
            totalPages > 1 && (
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
            )
          }
        </CardContent >
      </Card >
    </div >
  );
}
