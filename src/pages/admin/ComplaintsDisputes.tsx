import { useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '../../components/layouts/DashboardLayout';
import { ApiError, api } from '../../lib/api';
import { Eye, Plus } from 'lucide-react';

interface Complaint {
  _id: string;
  subject: string;
  studentName: string;
  ownerName: string;
  hostelName: string;
  details?: string;
  priority: 'high' | 'medium' | 'low';
  status: 'open' | 'investigating' | 'resolved';
  notes?: string;
  createdAt: string;
}

interface ComplaintResponse {
  complaints: Complaint[];
  stats: { open: number; investigating: number; resolved: number };
}

const statusStyles = {
  open: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
  investigating: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400',
  resolved: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
};

export function ComplaintsDisputes() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [stats, setStats] = useState<ComplaintResponse['stats']>({ open: 0, investigating: 0, resolved: 0 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    subject: '',
    studentName: '',
    ownerName: '',
    hostelName: '',
    priority: 'medium',
    details: '',
  });

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.get<ComplaintResponse>('/admin/complaints');
      setComplaints(data.complaints || []);
      setStats(data.stats);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load complaints.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filtered = useMemo(() => filter === 'all' ? complaints : complaints.filter((complaint) => complaint.status === filter), [complaints, filter]);

  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.post('/admin/complaints', form);
      setShowForm(false);
      setForm({ subject: '', studentName: '', ownerName: '', hostelName: '', priority: 'medium', details: '' });
      await loadData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create complaint.');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (complaint: Complaint) => {
    const status = window.prompt('Update status: open, investigating, resolved', complaint.status);
    if (!status) return;
    const notes = window.prompt('Investigation notes', complaint.notes || '');
    try {
      await api.put(`/admin/complaints/${complaint._id}`, { status, notes: notes || '' });
      await loadData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to update complaint.');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-heading font-bold text-foreground">Complaints & Disputes</h1>
            <p className="mt-1 text-sm text-muted-foreground">Manage user complaints and resolve disputes.</p>
          </div>
          <button onClick={() => setShowForm((current) => !current)} className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90">
            <Plus size={18} />
            {showForm ? 'Hide Form' : 'Log Complaint'}
          </button>
        </div>

        {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        {showForm && (
          <form onSubmit={handleCreate} className="grid grid-cols-1 gap-4 rounded-2xl border border-border bg-card p-5 shadow-card md:grid-cols-2">
            <input value={form.subject} onChange={(event) => setForm((current) => ({ ...current, subject: event.target.value }))} placeholder="Complaint subject" className="rounded-xl border border-input bg-background px-4 py-3 text-sm md:col-span-2" />
            <input value={form.studentName} onChange={(event) => setForm((current) => ({ ...current, studentName: event.target.value }))} placeholder="Student name" className="rounded-xl border border-input bg-background px-4 py-3 text-sm" />
            <input value={form.ownerName} onChange={(event) => setForm((current) => ({ ...current, ownerName: event.target.value }))} placeholder="Owner name" className="rounded-xl border border-input bg-background px-4 py-3 text-sm" />
            <input value={form.hostelName} onChange={(event) => setForm((current) => ({ ...current, hostelName: event.target.value }))} placeholder="Hostel name" className="rounded-xl border border-input bg-background px-4 py-3 text-sm" />
            <select value={form.priority} onChange={(event) => setForm((current) => ({ ...current, priority: event.target.value }))} className="rounded-xl border border-input bg-background px-4 py-3 text-sm">
              <option value="high">High priority</option>
              <option value="medium">Medium priority</option>
              <option value="low">Low priority</option>
            </select>
            <textarea value={form.details} onChange={(event) => setForm((current) => ({ ...current, details: event.target.value }))} rows={4} placeholder="Complaint details" className="rounded-xl border border-input bg-background px-4 py-3 text-sm md:col-span-2" />
            <button disabled={saving} className="rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60 md:col-span-2">
              {saving ? 'Saving...' : 'Create Complaint'}
            </button>
          </form>
        )}

        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Open', count: stats.open, color: 'text-red-600 dark:text-red-400' },
            { label: 'Investigating', count: stats.investigating, color: 'text-yellow-600 dark:text-yellow-400' },
            { label: 'Resolved', count: stats.resolved, color: 'text-green-600 dark:text-green-400' },
          ].map((item) => (
            <div key={item.label} className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground">{item.label}</p>
              <p className={`mt-1 text-2xl font-bold ${item.color}`}>{item.count}</p>
            </div>
          ))}
        </div>

        <div className="flex w-fit gap-1 rounded-xl bg-muted p-1">
          {['all', 'open', 'investigating', 'resolved'].map((value) => (
            <button key={value} onClick={() => setFilter(value)} className={`rounded-lg px-4 py-2 text-sm font-medium capitalize transition-colors ${filter === value ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}>
              {value}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="rounded-xl border border-border bg-card py-16 text-center text-muted-foreground">Loading complaints...</div>
        ) : (
          <div className="space-y-3">
            {filtered.map((complaint) => (
              <div key={complaint._id} className="rounded-2xl border border-border bg-card p-5 shadow-card">
                <div className="mb-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="mb-1 flex items-center gap-2">
                      <span className="text-xs font-mono text-muted-foreground">{complaint._id.slice(-6).toUpperCase()}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusStyles[complaint.status]}`}>{complaint.status.charAt(0).toUpperCase() + complaint.status.slice(1)}</span>
                    </div>
                    <h3 className="font-heading font-bold text-foreground">{complaint.subject}</h3>
                  </div>
                  <button onClick={() => void handleUpdate(complaint)} className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90">
                    <Eye size={14} />
                    Update
                  </button>
                </div>
                <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                  <span>Student: <span className="font-medium text-foreground">{complaint.studentName}</span></span>
                  <span>Owner: <span className="font-medium text-foreground">{complaint.ownerName}</span></span>
                  <span>Property: <span className="font-medium text-foreground">{complaint.hostelName}</span></span>
                  <span>{new Date(complaint.createdAt).toLocaleDateString()}</span>
                </div>
                {complaint.details && <p className="mt-3 text-sm text-muted-foreground">{complaint.details}</p>}
                {complaint.notes && <div className="mt-3 rounded-xl bg-secondary/40 p-3 text-xs text-muted-foreground">Notes: {complaint.notes}</div>}
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
