import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, ClipboardList, UserCheck, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ students: 0, todayAttendance: 0, totalRecords: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      const today = new Date().toISOString().split('T')[0];
      
      const [studentsRes, todayRes, totalRes] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact' }).eq('role', 'student'),
        supabase.from('attendance').select('id', { count: 'exact' }).eq('date', today),
        supabase.from('attendance').select('id', { count: 'exact' }),
      ]);
      
      setStats({
        students: studentsRes.count || 0,
        todayAttendance: todayRes.count || 0,
        totalRecords: totalRes.count || 0,
      });
    };
    fetchStats();
  }, []);

  const cards = [
    { title: 'Total Students', value: stats.students, icon: Users, color: 'text-primary' },
    { title: "Today's Attendance", value: stats.todayAttendance, icon: UserCheck, color: 'text-accent-foreground' },
    { title: 'Total Records', value: stats.totalRecords, icon: ClipboardList, color: 'text-muted-foreground' },
    { title: 'Attendance Rate', value: stats.students > 0 ? `${Math.round((stats.todayAttendance / stats.students) * 100)}%` : '0%', icon: TrendingUp, color: 'text-primary' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-6">Admin Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, i) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="glass hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
                <card.icon className={`w-5 h-5 ${card.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{card.value}</div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
