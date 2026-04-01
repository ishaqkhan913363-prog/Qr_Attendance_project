import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { ClipboardList, Download, Search } from 'lucide-react';

interface AttendanceRow {
  id: string;
  date: string;
  time: string;
  status: string;
  profiles: {
    full_name: string;
    student_id: string | null;
    course: string | null;
  };
}

export default function AttendanceRecords() {
  const [records, setRecords] = useState<AttendanceRow[]>([]);
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);
  const [searchFilter, setSearchFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('attendance')
      .select('id, date, time, status, profiles(full_name, student_id, course)')
      .order('date', { ascending: false })
      .order('time', { ascending: false });

    if (dateFilter) {
      query = query.eq('date', dateFilter);
    }

    const { data, error } = await query;
    if (error) {
      toast.error('Failed to fetch records');
    } else {
      setRecords((data as unknown as AttendanceRow[]) || []);
    }
    setLoading(false);
  }, [dateFilter]);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  const filtered = records.filter(
    (r) =>
      r.profiles?.full_name?.toLowerCase().includes(searchFilter.toLowerCase()) ||
      r.profiles?.student_id?.toLowerCase().includes(searchFilter.toLowerCase()) ||
      r.profiles?.course?.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const exportCSV = () => {
    const headers = 'Name,Student ID,Course,Date,Time,Status\n';
    const rows = filtered
      .map((r) =>
        `"${r.profiles?.full_name}","${r.profiles?.student_id || ''}","${r.profiles?.course || ''}","${r.date}","${r.time}","${r.status}"`
      )
      .join('\n');
    
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_${dateFilter || 'all'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exported!');
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-6">Attendance Records</h1>

      <Card className="glass">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-primary" />
            Records ({filtered.length})
          </CardTitle>
          <div className="flex items-center gap-3 flex-wrap">
            <Input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-40"
            />
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="pl-10 w-48"
              />
            </div>
            <Button variant="outline" onClick={exportCSV} disabled={filtered.length === 0}>
              <Download className="w-4 h-4 mr-2" /> Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground text-center py-8">Loading...</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Student ID</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.profiles?.full_name}</TableCell>
                      <TableCell className="font-mono text-sm">{r.profiles?.student_id || '-'}</TableCell>
                      <TableCell>{r.profiles?.course || '-'}</TableCell>
                      <TableCell>{new Date(r.date).toLocaleDateString()}</TableCell>
                      <TableCell className="font-mono">{r.time}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-accent text-accent-foreground capitalize">
                          {r.status}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No records found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
