import { useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '../../components/layouts/DashboardLayout';
import { ApiError, api } from '../../lib/api';
import { Mail, MapPin, Phone, Plus, Search, Shield, Star, Trash2, UserCheck } from 'lucide-react';

interface HostelOption {
  _id: string;
  name: string;
}

interface Caretaker {
  _id: string;
  name: string;
  phone: string;
  email?: string;
  roleTitle: string;
  hostel?: { _id: string; name: string };
  hostelName?: string;
  rating: number;
  status: 'active' | 'on_leave' | 'inactive';
}

export function CaretakerAccounts() {
  const [caretakers, setCaretakers] = useState<Caretaker[]>([]);
  const [hostels, setHostels] = useState<HostelOption[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    hostelId: '',
    name: '',
    phone: '',
    email: '',
    roleTitle: '',
    rating: '5',
    status: 'active',
  });

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [caretakerData, hostelData] = await Promise.all([
        api.get<{ caretakers: Caretaker[] }>('/owners/caretakers'),
        api.get<{ hostels: HostelOption[] }>('/owners/hostels'),
      ]);
      setCaretakers(caretakerData.caretakers || []);
      setHostels(hostelData.hostels || []);
      setForm((current) => ({ ...current, hostelId: current.hostelId || hostelData.hostels?.[0]?._id || '' }));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load caretakers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filtered = useMemo(() => caretakers.filter((caretaker) => {
    const target = `${caretaker.name} ${caretaker.roleTitle}`.toLowerCase();
    return target.includes(search.toLowerCase());
  }), [caretakers, search]);

  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.post('/owners/caretakers', {
        ...form,
        rating: Number(form.rating),
      });
      setShowForm(false);
      setForm({
        hostelId: hostels[0]?._id || '',
        name: '',
        phone: '',
        email: '',
        roleTitle: '',
        rating: '5',
        status: 'active',
      });
      await loadData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create caretaker.');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (caretaker: Caretaker, status: Caretaker['status']) => {
    try {
      await api.put(`/owners/caretakers/${caretaker._id}`, { status });
      await loadData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to update caretaker.');
    }
  };

  const handleDelete = async (caretakerId: string) => {
    try {
      await api.delete(`/owners/caretakers/${caretakerId}`);
      await loadData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to delete caretaker.');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-heading font-bold text-foreground">Caretaker Accounts</h1>
            <p className="mt-1 text-sm text-muted-foreground">Manage your property caretakers and staff.</p>
          </div>
          <button onClick={() => setShowForm((current) => !current)} className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90">
            <Plus size={18} />
            {showForm ? 'Hide Form' : 'Add Caretaker'}
          </button>
        </div>

        {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        {showForm && (
          <form onSubmit={handleCreate} className="grid grid-cols-1 gap-4 rounded-2xl border border-border bg-card p-5 shadow-card md:grid-cols-2">
            <select value={form.hostelId} onChange={(event) => setForm((current) => ({ ...current, hostelId: event.target.value }))} className="rounded-xl border border-input bg-background px-4 py-3 text-sm">
              <option value="">All Properties</option>
              {hostels.map((hostel) => <option key={hostel._id} value={hostel._id}>{hostel.name}</option>)}
            </select>
            <input value={form.roleTitle} onChange={(event) => setForm((current) => ({ ...current, roleTitle: event.target.value }))} placeholder="Role" className="rounded-xl border border-input bg-background px-4 py-3 text-sm" />
            <input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="Full name" className="rounded-xl border border-input bg-background px-4 py-3 text-sm" />
            <input value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} placeholder="Phone" className="rounded-xl border border-input bg-background px-4 py-3 text-sm" />
            <input value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} placeholder="Email" className="rounded-xl border border-input bg-background px-4 py-3 text-sm" />
            <input type="number" min="0" max="5" step="0.1" value={form.rating} onChange={(event) => setForm((current) => ({ ...current, rating: event.target.value }))} placeholder="Rating" className="rounded-xl border border-input bg-background px-4 py-3 text-sm" />
            <button disabled={saving} className="rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60 md:col-span-2">
              {saving ? 'Saving...' : 'Save Caretaker'}
            </button>
          </form>
        )}

        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by name or role..." className="w-full rounded-xl border border-border bg-card py-2.5 pl-10 pr-4 text-sm" />
        </div>

        {loading ? (
          <div className="py-16 text-center text-muted-foreground">Loading caretakers...</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <UserCheck size={40} className="mx-auto mb-3 text-muted-foreground" />
            <p className="text-muted-foreground">No caretakers found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {filtered.map((caretaker) => (
              <div key={caretaker._id} className="rounded-2xl border border-border bg-card p-5 shadow-card transition-shadow hover:shadow-md">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary text-lg font-bold text-primary-foreground">
                    {caretaker.name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <h3 className="font-heading font-bold text-foreground">{caretaker.name}</h3>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${caretaker.status === 'active' ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' : caretaker.status === 'on_leave' ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400' : 'bg-muted text-muted-foreground'}`}>
                        {caretaker.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="mb-2 flex items-center gap-1.5 text-sm text-primary"><Shield size={13} />{caretaker.roleTitle}</div>
                    <div className="space-y-1 text-xs text-muted-foreground">
                      <p className="flex items-center gap-1.5"><MapPin size={12} />{caretaker.hostelName || caretaker.hostel?.name || 'All Properties'}</p>
                      <p className="flex items-center gap-1.5"><Phone size={12} />{caretaker.phone}</p>
                      {caretaker.email && <p className="flex items-center gap-1.5"><Mail size={12} />{caretaker.email}</p>}
                    </div>
                    <div className="mt-3 flex items-center gap-1">
                      <Star size={14} className="fill-yellow-500 text-yellow-500" />
                      <span className="text-sm font-semibold text-foreground">{Number(caretaker.rating || 0).toFixed(1)}</span>
                      <span className="text-xs text-muted-foreground">/ 5.0</span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
                  <button onClick={() => window.open(`tel:${caretaker.phone}`)} className="flex-1 rounded-lg bg-green-100 py-2 text-xs font-semibold text-green-700 hover:opacity-80 dark:bg-green-900/30 dark:text-green-400">Call</button>
                  {caretaker.email && <button onClick={() => window.open(`mailto:${caretaker.email}`)} className="flex-1 rounded-lg bg-primary/10 py-2 text-xs font-semibold text-primary hover:opacity-80">Email</button>}
                  <button onClick={() => void handleStatusChange(caretaker, caretaker.status === 'active' ? 'on_leave' : 'active')} className="rounded-lg border border-border px-3 py-2 text-xs font-medium text-foreground hover:bg-secondary">
                    {caretaker.status === 'active' ? 'Set Leave' : 'Activate'}
                  </button>
                  <button onClick={() => void handleDelete(caretaker._id)} className="rounded-lg border border-border px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
