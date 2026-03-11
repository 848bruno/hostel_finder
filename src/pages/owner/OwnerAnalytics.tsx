import { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layouts/DashboardLayout';
import { api } from '../../lib/api';
import { motion } from 'framer-motion';
import { TrendingUp, DollarSign, Building2, Users, BarChart3, BedDouble } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart as RPieChart, Pie } from 'recharts';

interface OwnerStats { totalHostels: number; approvedHostels: number; totalRooms: number; availableRooms: number; }
interface BookingDoc { _id: string; hostel: { _id?: string; name: string } | string; amount: number; payment: { status: string }; status: string; startDate: string; endDate: string; createdAt: string; }

const paymentMethods = [
  { method: 'M-Pesa', value: 68, color: 'hsl(142, 71%, 40%)' },
  { method: 'Bank Transfer', value: 18, color: 'hsl(220, 80%, 50%)' },
  { method: 'Cash', value: 10, color: 'hsl(38, 92%, 50%)' },
  { method: 'Other', value: 4, color: 'hsl(0, 72%, 51%)' },
];

export function OwnerAnalytics() {
  const [analytics, setAnalytics] = useState({ totalRevenue: 0, monthlyRevenue: 0, totalBookings: 0, activeBookings: 0, averageOccupancy: 0, topHostel: { name: 'N/A', bookings: 0 } });
  const [monthlyData, setMonthlyData] = useState<{ month: string; revenue: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadAnalytics(); }, []);

  const loadAnalytics = async () => {
    try {
      const [hostelStats, bookingsRaw] = await Promise.all([
        api.get<OwnerStats>('/owners/stats'),
        api.get<BookingDoc[]>('/bookings/owner'),
      ]);
      const bookings = Array.isArray(bookingsRaw) ? bookingsRaw : [];
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const paidBookings = bookings.filter(b => b.payment?.status === 'paid');
      const totalRevenue = paidBookings.reduce((sum, b) => sum + b.amount, 0);
      const monthlyRevenue = paidBookings.filter(b => new Date(b.createdAt) >= firstDayOfMonth).reduce((sum, b) => sum + b.amount, 0);
      const activeBookings = bookings.filter(b => b.status === 'confirmed' && new Date(b.startDate) <= now && new Date(b.endDate) >= now).length;
      const averageOccupancy = hostelStats.totalRooms > 0 ? ((hostelStats.totalRooms - hostelStats.availableRooms) / hostelStats.totalRooms) * 100 : 0;

      // Monthly revenue data for chart
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const md = months.map(m => ({ month: m, revenue: 0 }));
      paidBookings.forEach(b => { const d = new Date(b.createdAt); if (!isNaN(d.getTime())) md[d.getMonth()].revenue += b.amount; });
      setMonthlyData(md);

      const hostelCounts: Record<string, { name: string; count: number }> = {};
      bookings.forEach(b => { const id = typeof b.hostel === 'string' ? b.hostel : (b.hostel as Record<string, unknown>)?._id as string ?? 'unknown'; const name = typeof b.hostel === 'string' ? id : (b.hostel as Record<string, unknown>)?.name as string; hostelCounts[id] = hostelCounts[id] ?? { name, count: 0 }; hostelCounts[id].count++; });
      const top = Object.values(hostelCounts).sort((a, b) => b.count - a.count)[0] ?? { name: 'N/A', count: 0 };

      setAnalytics({ totalRevenue, monthlyRevenue, totalBookings: bookings.length, activeBookings, averageOccupancy, topHostel: { name: top.name, bookings: top.count } });
    } catch (error) { console.error('Error loading analytics:', error); } finally { setLoading(false); }
  };

  const occupancyRate = analytics.averageOccupancy.toFixed(0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Analytics</h1>
          <p className="text-muted-foreground mt-1">Deep insights across all your properties</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" /></div>
        ) : (
          <>
            {/* Summary Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Total Revenue', value: `KES ${analytics.totalRevenue.toLocaleString()}`, icon: DollarSign, color: 'text-green-600 dark:text-green-400' },
                { label: 'Monthly Revenue', value: `KES ${analytics.monthlyRevenue.toLocaleString()}`, icon: TrendingUp, color: 'text-primary' },
                { label: 'Avg Occupancy', value: `${occupancyRate}%`, icon: BedDouble, color: 'text-yellow-600 dark:text-yellow-400' },
                { label: 'Total Bookings', value: analytics.totalBookings, icon: Users, color: 'text-primary dark:text-blue-400' },
              ].map(s => (
                <motion.div key={s.label} whileHover={{ y: -2 }} className="bg-card rounded-2xl p-5 shadow-card border border-border">
                  <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium mb-2"><s.icon size={14} />{s.label}</div>
                  <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                </motion.div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Revenue Chart */}
              <div className="lg:col-span-2 bg-card rounded-2xl p-6 shadow-card border border-border">
                <h2 className="font-heading font-bold text-lg text-foreground flex items-center gap-2 mb-6"><BarChart3 size={18} className="text-primary" />Revenue Trend</h2>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyData}>
                      <defs><linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(220, 80%, 50%)" stopOpacity={0.2} /><stop offset="95%" stopColor="hsl(220, 80%, 50%)" stopOpacity={0} /></linearGradient></defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} /><YAxis tick={{ fontSize: 12 }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                      <Tooltip contentStyle={{ borderRadius: '12px' }} formatter={(v) => [`KES ${Number(v).toLocaleString()}`, 'Revenue']} />
                      <Area type="monotone" dataKey="revenue" stroke="hsl(220, 80%, 50%)" fill="url(#revGrad)" strokeWidth={2.5} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="bg-card rounded-2xl p-6 shadow-card border border-border">
                <h2 className="font-heading font-bold text-lg text-foreground mb-6">Payment Methods</h2>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <RPieChart><Pie data={paymentMethods} dataKey="value" nameKey="method" cx="50%" cy="50%" outerRadius={75} innerRadius={45} strokeWidth={2}>{paymentMethods.map((e, i) => <Cell key={i} fill={e.color} />)}</Pie><Tooltip formatter={(v) => [`${v}%`, 'Share']} contentStyle={{ borderRadius: '12px' }} /></RPieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2 mt-2">{paymentMethods.map(pm => (
                  <div key={pm.method} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full" style={{ backgroundColor: pm.color }} /><span className="text-muted-foreground">{pm.method}</span></div>
                    <span className="font-semibold text-foreground">{pm.value}%</span>
                  </div>
                ))}</div>
              </div>
            </div>

            {/* Bottom section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-card rounded-2xl p-6 shadow-card border border-border">
                <h2 className="font-heading font-bold text-lg text-foreground mb-4">Top Performing Hostel</h2>
                <div className="bg-gradient-to-br from-primary/10 to-accent/5 p-6 rounded-xl">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl gradient-hero flex items-center justify-center"><Building2 size={28} className="text-primary-foreground" /></div>
                    <div>
                      <h3 className="text-xl font-bold text-foreground">{analytics.topHostel.name}</h3>
                      <p className="text-muted-foreground">{analytics.topHostel.bookings} total bookings</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-card rounded-2xl p-6 shadow-card border border-border">
                <h2 className="font-heading font-bold text-lg text-foreground mb-4">Revenue Breakdown</h2>
                <div className="space-y-4">
                  {[
                    { label: 'Average per booking', value: `KES ${analytics.totalBookings > 0 ? Math.round(analytics.totalRevenue / analytics.totalBookings).toLocaleString() : 0}`, color: 'text-foreground' },
                    { label: 'This month', value: `KES ${analytics.monthlyRevenue.toLocaleString()}`, color: 'text-green-600 dark:text-green-400' },
                    { label: 'All time', value: `KES ${analytics.totalRevenue.toLocaleString()}`, color: 'text-primary' },
                    { label: 'Active tenants', value: analytics.activeBookings.toString(), color: 'text-foreground' },
                  ].map(item => (
                    <div key={item.label} className="flex justify-between items-center py-2.5 border-b border-border last:border-0">
                      <span className="text-sm text-muted-foreground">{item.label}</span>
                      <span className={`text-sm font-bold ${item.color}`}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-primary/5 border border-primary/15 rounded-2xl p-6">
              <h3 className="font-semibold text-foreground mb-3">Performance Insights</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-3 rounded-xl bg-card border border-border">
                  <p className="text-xs text-muted-foreground mb-1">Occupancy Rate</p>
                  <p className="text-lg font-bold text-foreground">{occupancyRate}%</p>
                  <div className="bg-muted rounded-full h-2 mt-2 overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: `${occupancyRate}%` }} className="h-full gradient-hero rounded-full" /></div>
                </div>
                <div className="p-3 rounded-xl bg-card border border-border">
                  <p className="text-xs text-muted-foreground mb-1">Active Tenants</p>
                  <p className="text-lg font-bold text-foreground">{analytics.activeBookings}</p>
                </div>
                <div className="p-3 rounded-xl bg-card border border-border">
                  <p className="text-xs text-muted-foreground mb-1">Total Bookings</p>
                  <p className="text-lg font-bold text-foreground">{analytics.totalBookings}</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
