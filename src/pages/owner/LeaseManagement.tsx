import { useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '../../components/layouts/DashboardLayout';
import { ApiError, api } from '../../lib/api';
import { AlertTriangle, Calendar, CheckCircle2, Clock, FileText, Plus, Search } from 'lucide-react';

type LeaseStatus = 'active' | 'expiring' | 'expired' | 'archived';

interface HostelOption {
  _id: string;
  name: string;
}

interface Lease {
  _id: string;
  tenantName: string;
  tenantEmail?: string;
  roomLabel?: string;
  startDate: string;
  endDate: string;
  monthlyRent: number;
  status: LeaseStatus;
  daysRemaining: number;
  hostel?: { _id: string; name: string };
}

interface LeaseResponse {
  leases: Lease[];
  stats: {
    active: number;
    expiring: number;
    expired: number;
    monthlyRevenue: number;
  };
}

const statusConfig: Record<LeaseStatus, { color: string; bg: string; icon: React.ReactNode }> = {
  active: { color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/30', icon: <CheckCircle2 size={14} /> },
  expiring: { color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-100 dark:bg-yellow-900/30', icon: <Clock size={14} /> },
  expired: { color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/30', icon: <AlertTriangle size={14} /> },
  archived: { color: 'text-muted-foreground', bg: 'bg-muted', icon: <FileText size={14} /> },
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString();
}

export function LeaseManagement() {
  const [leases, setLeases] = useState<Lease[]>([]);
  const [hostels, setHostels] = useState<HostelOption[]>([]);
  const [stats, setStats] = useState<LeaseResponse['stats']>({ active: 0, expiring: 0, expired: 0, monthlyRevenue: 0 });
  const [filter, setFilter] = useState<'all' | LeaseStatus>('all');
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    hostelId: '',
    tenantName: '',
    tenantEmail: '',
    roomLabel: '',
    startDate: '',
    endDate: '',
    monthlyRent: '',
  });

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [leaseData, hostelData] = await Promise.all([
        api.get<LeaseResponse>('/owners/leases'),
        api.get<{ hostels: HostelOption[] }>('/owners/hostels'),
      ]);
      setLeases(leaseData.leases);
      setStats(leaseData.stats);
      setHostels(hostelData.hostels || []);
      setForm((current) => ({ ...current, hostelId: current.hostelId || hostelData.hostels?.[0]?._id || '' }));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load leases.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filtered = useMemo(() => leases
    .filter((lease) => filter === 'all' || lease.status === filter)
    .filter((lease) => {
      if (!search) return true;
      const target = `${lease.tenantName} ${lease.hostel?.name || ''} ${lease.roomLabel || ''}`.toLowerCase();
      return target.includes(search.toLowerCase());
    }), [filter, leases, search]);

  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.post('/owners/leases', {
        ...form,
        monthlyRent: Number(form.monthlyRent),
      });
      setShowForm(false);
      setForm({
        hostelId: hostels[0]?._id || '',
        tenantName: '',
        tenantEmail: '',
        roomLabel: '',
        startDate: '',
        endDate: '',
        monthlyRent: '',
      });
      await loadData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create lease.');
    } finally {
      setSaving(false);
    }
  };

  const handleRenew = async (lease: Lease) => {
    const nextEndDate = window.prompt('Enter new end date (YYYY-MM-DD):', lease.endDate.slice(0, 10));
    if (!nextEndDate) return;
    try {
      await api.put(`/owners/leases/${lease._id}`, { endDate: nextEndDate });
      await loadData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to renew lease.');
    }
  };

  const handleArchive = async (lease: Lease) => {
    try {
      await api.put(`/owners/leases/${lease._id}`, { action: 'archive' });
      await loadData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to archive lease.');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-heading font-bold text-foreground">Lease Management</h1>
            <p className="mt-1 text-sm text-muted-foreground">Track and manage tenant lease agreements.</p>
          </div>
          <button onClick={() => setShowForm((current) => !current)} className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90">
            <Plus size={18} />
            {showForm ? 'Hide Form' : 'New Lease'}
          </button>
        </div>

        {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        {showForm && (
          <form onSubmit={handleCreate} className="grid grid-cols-1 gap-4 rounded-2xl border border-border bg-card p-5 shadow-card md:grid-cols-2">
            <select value={form.hostelId} onChange={(event) => setForm((current) => ({ ...current, hostelId: event.target.value }))} className="rounded-xl border border-input bg-background px-4 py-3 text-sm">
              {hostels.map((hostel) => <option key={hostel._id} value={hostel._id}>{hostel.name}</option>)}
            </select>
            <input value={form.tenantName} onChange={(event) => setForm((current) => ({ ...current, tenantName: event.target.value }))} placeholder="Tenant name" className="rounded-xl border border-input bg-background px-4 py-3 text-sm" />
            <input value={form.tenantEmail} onChange={(event) => setForm((current) => ({ ...current, tenantEmail: event.target.value }))} placeholder="Tenant email" className="rounded-xl border border-input bg-background px-4 py-3 text-sm" />
            <input value={form.roomLabel} onChange={(event) => setForm((current) => ({ ...current, roomLabel: event.target.value }))} placeholder="Room label" className="rounded-xl border border-input bg-background px-4 py-3 text-sm" />
            <input type="date" value={form.startDate} onChange={(event) => setForm((current) => ({ ...current, startDate: event.target.value }))} className="rounded-xl border border-input bg-background px-4 py-3 text-sm" />
            <input type="date" value={form.endDate} onChange={(event) => setForm((current) => ({ ...current, endDate: event.target.value }))} className="rounded-xl border border-input bg-background px-4 py-3 text-sm" />
            <input type="number" min="0" value={form.monthlyRent} onChange={(event) => setForm((current) => ({ ...current, monthlyRent: event.target.value }))} placeholder="Monthly rent" className="rounded-xl border border-input bg-background px-4 py-3 text-sm md:col-span-2" />
            <button disabled={saving || hostels.length === 0} className="rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60 md:col-span-2">
              {saving ? 'Saving...' : 'Create Lease'}
            </button>
          </form>
        )}

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: 'Active', value: stats.active, color: 'text-green-600 dark:text-green-400' },
            { label: 'Expiring Soon', value: stats.expiring, color: 'text-yellow-600 dark:text-yellow-400' },
            { label: 'Expired', value: stats.expired, color: 'text-red-600 dark:text-red-400' },
            { label: 'Total Revenue', value: `KES ${stats.monthlyRevenue.toLocaleString()}/mo`, color: 'text-primary' },
          ].map((item) => (
            <div key={item.label} className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground">{item.label}</p>
              <p className={`mt-1 text-xl font-bold ${item.color}`}>{item.value}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search tenants..." className="w-full rounded-xl border border-border bg-card py-2.5 pl-9 pr-4 text-sm" />
          </div>
          <div className="flex gap-1 rounded-xl bg-muted p-1">
            {(['all', 'active', 'expiring', 'expired', 'archived'] as const).map((value) => (
              <button key={value} onClick={() => setFilter(value)} className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${filter === value ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
                {value.charAt(0).toUpperCase() + value.slice(1).replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
          {loading ? (
            <div className="py-16 text-center text-muted-foreground">Loading leases...</div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center">
              <FileText size={40} className="mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground">No leases found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-secondary/30">
                    <th className="p-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tenant</th>
                    <th className="p-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Property</th>
                    <th className="p-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Duration</th>
                    <th className="p-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Rent</th>
                    <th className="p-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                    <th className="p-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((lease) => {
                    const config = statusConfig[lease.status];
                    return (
                      <tr key={lease._id} className="transition-colors hover:bg-secondary/50">
                        <td className="p-4">
                          <div className="font-medium text-foreground">{lease.tenantName}</div>
                          {lease.tenantEmail && <div className="text-xs text-muted-foreground">{lease.tenantEmail}</div>}
                        </td>
                        <td className="p-4">
                          <p className="text-sm text-foreground">{lease.hostel?.name || 'Unknown hostel'}</p>
                          <p className="text-xs text-muted-foreground">{lease.roomLabel || 'No room label'}</p>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Calendar size={13} />
                            {formatDate(lease.startDate)} - {formatDate(lease.endDate)}
                          </div>
                        </td>
                        <td className="p-4 text-sm font-semibold text-foreground">KES {Number(lease.monthlyRent || 0).toLocaleString()}/mo</td>
                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${config.bg} ${config.color}`}>
                            {config.icon}
                            {lease.status === 'expiring' ? `Expiring (${lease.daysRemaining}d)` : lease.status.charAt(0).toUpperCase() + lease.status.slice(1)}
                          </span>
                        </td>
                        <td className="p-4">
                          {lease.status === 'expiring' && <button onClick={() => void handleRenew(lease)} className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90">Renew</button>}
                          {lease.status === 'expired' && <button onClick={() => void handleArchive(lease)} className="rounded-lg border border-input px-3 py-1.5 text-xs font-medium text-foreground hover:bg-secondary">Archive</button>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
