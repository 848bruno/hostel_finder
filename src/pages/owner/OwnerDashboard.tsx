import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DashboardLayout, useDashboardRefreshVersion } from '../../components/layouts/DashboardLayout';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../lib/api';
import {
  Building2, Users, DollarSign, TrendingUp, AlertCircle, PlusCircle,
  ArrowUpRight, Calendar, CheckCircle2, Clock, Megaphone, XCircle
} from 'lucide-react';

interface OwnerStats {
  totalHostels: number;
  approvedHostels: number;
  pendingHostels: number;
  totalRooms: number;
  availableRooms: number;
}

interface BookingRecord {
  _id: string;
  amount: number;
  status: string;
  startDate: string;
  endDate: string;
  student?: { username?: string; email?: string };
  hostel?: { name?: string };
  room?: { name?: string };
  createdAt?: string;
}

interface AnnouncementItem {
  _id: string;
  title: string;
  message: string;
  audience: 'all' | 'students' | 'owners';
  publishedAt?: string;
  createdAt: string;
}

const revenueData = [
  { month: 'Jan', revenue: 0 },
  { month: 'Feb', revenue: 0 },
  { month: 'Mar', revenue: 0 },
  { month: 'Apr', revenue: 0 },
  { month: 'May', revenue: 0 },
  { month: 'Jun', revenue: 0 },
];

const statusConfig: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  confirmed: { icon: CheckCircle2, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/30' },
  pending: { icon: Clock, color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-100 dark:bg-yellow-900/30' },
  pending_payment: { icon: Clock, color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-100 dark:bg-yellow-900/30' },
  completed: { icon: CheckCircle2, color: 'text-primary dark:text-blue-400', bg: 'bg-primary/20 dark:bg-blue-900/30' },
  cancelled: { icon: XCircle, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/30' },
};

function StatCard({
  title, value, icon: Icon, trend, variant = 'default',
}: {
  title: string;
  value: string | number;
  icon: typeof Building2;
  trend?: string;
  variant?: 'default' | 'primary' | 'accent' | 'warning';
}) {
  const variantStyles = {
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
    <motion.div
      whileHover={{ y: -2 }}
      className={`rounded-2xl p-6 transition-shadow hover:shadow-card-hover ${variantStyles[variant]}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className={`text-sm font-medium ${variant === 'default' ? 'text-muted-foreground' : 'opacity-80'}`}>{title}</p>
          <p className="mt-2 font-heading text-3xl font-bold">{value}</p>
          {trend && (
            <p className={`mt-2 text-xs font-medium ${variant === 'default' ? 'text-green-600 dark:text-green-400' : 'opacity-80'}`}>{trend}</p>
          )}
        </div>
        <div className={`rounded-xl p-3 ${iconStyles[variant]}`}>
          <Icon size={22} />
        </div>
      </div>
    </motion.div>
  );
}

export function OwnerDashboard() {
  const refreshVersion = useDashboardRefreshVersion();
  const { profile } = useAuth();
  const [stats, setStats] = useState<OwnerStats>({
    totalHostels: 0, approvedHostels: 0, pendingHostels: 0, totalRooms: 0, availableRooms: 0,
  });
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadDashboardData(); }, [refreshVersion]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [hostelStats, bookingsData, announcementsData] = await Promise.all([
        api.get<OwnerStats>('/owners/stats'),
        api.get<{ bookings: BookingRecord[] } | BookingRecord[]>('/bookings/owner'),
        api.get<{ announcements: AnnouncementItem[] }>('/owners/announcements'),
      ]);

      const bookingList = Array.isArray(bookingsData) ? bookingsData : (bookingsData.bookings ?? []);
      setStats(hostelStats);
      setBookings(bookingList);
      setAnnouncements(announcementsData.announcements ?? []);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalBookings = bookings.length;
  const confirmedBookings = useMemo(
    () => bookings.filter((booking) => booking.status === 'confirmed' || booking.status === 'completed'),
    [bookings]
  );
  const totalRevenue = useMemo(
    () => confirmedBookings.reduce((sum, booking) => sum + Number(booking.amount || 0), 0),
    [confirmedBookings]
  );
  const occupancyRate = stats.totalRooms > 0
    ? Math.round(((stats.totalRooms - stats.availableRooms) / stats.totalRooms) * 100)
    : 0;

  // Build revenue chart from bookings
  const chartData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const data = months.map(m => ({ month: m, revenue: 0 }));
    bookings.forEach((b) => {
      if (b.status === 'confirmed' || b.status === 'completed') {
        const d = new Date(b.startDate || b.createdAt || '');
        if (!isNaN(d.getTime())) {
          data[d.getMonth()].revenue += Number(b.amount || 0);
        }
      }
    });
    return data.filter(d => d.revenue > 0).length > 0 ? data : revenueData;
  }, [bookings]);

  return (
    <DashboardLayout>
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">
            Welcome back, {profile?.username?.split(' ')[0] ?? 'Owner'}!
          </h1>
          <p className="text-muted-foreground mt-1">Here's what's happening with your properties today</p>
        </div>
        <Link
          to="/owner/hostels/new"
          className="inline-flex items-center gap-2 px-5 py-3 gradient-hero text-primary-foreground rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity shadow-hero"
        >
          <PlusCircle size={18} /> Add Hostel
        </Link>
      </div>

      {/* Verification alert */}
      {stats.pendingHostels > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-warning/10 border border-warning/30 rounded-2xl p-5 mb-8 flex items-start gap-3"
        >
          <AlertCircle size={20} className="text-warning mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="font-medium text-foreground">Pending Approval</p>
            <p className="text-sm text-muted-foreground mt-1">
              {stats.pendingHostels} hostel{stats.pendingHostels !== 1 ? 's' : ''} awaiting admin approval.
            </p>
          </div>
          <Link
            to="/owner/verification"
            className="shrink-0 px-4 py-2 rounded-xl bg-warning text-warning-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            View Status
          </Link>
        </motion.div>
      )}

      {announcements.length > 0 && (
        <div className="mb-8 rounded-2xl border border-border bg-card shadow-card">
          <div className="flex items-center gap-3 border-b border-border p-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Megaphone size={18} />
            </div>
            <div>
              <h2 className="font-heading text-lg font-bold text-foreground">Announcements</h2>
              <p className="text-xs text-muted-foreground">Published updates relevant to owners</p>
            </div>
          </div>
          <div className="divide-y divide-border">
            {announcements.slice(0, 3).map((announcement) => (
              <div key={announcement._id} className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-foreground">{announcement.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{announcement.message}</p>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {new Date(announcement.publishedAt || announcement.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Total Hostels" value={stats.totalHostels} icon={Building2} variant="primary" />
        <StatCard title="Active Bookings" value={confirmedBookings.filter(b => b.status === 'confirmed').length} icon={Users} />
        <StatCard title="Total Revenue" value={`KES ${totalRevenue.toLocaleString()}`} icon={DollarSign} variant="accent" />
        <StatCard title="Occupancy Rate" value={`${occupancyRate}%`} icon={TrendingUp} trend={occupancyRate > 0 ? `${stats.totalRooms - stats.availableRooms}/${stats.totalRooms} rooms` : undefined} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-card rounded-2xl p-6 shadow-card border border-border">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-heading font-bold text-lg text-foreground">Revenue Overview</h2>
              <p className="text-sm text-muted-foreground">Monthly revenue breakdown</p>
            </div>
            {totalRevenue > 0 && (
              <div className="flex items-center gap-1.5 text-sm font-semibold text-green-600 dark:text-green-400">
                <ArrowUpRight size={16} /> KES {totalRevenue.toLocaleString()}
              </div>
            )}
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(220, 80%, 50%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(220, 80%, 50%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" className="text-muted-foreground" tick={{ fontSize: 12 }} />
                <YAxis className="text-muted-foreground" tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: '1px solid hsl(214, 20%, 90%)', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                  formatter={
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (value: any) => [`KES ${Number(value).toLocaleString()}`, 'Revenue']
                  }
                />
                <Area type="monotone" dataKey="revenue" stroke="hsl(220, 80%, 50%)" fill="url(#revenueGradient)" strokeWidth={2.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-card rounded-2xl p-6 shadow-card border border-border">
          <h2 className="font-heading font-bold text-lg text-foreground mb-4">Quick Actions</h2>
          <div className="space-y-3">
            {[
              { label: 'Add New Hostel', path: '/owner/hostels/new', icon: PlusCircle, color: 'bg-primary/10 text-primary' },
              { label: 'View Tenants', path: '/owner/tenants', icon: Users, color: 'bg-accent/10 text-accent' },
              { label: 'Analytics', path: '/owner/analytics', icon: TrendingUp, color: 'bg-warning/10 text-warning' },
              { label: 'Manage Hostels', path: '/owner/hostels', icon: Building2, color: 'bg-secondary text-foreground' },
            ].map((action) => (
              <Link
                key={action.path}
                to={action.path}
                className="flex items-center gap-3 p-3.5 rounded-xl hover:bg-secondary transition-colors group"
              >
                <div className={`w-10 h-10 rounded-xl ${action.color} flex items-center justify-center`}>
                  <action.icon size={18} />
                </div>
                <span className="text-sm font-medium text-foreground flex-1">{action.label}</span>
                <ArrowUpRight size={16} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            ))}
          </div>

          {/* Room Overview */}
          <div className="mt-6 pt-5 border-t border-border">
            <h3 className="text-sm font-semibold text-foreground mb-3">Room Overview</h3>
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-muted-foreground">Occupied</span>
              <span className="font-bold text-foreground">{stats.totalRooms - stats.availableRooms} / {stats.totalRooms}</span>
            </div>
            <div className="bg-muted rounded-full h-3 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${occupancyRate}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="h-full gradient-hero rounded-full"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Bookings Table */}
      <div className="bg-card rounded-2xl shadow-card border border-border">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <h2 className="font-heading font-bold text-lg text-foreground">Recent Bookings</h2>
          <span className="text-sm text-muted-foreground">{totalBookings} total</span>
        </div>
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Loading bookings...</div>
        ) : bookings.length === 0 ? (
          <div className="p-8 text-center">
            <Building2 size={44} className="mx-auto mb-4 text-muted-foreground" />
            <p className="text-foreground">No bookings yet</p>
            <p className="text-sm text-muted-foreground mt-1">Bookings will appear here once students book your hostels</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Student</th>
                  <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Property</th>
                  <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Dates</th>
                  <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Amount</th>
                  <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {bookings.slice(0, 10).map((booking) => {
                  const config = statusConfig[booking.status] || statusConfig.pending;
                  const StatusIcon = config.icon;
                  return (
                    <tr key={booking._id} className="hover:bg-secondary/50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full gradient-hero flex items-center justify-center text-primary-foreground text-xs font-bold">
                            {booking.student?.username?.charAt(0) || '?'}
                          </div>
                          <span className="text-sm font-medium text-foreground">{booking.student?.username || 'Student'}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="text-sm font-medium text-foreground">{booking.hostel?.name || 'Hostel'}</p>
                        {booking.room?.name && <p className="text-xs text-muted-foreground">{booking.room.name}</p>}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Calendar size={13} />
                          <span>{new Date(booking.startDate).toLocaleDateString()}</span>
                        </div>
                      </td>
                      <td className="p-4 text-sm font-semibold text-foreground">KES {Number(booking.amount).toLocaleString()}</td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.color}`}>
                          <StatusIcon size={12} />
                          {booking.status === 'pending_payment' ? 'Pending Payment' : booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
