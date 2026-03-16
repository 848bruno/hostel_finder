import { useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '../../components/layouts/DashboardLayout';
import { ApiError, api } from '../../lib/api';
import { Headphones, MessageCircle, Plus, Search, User } from 'lucide-react';

interface SupportTicket {
  _id: string;
  subject: string;
  userEmail: string;
  userRole: 'Student' | 'Owner' | 'Admin';
  status: 'open' | 'in_progress' | 'resolved';
  priority: 'high' | 'medium' | 'low';
  replies: Array<{ _id: string; sender: 'user' | 'admin'; message: string; createdAt: string }>;
  createdAt: string;
}

interface TicketResponse {
  tickets: SupportTicket[];
  stats: { open: number; in_progress: number; resolved: number };
}

const statusStyles = {
  open: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
  in_progress: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400',
  resolved: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
};

const priorityStyles = {
  high: 'text-red-600 dark:text-red-400',
  medium: 'text-yellow-600 dark:text-yellow-400',
  low: 'text-muted-foreground',
};

export function SupportTickets() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [stats, setStats] = useState<TicketResponse['stats']>({ open: 0, in_progress: 0, resolved: 0 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    subject: '',
    userEmail: '',
    userRole: 'Student',
    priority: 'medium',
    message: '',
  });

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.get<TicketResponse>('/admin/support-tickets');
      setTickets(data.tickets || []);
      setStats(data.stats);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load support tickets.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filtered = useMemo(() => tickets.filter((ticket) => {
    if (filter !== 'all' && ticket.status !== filter) return false;
    const target = `${ticket.subject} ${ticket.userEmail}`.toLowerCase();
    return target.includes(search.toLowerCase());
  }), [tickets, filter, search]);

  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.post('/admin/support-tickets', form);
      setShowForm(false);
      setForm({ subject: '', userEmail: '', userRole: 'Student', priority: 'medium', message: '' });
      await loadData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create support ticket.');
    } finally {
      setSaving(false);
    }
  };

  const handleReply = async (ticket: SupportTicket) => {
    const adminReply = window.prompt('Reply to this ticket:');
    if (!adminReply) return;
    try {
      await api.put(`/admin/support-tickets/${ticket._id}`, {
        adminReply,
        status: ticket.status === 'open' ? 'in_progress' : ticket.status,
      });
      await loadData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to reply to ticket.');
    }
  };

  const handleResolve = async (ticket: SupportTicket) => {
    try {
      await api.put(`/admin/support-tickets/${ticket._id}`, { status: 'resolved' });
      await loadData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to resolve ticket.');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-heading font-bold text-foreground">Support Tickets</h1>
            <p className="mt-1 text-sm text-muted-foreground">Manage user support requests.</p>
          </div>
          <button onClick={() => setShowForm((current) => !current)} className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90">
            <Plus size={18} />
            {showForm ? 'Hide Form' : 'New Ticket'}
          </button>
        </div>

        {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        {showForm && (
          <form onSubmit={handleCreate} className="grid grid-cols-1 gap-4 rounded-2xl border border-border bg-card p-5 shadow-card md:grid-cols-2">
            <input value={form.subject} onChange={(event) => setForm((current) => ({ ...current, subject: event.target.value }))} placeholder="Ticket subject" className="rounded-xl border border-input bg-background px-4 py-3 text-sm md:col-span-2" />
            <input value={form.userEmail} onChange={(event) => setForm((current) => ({ ...current, userEmail: event.target.value }))} placeholder="User email" className="rounded-xl border border-input bg-background px-4 py-3 text-sm" />
            <select value={form.userRole} onChange={(event) => setForm((current) => ({ ...current, userRole: event.target.value }))} className="rounded-xl border border-input bg-background px-4 py-3 text-sm">
              <option value="Student">Student</option>
              <option value="Owner">Owner</option>
              <option value="Admin">Admin</option>
            </select>
            <select value={form.priority} onChange={(event) => setForm((current) => ({ ...current, priority: event.target.value }))} className="rounded-xl border border-input bg-background px-4 py-3 text-sm md:col-span-2">
              <option value="high">High priority</option>
              <option value="medium">Medium priority</option>
              <option value="low">Low priority</option>
            </select>
            <textarea value={form.message} onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))} rows={4} placeholder="Initial user message" className="rounded-xl border border-input bg-background px-4 py-3 text-sm md:col-span-2" />
            <button disabled={saving} className="rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60 md:col-span-2">
              {saving ? 'Saving...' : 'Create Ticket'}
            </button>
          </form>
        )}

        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Open', value: stats.open, color: 'text-red-600 dark:text-red-400' },
            { label: 'In Progress', value: stats.in_progress, color: 'text-yellow-600 dark:text-yellow-400' },
            { label: 'Resolved', value: stats.resolved, color: 'text-green-600 dark:text-green-400' },
          ].map((item) => (
            <div key={item.label} className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground">{item.label}</p>
              <p className={`mt-1 text-2xl font-bold ${item.color}`}>{item.value}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search tickets..." className="w-full rounded-xl border border-border bg-card py-2.5 pl-9 pr-4 text-sm" />
          </div>
          <div className="flex gap-1 rounded-xl bg-muted p-1">
            {[
              { k: 'all', l: 'All' },
              { k: 'open', l: 'Open' },
              { k: 'in_progress', l: 'In Progress' },
              { k: 'resolved', l: 'Resolved' },
            ].map((item) => (
              <button key={item.k} onClick={() => setFilter(item.k)} className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${filter === item.k ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}>
                {item.l}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="rounded-xl border border-border bg-card py-16 text-center text-muted-foreground">Loading support tickets...</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <Headphones size={40} className="mx-auto mb-3 text-muted-foreground" />
            <p className="text-muted-foreground">No tickets found.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((ticket) => (
              <div key={ticket._id} className="rounded-2xl border border-border bg-card p-5 shadow-card">
                <div className="mb-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-muted-foreground">{ticket._id.slice(-6).toUpperCase()}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusStyles[ticket.status]}`}>{ticket.status.replace('_', ' ')}</span>
                    <span className={`text-xs font-semibold ${priorityStyles[ticket.priority]}`}>{ticket.priority}</span>
                  </div>
                  <div className="flex gap-2">
                    {ticket.status !== 'resolved' && <button onClick={() => void handleReply(ticket)} className="flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90"><MessageCircle size={13} />Reply</button>}
                    {ticket.status !== 'resolved' && <button onClick={() => void handleResolve(ticket)} className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-secondary">Resolve</button>}
                  </div>
                </div>
                <h3 className="mb-1 text-sm font-semibold text-foreground">{ticket.subject}</h3>
                <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><User size={11} />{ticket.userEmail} ({ticket.userRole})</span>
                  <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                  <span className="flex items-center gap-1"><MessageCircle size={11} />{ticket.replies.length} replies</span>
                </div>
                {ticket.replies.length > 0 && (
                  <div className="mt-3 rounded-xl bg-secondary/40 p-3 text-xs text-muted-foreground">
                    Latest: {ticket.replies[ticket.replies.length - 1].message}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
