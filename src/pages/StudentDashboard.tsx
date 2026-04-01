import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarDays, CheckCircle, QrCode } from 'lucide-react';
import { motion } from 'framer-motion';
import QRCodeCanvas from 'react-qrcode-logo';

export default function StudentDashboard() {
  const { profile } = useAuth();
  const [attendanceCount, setAttendanceCount] = useState(0);
  const [lastAttendance, setLastAttendance] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;
    const fetch = async () => {
      const { count } = await supabase
        .from('attendance')
        .select('id', { count: 'exact' })
        .eq('student_id', profile.id);
      setAttendanceCount(count || 0);

      const { data } = await supabase
        .from('attendance')
        .select('date')
        .eq('student_id', profile.id)
        .order('date', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data) setLastAttendance(data.date);
    };
    fetch();
  }, [profile]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-2">
        Welcome, {profile?.full_name}! 👋
      </h1>
      <p className="text-muted-foreground mb-6">Here's your attendance overview</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="glass">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Present</CardTitle>
              <CheckCircle className="w-5 h-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{attendanceCount}</div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="glass">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Last Attendance</CardTitle>
              <CalendarDays className="w-5 h-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-semibold text-foreground">
                {lastAttendance ? new Date(lastAttendance).toLocaleDateString() : 'No records'}
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="glass">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Student ID</CardTitle>
              <QrCode className="w-5 h-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-semibold text-foreground">{profile?.student_id || 'N/A'}</div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {profile?.qr_token && (
        <Card className="glass max-w-sm">
          <CardHeader>
            <CardTitle className="text-lg">Your QR Code</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <QRCodeCanvas value={profile.qr_token} size={180} bgColor="white" fgColor="#0d9488" />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
