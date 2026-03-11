import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '../../components/layouts/DashboardLayout';
import { api } from '../../lib/api';
import { motion } from 'framer-motion';
import { Users, Building2, TrendingUp, AlertCircle, ShieldCheck, BarChart3, ArrowUpRight, Activity } from 'lucide-react';

interface AdminStats {
  totalStudents: number; totalOwners: number; approvedOwners: number;
  pendingOwners: number; totalHostels: number; approvedHostels: number; pendingHostels: number;
}

function StatCard({ title, value, subtext, icon: Icon, variant = 'default' }: {
  title: string; value: string | number; subtext?: string;
  icon: typeof Users; variant?: 'default' | 'primary' | 'accent' | 'warning';
}) {
  const styles = {
    default: 'bg-card shadow-card border border-border',
    primary: 'gradient-hero text-primary-foreground',
    accent: 'gradient-accent text-accent-foreground',
    warning: 'gradient-warm text-warning-foreground',
  };
  const iconStyles = {
    default: 'bg-primary/10 text-primary',
    primary: 'bg-primary-foreground/20 text-primary-foreground',
    accent: 'bg-accent-foreground/20 text-accent-foreground',
    warning: 'bg-warning-foreground/20 text-warning-foreground',
  };
  return (
    <motion.div whileHover={{ y: -2 }} className={`rounded-2xl p-6 transition-shadow hover:shadow-card-hover ${styles[variant]}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className={`text-sm font-medium ${variant === 'default' ? 'text-muted-foreground' : 'opacity-80'}`}>{title}</p>
          <p className="mt-2 font-heading text-3xl font-bold">{value}</p>
          {subtext && <p className={`mt-1 text-xs font-medium ${variant === 'default' ? 'text-muted-foreground' : 'opacity-70'}`}>{subtext}</p>}
        </div>
        <div className={`rounded-xl p-3 ${iconStyles[variant]}`}><Icon size={22} /></div>
      </div>
    </motion.div>
  );
}

export function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats>({ totalStudents: 0, totalOwners: 0, approvedOwners: 0, pendingOwners: 0, totalHostels: 0, approvedHostels: 0, pendingHostels: 0 });

  useEffect(() => { loadDashboardData(); }, []);

  const loadDashboardData = async () => {
    try { const data = await api.get<AdminStats>('/admin/stats'); setStats(data); } catch (error) { console.error('Error loading dashboard:', error); }
  };

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold text-foreground">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">System overview and management</p>
      </div>

      {stats.pendingOwners > 0 && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
          <Link to="/admin/verifications" className="block bg-warning/10 border border-warning/30 rounded-2xl p-5 mb-8 flex items-start gap-3 hover:bg-warning/15 transition-colors">
            <AlertCircle size={20} className="text-warning mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="font-medium text-foreground">Pending Owner Approvals</p>
              <p className="text-sm text-muted-foreground mt-1">{stats.pendingOwners} owner{stats.pendingOwners !== 1 ? 's' : ''} waiting for approval</p>
            </div>
            <span className="px-4 py-2 bg-warning text-warning-foreground rounded-xl text-sm font-semibold shrink-0">Review Now</span>
          </Link>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Total Students" value={stats.totalStudents} icon={Users} variant="primary" />
        <StatCard title="Total Owners" value={stats.totalOwners} subtext={`${stats.approvedOwners} approved`} icon={Users} />
        <StatCard title="Total Hostels" value={stats.totalHostels} subtext={`${stats.approvedHostels} approved`} icon={Building2} variant="accent" />
        <StatCard title="Pending Hostels" value={stats.pendingHostels} icon={TrendingUp} variant="warning" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-2xl shadow-card border border-border p-6">
          <h2 className="font-heading font-bold text-lg text-foreground mb-4">Quick Actions</h2>
          <div className="space-y-3">
            {[
              { label: 'Verify Owners', desc: 'Review pending owner approvals', path: '/admin/verifications', icon: ShieldCheck, badge: stats.pendingOwners, color: 'bg-primary/10 text-primary' },
              { label: 'Manage Users', desc: 'View and manage all platform users', path: '/admin/users', icon: Users, color: 'bg-accent/10 text-accent' },
              { label: 'All Hostels', desc: 'Oversee all hostel listings', path: '/admin/hostels', icon: Building2, color: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' },
              { label: 'Analytics', desc: 'View platform analytics', path: '/admin/analytics', icon: BarChart3, color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400' },
            ].map(action => (
              <Link key={action.path} to={action.path} className="flex items-center gap-3 p-3.5 rounded-xl hover:bg-secondary transition-colors group">
                <div className={`w-10 h-10 rounded-xl ${action.color} flex items-center justify-center`}><action.icon size={18} /></div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-foreground">{action.label}</h3>
                  <p className="text-xs text-muted-foreground">{action.desc}</p>
                </div>
                {action.badge ? <span className="px-3 py-1 bg-warning/10 text-warning rounded-full text-xs font-semibold">{action.badge}</span> : null}
                <ArrowUpRight size={16} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            ))}
          </div>
        </div>

        <div className="bg-card rounded-2xl shadow-card border border-border p-6">
          <h2 className="font-heading font-bold text-lg text-foreground mb-4 flex items-center gap-2"><Activity size={18} className="text-primary" />System Health</h2>
          <div className="space-y-3">
            {[
              { label: 'Database Status', value: 'Healthy', bg: 'bg-green-100 dark:bg-green-900/30', color: 'text-green-700 dark:text-green-400' },
              { label: 'API Response', value: '< 100ms', bg: 'bg-green-100 dark:bg-green-900/30', color: 'text-green-700 dark:text-green-400' },
              { label: 'Total Students', value: stats.totalStudents.toString(), bg: 'bg-primary/10 dark:bg-blue-900/20', color: 'text-primary/90 dark:text-blue-300' },
              { label: 'Total Owners', value: `${stats.totalOwners} (${stats.pendingOwners} pending)`, bg: 'bg-yellow-50 dark:bg-yellow-900/20', color: 'text-yellow-700 dark:text-yellow-300' },
              { label: 'Hostels Listed', value: `${stats.totalHostels} (${stats.pendingHostels} pending)`, bg: 'bg-purple-50 dark:bg-purple-900/20', color: 'text-purple-700 dark:text-purple-300' },
            ].map(item => (
              <div key={item.label} className={`flex items-center justify-between p-3.5 ${item.bg} rounded-xl`}>
                <span className={`text-sm font-medium ${item.color}`}>{item.label}</span>
                <span className={`text-sm font-bold ${item.color}`}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
