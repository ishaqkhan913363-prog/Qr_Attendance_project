import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { ScanLine, Camera, CameraOff, CheckCircle, XCircle, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ScanResult {
  success: boolean;
  message: string;
  studentName?: string;
}

interface RecentScan {
  id: string;
  studentName: string;
  studentId: string | null;
  time: string;
  success: boolean;
}

export default function ScanQR() {
  const { user, role, profile } = useAuth();
  const [scanning, setScanning] = useState(false);
  const [lastResult, setLastResult] = useState<ScanResult | null>(null);
  const [recentScans, setRecentScans] = useState<RecentScan[]>([]);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const processingRef = useRef(false);

  const markAttendance = async (qrToken: string) => {
    if (processingRef.current) return;
    processingRef.current = true;

    try {
      // Find student by qr_token
      const { data: studentProfile, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, student_id')
        .eq('qr_token', qrToken)
        .single();

      if (profileError || !studentProfile) {
        const result = { success: false, message: 'Invalid QR code - student not found' };
        setLastResult(result);
        toast.error(result.message);
        return;
      }

      // For students, only allow marking their own attendance
      if (role === 'student' && studentProfile.id !== profile?.id) {
        const result = { success: false, message: 'You can only mark your own attendance' };
        setLastResult(result);
        toast.error(result.message);
        return;
      }

      // Try to insert attendance (unique constraint prevents duplicates)
      const { error } = await supabase.from('attendance').insert({
        student_id: studentProfile.id,
        marked_by: user?.id,
        status: 'present',
      });

      if (error) {
        if (error.code === '23505') {
          const result = { success: false, message: `${studentProfile.full_name} already marked today`, studentName: studentProfile.full_name };
          setLastResult(result);
          toast.warning(result.message);
          addRecentScan(studentProfile.full_name, studentProfile.student_id, false);
        } else {
          const result = { success: false, message: 'Failed to mark attendance' };
          setLastResult(result);
          toast.error(result.message);
        }
        return;
      }

      const result = { success: true, message: `Attendance marked for ${studentProfile.full_name}`, studentName: studentProfile.full_name };
      setLastResult(result);
      toast.success(result.message);
      addRecentScan(studentProfile.full_name, studentProfile.student_id, true);
    } finally {
      // Debounce - prevent re-scanning for 2 seconds
      setTimeout(() => { processingRef.current = false; }, 2000);
    }
  };

  const addRecentScan = (name: string, studentId: string | null, success: boolean) => {
    setRecentScans((prev) => [
      { id: crypto.randomUUID(), studentName: name, studentId, time: new Date().toLocaleTimeString(), success },
      ...prev.slice(0, 9),
    ]);
  };

  const startScanning = async () => {
    try {
      const scanner = new Html5Qrcode('qr-reader');
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (text) => {
          markAttendance(text);
        },
        () => {}
      );
      setScanning(true);
    } catch (err) {
      toast.error('Could not access camera. Please grant permission.');
    }
  };

  const stopScanning = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (error) {
        console.error('Failed to stop QR scanner', error);
      }
      scannerRef.current = null;
    }
    setScanning(false);
  };

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        try {
          scannerRef.current.stop();
        } catch (error) {
          console.error('Failed to stop QR scanner on cleanup', error);
        }
      }
    };
  }, []);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Scan QR Code</h1>
      <p className="text-muted-foreground">
        {role === 'admin'
          ? 'Scan student QR codes to mark their attendance'
          : 'Scan your QR code to mark your attendance'}
      </p>

      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ScanLine className="w-5 h-5 text-primary" />
            QR Scanner
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            id="qr-reader"
            className="w-full rounded-xl overflow-hidden bg-muted"
            style={{ minHeight: scanning ? 300 : 0 }}
          />
          
          <Button
            onClick={scanning ? stopScanning : startScanning}
            className={scanning ? 'w-full bg-destructive text-destructive-foreground hover:bg-destructive/90' : 'w-full gradient-primary text-primary-foreground'}
          >
            {scanning ? (
              <><CameraOff className="w-4 h-4 mr-2" /> Stop Scanner</>
            ) : (
              <><Camera className="w-4 h-4 mr-2" /> Start Scanner</>
            )}
          </Button>
        </CardContent>
      </Card>

      <AnimatePresence>
        {lastResult && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <Card className={`glass border-2 ${lastResult.success ? 'border-primary' : 'border-destructive'}`}>
              <CardContent className="flex items-center gap-4 py-6">
                {lastResult.success ? (
                  <CheckCircle className="w-10 h-10 text-primary flex-shrink-0" />
                ) : (
                  <XCircle className="w-10 h-10 text-destructive flex-shrink-0" />
                )}
                <div>
                  <p className="font-semibold text-foreground">{lastResult.success ? 'Success!' : 'Error'}</p>
                  <p className="text-muted-foreground text-sm">{lastResult.message}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recent scans history */}
      {recentScans.length > 0 && (
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="w-5 h-5 text-muted-foreground" />
              Recent Scans
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentScans.map((scan) => (
                  <TableRow key={scan.id}>
                    <TableCell className="font-medium">{scan.studentName}</TableCell>
                    <TableCell className="font-mono text-sm">{scan.studentId || '-'}</TableCell>
                    <TableCell className="font-mono text-sm">{scan.time}</TableCell>
                    <TableCell>
                      {scan.success ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-accent text-accent-foreground">
                          <CheckCircle className="w-3 h-3" /> Marked
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-destructive/10 text-destructive">
                          <XCircle className="w-3 h-3" /> Duplicate
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
