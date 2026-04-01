import { useAuth } from '@/contexts/AuthContext';
import AdminDashboard from './AdminDashboard';
import StudentDashboard from './StudentDashboard';

export default function Index() {
  const { role } = useAuth();
  
  if (role === 'admin') return <AdminDashboard />;
  return <StudentDashboard />;
}
