import { useState } from 'react';
import { DashboardLayout } from '../../components/layouts/DashboardLayout';
import { motion } from 'framer-motion';
import { FileText, Plus, Calendar, CheckCircle2, Clock, AlertTriangle, Search } from 'lucide-react';

// TODO: Replace with real API data when backend supports lease management
interface Lease {
  id: string; tenant: string; hostel: string; room: string;
  startDate: string; endDate: string; monthlyRent: number;
  status: 'active' | 'expiring' | 'expired'; daysRemaining: number;
}

const mockLeases: Lease[] = [
  { id: 'L001', tenant: 'Brian Ochieng', hostel: 'KU Gate Hostel', room: 'Room 12A', startDate: '2024-09-01', endDate: '2025-06-30', monthlyRent: 12000, status: 'active', daysRemaining: 120 },
  { id: 'L002', tenant: 'Faith Wanjiku', hostel: 'Thika Road Apartments', room: 'Room 5B', startDate: '2024-09-01', endDate: '2025-03-30', monthlyRent: 8500, status: 'expiring', daysRemaining: 18 },
  { id: 'L003', tenant: 'Kevin Mutua', hostel: 'KU Gate Hostel', room: 'Room 8C', startDate: '2024-01-01', endDate: '2025-01-31', monthlyRent: 10000, status: 'expired', daysRemaining: 0 },
  { id: 'L004', tenant: 'Mercy Akinyi', hostel: 'Riverside Studios', room: 'Room 3A', startDate: '2024-09-01', endDate: '2025-08-31', monthlyRent: 15000, status: 'active', daysRemaining: 180 },
];

const statusConfig = {
  active: { color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/30', icon: <CheckCircle2 size={14} /> },
  expiring: { color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-100 dark:bg-yellow-900/30', icon: <Clock size={14} /> },
  expired: { color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/30', icon: <AlertTriangle size={14} /> },
};

export function LeaseManagement() {
  const [filter, setFilter] = useState<'all' | 'active' | 'expiring' | 'expired'>('all');
  const [search, setSearch] = useState('');

  const filtered = mockLeases
    .filter(l => filter === 'all' || l.status === filter)
    .filter(l => l.tenant.toLowerCase().includes(search.toLowerCase()) || l.hostel.toLowerCase().includes(search.toLowerCase()));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-heading font-bold text-foreground">Lease Management</h1>
            <p className="text-muted-foreground text-sm mt-1">Track and manage tenant lease agreements</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90">
            <Plus size={18} /> New Lease
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Active', value: mockLeases.filter(l => l.status === 'active').length, color: 'text-green-600 dark:text-green-400' },
            { label: 'Expiring Soon', value: mockLeases.filter(l => l.status === 'expiring').length, color: 'text-yellow-600 dark:text-yellow-400' },
            { label: 'Expired', value: mockLeases.filter(l => l.status === 'expired').length, color: 'text-red-600 dark:text-red-400' },
            { label: 'Total Revenue', value: `KES ${mockLeases.reduce((s, l) => s + l.monthlyRent, 0).toLocaleString()}/mo`, color: 'text-primary' },
          ].map(s => (
            <div key={s.label} className="p-4 rounded-xl bg-card border border-border">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className={`text-xl font-bold mt-1 ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tenants..." className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-card border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <div className="flex gap-1 bg-muted p-1 rounded-xl">
            {(['all', 'active', 'expiring', 'expired'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === f ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-card rounded-2xl shadow-card border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-border bg-secondary/30">
                <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tenant</th>
                <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Property</th>
                <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Duration</th>
                <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Rent</th>
                <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
              </tr></thead>
              <tbody className="divide-y divide-border">
                {filtered.map((lease, i) => {
                  const cfg = statusConfig[lease.status];
                  return (
                    <motion.tr key={lease.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }} className="hover:bg-secondary/50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full gradient-hero flex items-center justify-center text-primary-foreground text-xs font-bold">{lease.tenant.charAt(0)}</div>
                          <span className="text-sm font-medium text-foreground">{lease.tenant}</span>
                        </div>
                      </td>
                      <td className="p-4"><p className="text-sm text-foreground">{lease.hostel}</p><p className="text-xs text-muted-foreground">{lease.room}</p></td>
                      <td className="p-4"><div className="flex items-center gap-1.5 text-sm text-muted-foreground"><Calendar size={13} />{lease.startDate} - {lease.endDate}</div></td>
                      <td className="p-4 text-sm font-semibold text-foreground">KES {lease.monthlyRent.toLocaleString()}/mo</td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.color}`}>
                          {cfg.icon} {lease.status.charAt(0).toUpperCase() + lease.status.slice(1)}
                          {lease.status === 'expiring' && ` (${lease.daysRemaining}d)`}
                        </span>
                      </td>
                      <td className="p-4">
                        {lease.status === 'expiring' && <button className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90">Renew</button>}
                        {lease.status === 'expired' && <button className="px-3 py-1.5 rounded-lg border border-input text-foreground text-xs font-medium hover:bg-secondary">Archive</button>}
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && <div className="py-16 text-center"><FileText size={40} className="text-muted-foreground mx-auto mb-3" /><p className="text-muted-foreground">No leases found</p></div>}
        </div>
      </div>
    </DashboardLayout>
  );
}
