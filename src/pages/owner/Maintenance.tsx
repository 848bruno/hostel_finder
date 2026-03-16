import { useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '../../components/layouts/DashboardLayout';
import { ApiError, api } from '../../lib/api';
import { AlertTriangle, CheckCircle2, Clock, Phone, Plus, Search, Wrench } from 'lucide-react';

type Priority = 'urgent' | 'high' | 'medium' | 'low';
type Status = 'open' | 'in_progress' | 'resolved';

interface HostelOption {
  _id: string;
  name: string;
}

interface MaintenanceRequest {
  _id: string;
  tenantName: string;
  tenantPhone?: string;
  roomLabel?: string;
  category: string;
  description: string;
  priority: Priority;
  status: Status;
  assignedTo?: string;
  createdAt: string;
  resolvedAt?: string | null;
  hostel?: { _id: string; name: string };
  hostelName?: string;
}

interface MaintenanceResponse {
  requests: MaintenanceRequest[];
  stats: {
    open: number;
    in_progress: number;
    resolved: number;
    urgent: number;
    averageResolutionDays: number;
  };
}

const priorityConfig: Record<Priority, { color: string; bg: string; label: string }> = {
  urgent: { color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/30', label: 'Urgent' },
  high: { color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-100 dark:bg-orange-900/30', label: 'High' },
  medium: { color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-100 dark:bg-yellow-900/30', label: 'Medium' },
  low: { color: 'text-gray-600 dark:text-gray-400', bg: 'bg-gray-100 dark:bg-gray-900/30', label: 'Low' },
};

const statusConfig: Record<Status, { color: string; label: string; icon: React.ReactNode }> = {
  open: { color: 'text-red-600 dark:text-red-400', label: 'Open', icon: <AlertTriangle size={14} /> },
  in_progress: { color: 'text-yellow-600 dark:text-yellow-400', label: 'In Progress', icon: <Clock size={14} /> },
  resolved: { color: 'text-green-600 dark:text-green-400', label: 'Resolved', icon: <CheckCircle2 size={14} /> },
};

const categories = ['All', 'Plumbing', 'Electrical', 'Furniture', 'Security', 'Pest Control', 'Cleaning', 'Internet'];

function formatDate(value: string) {
  return new Date(value).toLocaleDateString();
}

export function Maintenance() {
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [hostels, setHostels] = useState<HostelOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | Status>('all');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState<MaintenanceResponse['stats']>({
    open: 0,
    in_progress: 0,
    resolved: 0,
    urgent: 0,
    averageResolutionDays: 0,
  });
  const [form, setForm] = useState({
    hostelId: '',
    tenantName: '',
    tenantPhone: '',
    roomLabel: '',
    category: 'Plumbing',
    description: '',
    priority: 'medium' as Priority,
    assignedTo: '',
  });

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [maintenanceData, hostelData] = await Promise.all([
        api.get<MaintenanceResponse>('/owners/maintenance'),
        api.get<{ hostels: HostelOption[] }>('/owners/hostels'),
      ]);
      setRequests(maintenanceData.requests);
      setStats(maintenanceData.stats);
      setHostels(hostelData.hostels || []);
      setForm((current) => ({
        ...current,
        hostelId: current.hostelId || hostelData.hostels?.[0]?._id || '',
      }));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load maintenance requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filtered = useMemo(() => requests.filter((request) => {
    if (activeTab !== 'all' && request.status !== activeTab) return false;
    if (selectedCategory !== 'All' && request.category !== selectedCategory) return false;
    if (searchQuery) {
      const target = `${request.description} ${request.tenantName} ${request.hostelName || request.hostel?.name || ''}`.toLowerCase();
      if (!target.includes(searchQuery.toLowerCase())) return false;
    }
    return true;
  }), [activeTab, requests, searchQuery, selectedCategory]);

  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError('');

    try {
      const result = await api.post<{ request: MaintenanceRequest; message: string }>('/owners/maintenance', form);
      setRequests((current) => [result.request, ...current]);
      setShowForm(false);
      setForm({
        hostelId: hostels[0]?._id || '',
        tenantName: '',
        tenantPhone: '',
        roomLabel: '',
        category: 'Plumbing',
        description: '',
        priority: 'medium',
        assignedTo: '',
      });
      await loadData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create maintenance request.');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (id: string, updates: Partial<MaintenanceRequest>) => {
    setError('');
    try {
      const result = await api.put<{ request: MaintenanceRequest }>(`/owners/maintenance/${id}`, updates);
      setRequests((current) => current.map((request) => request._id === id ? result.request : request));
      await loadData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to update maintenance request.');
    }
  };

  const tabs: { key: 'all' | Status; label: string; count: number }[] = [
    { key: 'all', label: 'All Requests', count: requests.length },
    { key: 'open', label: 'Open', count: stats.open },
    { key: 'in_progress', label: 'In Progress', count: stats.in_progress },
    { key: 'resolved', label: 'Resolved', count: stats.resolved },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-heading font-bold text-foreground">Maintenance Requests</h1>
            <p className="mt-1 text-sm text-muted-foreground">Track and manage property maintenance issues.</p>
          </div>
          <button
            onClick={() => setShowForm((current) => !current)}
            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            <Plus size={18} />
            {showForm ? 'Hide Form' : 'Log Request'}
          </button>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {showForm && (
          <form onSubmit={handleCreate} className="grid grid-cols-1 gap-4 rounded-2xl border border-border bg-card p-5 shadow-card md:grid-cols-2">
            <select value={form.hostelId} onChange={(event) => setForm((current) => ({ ...current, hostelId: event.target.value }))} className="rounded-xl border border-input bg-background px-4 py-3 text-sm">
              {hostels.map((hostel) => <option key={hostel._id} value={hostel._id}>{hostel.name}</option>)}
            </select>
            <input value={form.tenantName} onChange={(event) => setForm((current) => ({ ...current, tenantName: event.target.value }))} placeholder="Tenant name" className="rounded-xl border border-input bg-background px-4 py-3 text-sm" />
            <input value={form.tenantPhone} onChange={(event) => setForm((current) => ({ ...current, tenantPhone: event.target.value }))} placeholder="Tenant phone" className="rounded-xl border border-input bg-background px-4 py-3 text-sm" />
            <input value={form.roomLabel} onChange={(event) => setForm((current) => ({ ...current, roomLabel: event.target.value }))} placeholder="Room label" className="rounded-xl border border-input bg-background px-4 py-3 text-sm" />
            <select value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))} className="rounded-xl border border-input bg-background px-4 py-3 text-sm">
              {categories.filter((category) => category !== 'All').map((category) => <option key={category}>{category}</option>)}
            </select>
            <select value={form.priority} onChange={(event) => setForm((current) => ({ ...current, priority: event.target.value as Priority }))} className="rounded-xl border border-input bg-background px-4 py-3 text-sm">
              {Object.keys(priorityConfig).map((priority) => <option key={priority} value={priority}>{priorityConfig[priority as Priority].label}</option>)}
            </select>
            <input value={form.assignedTo} onChange={(event) => setForm((current) => ({ ...current, assignedTo: event.target.value }))} placeholder="Assigned staff (optional)" className="rounded-xl border border-input bg-background px-4 py-3 text-sm md:col-span-2" />
            <textarea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} placeholder="Describe the issue" rows={4} className="rounded-xl border border-input bg-background px-4 py-3 text-sm md:col-span-2" />
            <button disabled={saving || hostels.length === 0} className="rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60 md:col-span-2">
              {saving ? 'Saving...' : 'Create Request'}
            </button>
          </form>
        )}

        {stats.urgent > 0 && (
          <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-100 p-4 dark:border-red-800/30 dark:bg-red-900/20">
            <AlertTriangle size={20} className="text-red-600 dark:text-red-400" />
            <p className="text-sm font-medium text-red-700 dark:text-red-300">{stats.urgent} urgent request{stats.urgent > 1 ? 's' : ''} need immediate attention.</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: 'Open', value: stats.open, color: 'text-red-600 dark:text-red-400' },
            { label: 'In Progress', value: stats.in_progress, color: 'text-yellow-600 dark:text-yellow-400' },
            { label: 'Resolved', value: stats.resolved, color: 'text-green-600 dark:text-green-400' },
            { label: 'Avg Resolution', value: `${stats.averageResolutionDays || 0} days`, color: 'text-primary' },
          ].map((item) => (
            <div key={item.label} className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground">{item.label}</p>
              <p className={`mt-1 text-2xl font-bold ${item.color}`}>{item.value}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="flex gap-1 overflow-x-auto rounded-xl bg-muted p-1">
            {tabs.map((tab) => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-colors ${activeTab === tab.key ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>
          <div className="flex flex-1 gap-2">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search requests..." className="w-full rounded-xl border border-border bg-card py-2 pl-9 pr-4 text-sm" />
            </div>
            <select value={selectedCategory} onChange={(event) => setSelectedCategory(event.target.value)} className="rounded-xl border border-border bg-card px-3 py-2 text-sm">
              {categories.map((category) => <option key={category}>{category}</option>)}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="rounded-xl border border-border bg-card py-16 text-center text-muted-foreground">Loading maintenance requests...</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <Wrench size={40} className="mx-auto mb-3 text-muted-foreground" />
            <p className="text-muted-foreground">No maintenance requests found.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((request) => (
              <div key={request._id} className="rounded-xl border border-border bg-card p-4 transition-shadow hover:shadow-md sm:p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                  <div className="flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-mono text-muted-foreground">{request._id.slice(-6).toUpperCase()}</span>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${priorityConfig[request.priority].bg} ${priorityConfig[request.priority].color}`}>{priorityConfig[request.priority].label}</span>
                      <span className={`flex items-center gap-1 text-xs font-medium ${statusConfig[request.status].color}`}>{statusConfig[request.status].icon} {statusConfig[request.status].label}</span>
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">{request.category}</span>
                    </div>
                    <p className="text-sm font-medium text-foreground">{request.description}</p>
                    <div className="text-xs text-muted-foreground">
                      {request.hostelName || request.hostel?.name || 'Unknown hostel'}{request.roomLabel ? ` · ${request.roomLabel}` : ''} · {formatDate(request.createdAt)}
                    </div>
                    <p className="text-xs text-muted-foreground">Reported by <span className="font-medium text-foreground">{request.tenantName}</span>{request.tenantPhone ? ` (${request.tenantPhone})` : ''}</p>
                    {request.assignedTo && <p className="text-xs text-primary">Assigned to: {request.assignedTo}</p>}
                  </div>
                  <div className="flex shrink-0 gap-2">
                    {request.tenantPhone && (
                      <button onClick={() => window.open(`tel:${request.tenantPhone}`)} className="rounded-lg bg-green-100 p-2 text-green-700 hover:opacity-80 dark:bg-green-900/30 dark:text-green-400" title="Call tenant">
                        <Phone size={16} />
                      </button>
                    )}
                    {request.status === 'open' && (
                      <button
                        onClick={() => {
                          const assignedTo = window.prompt('Assign this request to:', request.assignedTo || '');
                          if (assignedTo === null) return;
                          void handleUpdate(request._id, { status: 'in_progress', assignedTo });
                        }}
                        className="rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90"
                      >
                        Assign
                      </button>
                    )}
                    {request.status === 'in_progress' && (
                      <button onClick={() => void handleUpdate(request._id, { status: 'resolved' })} className="rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white hover:opacity-90">
                        Resolve
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
