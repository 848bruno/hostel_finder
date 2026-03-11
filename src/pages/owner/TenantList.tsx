import { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layouts/DashboardLayout';
import { api } from '../../lib/api';
import { motion } from 'framer-motion';
import { Users, Calendar, Building2, Search, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';

interface BookingDoc {
  _id: string;
  hostel: { name: string };
  student: { username: string; email: string };
  room?: { name?: string };
  roomsBooked: number;
  startDate: string;
  endDate: string;
  amount: number;
  status: string;
  createdAt: string;
}

const statusConfig: Record<string, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  confirmed: { icon: CheckCircle2, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/30', label: 'Active' },
  pending: { icon: Clock, color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-100 dark:bg-yellow-900/30', label: 'Pending' },
  pending_payment: { icon: Clock, color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-100 dark:bg-yellow-900/30', label: 'Pending Payment' },
  completed: { icon: CheckCircle2, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/30', label: 'Completed' },
  cancelled: { icon: AlertTriangle, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/30', label: 'Cancelled' },
};

export function TenantList() {
  const [bookings, setBookings] = useState<BookingDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'current' | 'past'>('all');
  const [search, setSearch] = useState('');

  useEffect(() => { loadTenants(); }, []);

  const loadTenants = async () => {
    try {
      const data = await api.get<BookingDoc[]>('/bookings/owner');
      setBookings(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading tenants:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredBookings = (() => {
    const now = new Date();
    let list = bookings;
    switch (filter) {
      case 'current':
        list = bookings.filter(b => new Date(b.startDate) <= now && new Date(b.endDate) >= now && b.status === 'confirmed');
        break;
      case 'past':
        list = bookings.filter(b => new Date(b.endDate) < now || b.status === 'cancelled');
        break;
    }
    if (search) {
      list = list.filter(b =>
        b.student?.username?.toLowerCase().includes(search.toLowerCase()) ||
        b.student?.email?.toLowerCase().includes(search.toLowerCase()) ||
        b.hostel?.name?.toLowerCase().includes(search.toLowerCase())
      );
    }
    return list;
  })();

  const activeCount = bookings.filter(b => b.status === 'confirmed').length;
  const pendingCount = bookings.filter(b => b.status === 'pending' || b.status === 'pending_payment').length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground">Tenants & Bookings</h1>
            <p className="text-muted-foreground mt-1">{bookings.length} bookings across your properties</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 font-semibold text-sm">
              <CheckCircle2 size={14} /> {activeCount} Active
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 font-semibold text-sm">
              <Clock size={14} /> {pendingCount} Pending
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-card rounded-2xl p-4 shadow-card border border-border flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or email..."
              className="w-full py-2.5 pl-10 pr-4 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm" />
          </div>
          <div className="flex gap-1 bg-muted p-1 rounded-xl">
            {(['all', 'current', 'past'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${filter === f ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="text-center py-16 bg-card rounded-2xl border border-border">
            <Users size={44} className="mx-auto mb-4 text-muted-foreground" />
            <p className="text-foreground font-medium">No tenants found</p>
            <p className="text-sm text-muted-foreground mt-1">Try adjusting your search or filter</p>
          </div>
        ) : (
          <div className="bg-card rounded-2xl shadow-card border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-secondary/30">
                    <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tenant</th>
                    <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Property</th>
                    <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Duration</th>
                    <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Amount</th>
                    <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredBookings.map((booking, i) => {
                    const config = statusConfig[booking.status] || statusConfig.pending;
                    const StatusIcon = config.icon;
                    return (
                      <motion.tr key={booking._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }} className="hover:bg-secondary/50 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full gradient-hero flex items-center justify-center text-primary-foreground text-sm font-bold shrink-0">
                              {booking.student?.username?.charAt(0) || '?'}
                            </div>
                            <div>
                              <span className="font-medium text-foreground text-sm">{booking.student?.username || 'Student'}</span>
                              <p className="text-xs text-muted-foreground">{booking.student?.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <Building2 size={14} className="text-muted-foreground" />
                            <span className="text-sm text-foreground">{booking.hostel?.name || 'Hostel'}</span>
                          </div>
                          {booking.room?.name && <p className="text-xs text-muted-foreground mt-0.5">{booking.room.name}</p>}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Calendar size={13} />
                            <div>
                              <div>{new Date(booking.startDate).toLocaleDateString()}</div>
                              <div className="text-xs">to {new Date(booking.endDate).toLocaleDateString()}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="font-semibold text-foreground text-sm">KES {booking.amount?.toLocaleString()}</span>
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.color}`}>
                            <StatusIcon size={12} /> {config.label}
                          </span>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
