'use client';

import React, { useState, useMemo } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from './ui/table';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { 
  Edit2, 
  Trash2, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  ArrowUpDown,
  Calendar
} from 'lucide-react';
import { BPReading } from '@/types';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from './ui/dialog';
import { db } from '@/lib/db';

interface BPHistoryProps {
  readings: BPReading[];
  onRefresh: () => void;
  onEdit: (reading: BPReading) => void;
}

export function BPHistory({ readings, onRefresh, onEdit }: BPHistoryProps) {
  // Filters state
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Sorting state
  const [sortField, setSortField] = useState<'time' | 'systolic'>('time');
  const [sortAsc, setSortAsc] = useState(false);

  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Delete modal state
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filtered & sorted readings
  const filteredReadings = useMemo(() => {
    let result = [...readings];

    // Filter by text search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(r => 
        (r.notes && r.notes.toLowerCase().includes(q)) || 
        r.systolic.toString().includes(q) ||
        r.diastolic.toString().includes(q) ||
        r.pulse.toString().includes(q)
      );
    }

    // Filter by date range
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      result = result.filter(r => new Date(r.reading_time) >= start);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      result = result.filter(r => new Date(r.reading_time) <= end);
    }

    // Sorting
    result.sort((a, b) => {
      if (sortField === 'systolic') {
        return sortAsc ? a.systolic - b.systolic : b.systolic - a.systolic;
      } else {
        const timeA = new Date(a.reading_time).getTime();
        const timeB = new Date(b.reading_time).getTime();
        return sortAsc ? timeA - timeB : timeB - timeA;
      }
    });

    return result;
  }, [readings, search, startDate, endDate, sortField, sortAsc]);

  // Paginated readings
  const paginatedReadings = useMemo(() => {
    const startIdx = (page - 1) * pageSize;
    return filteredReadings.slice(startIdx, startIdx + pageSize);
  }, [filteredReadings, page, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filteredReadings.length / pageSize));

  // Handle pagination changes
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  const handleSort = (field: 'time' | 'systolic') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
    setPage(1);
  };

  const handleDeleteClick = (id: string) => {
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await db.deleteBPReading(deleteId);
      onRefresh();
      setDeleteId(null);
    } catch (e) {
      console.error(e);
    } finally {
      setIsDeleting(false);
    }
  };

  const clearFilters = () => {
    setSearch('');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  const getBPStatusText = (sys: number, dia: number) => {
    if (sys < 90 || dia < 60) return 'Low';
    if (sys < 120 && dia < 80) return 'Normal';
    if (sys <= 129 && dia < 80) return 'Elevated';
    if ((sys >= 130 && sys <= 139) || (dia >= 80 && dia <= 89)) return 'Hypertension (Stage 1)';
    return 'Hypertension (Stage 2)';
  };

  const getBPStatusColor = (sys: number, dia: number) => {
    const status = getBPStatusText(sys, dia);
    if (status === 'Low') return 'bg-amber-500/10 text-amber-600 dark:text-amber-400';
    if (status === 'Normal') return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';
    if (status === 'Elevated') return 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400';
    if (status.includes('Stage 1')) return 'bg-orange-500/10 text-orange-600 dark:text-orange-400';
    return 'bg-destructive/10 text-destructive';
  };

  return (
    <Card className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
      <CardHeader className="p-6 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <CardTitle className="text-base font-bold text-primary flex items-center gap-2">
          Blood Pressure History Logs
        </CardTitle>
        <div className="flex flex-wrap gap-2">
          {(search || startDate || endDate) && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs h-9 rounded-xl">
              Clear Filters
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        {/* FILTERING CONTROLS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search notes/value..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-9 rounded-xl"
            />
          </div>

          <div className="flex items-center gap-2 sm:col-span-2">
            <Input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
              className="rounded-xl text-xs h-9"
              placeholder="Start"
            />
            <span className="text-xs text-muted-foreground">to</span>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
              className="rounded-xl text-xs h-9"
              placeholder="End"
            />
          </div>
        </div>

        {/* LOGS TABLE */}
        <div className="rounded-xl border border-border overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>
                  <Button variant="ghost" onClick={() => handleSort('time')} className="flex items-center gap-1 hover:bg-transparent p-0 text-xs font-semibold">
                    Date & Time <ArrowUpDown className="h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" onClick={() => handleSort('systolic')} className="flex items-center gap-1 hover:bg-transparent p-0 text-xs font-semibold">
                    Blood Pressure <ArrowUpDown className="h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead>Pulse</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="max-w-[150px] md:max-w-xs">Notes</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedReadings.length > 0 ? (
                paginatedReadings.map((reading) => {
                  const d = new Date(reading.reading_time);
                  const formattedDate = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
                  const formattedTime = d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

                  return (
                    <TableRow key={reading.id} className="hover:bg-muted/10 transition-colors">
                      <TableCell className="font-medium text-xs">
                        <div>{formattedDate}</div>
                        <div className="text-[10px] text-muted-foreground">{formattedTime}</div>
                      </TableCell>
                      <TableCell className="font-bold text-sm">
                        {reading.systolic}/{reading.diastolic} <span className="text-[10px] font-normal text-muted-foreground">mmHg</span>
                      </TableCell>
                      <TableCell className="text-xs">{reading.pulse} <span className="text-[10px] text-muted-foreground">bpm</span></TableCell>
                      <TableCell>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${getBPStatusColor(reading.systolic, reading.diastolic)}`}>
                          {getBPStatusText(reading.systolic, reading.diastolic)}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground truncate max-w-[150px] md:max-w-xs">
                        {reading.notes || '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1.5">
                          <Button variant="ghost" size="icon" onClick={() => onEdit(reading)} className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground">
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(reading.id)} className="h-7 w-7 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-xs text-muted-foreground font-medium">
                    No matching logs found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* PAGINATION PANEL */}
        <div className="flex items-center justify-between border-t border-border pt-4">
          <div className="text-xs text-muted-foreground font-medium">
            Showing {filteredReadings.length > 0 ? (page - 1) * pageSize + 1 : 0} to {Math.min(page * pageSize, filteredReadings.length)} of {filteredReadings.length} entries
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="icon"
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1}
              className="h-8 w-8 rounded-lg"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs font-semibold px-2">Page {page} of {totalPages}</span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => handlePageChange(page + 1)}
              disabled={page === totalPages}
              className="h-8 w-8 rounded-lg"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* DELETE CONFIRMATION DIALOG */}
        <Dialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
          <DialogContent className="sm:max-w-[400px] rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-destructive">Delete Blood Pressure Log?</DialogTitle>
              <DialogDescription>
                This action is permanent and cannot be undone. This reading will be removed from your health history records.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-2 gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setDeleteId(null)} className="rounded-xl">
                Cancel
              </Button>
              <Button variant="destructive" onClick={confirmDelete} disabled={isDeleting} className="rounded-xl">
                {isDeleting ? 'Deleting...' : 'Delete Log'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
