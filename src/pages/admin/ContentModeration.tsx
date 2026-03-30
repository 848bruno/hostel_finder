import { useEffect, useMemo, useState } from 'react';
import { DashboardLayout, useDashboardRefreshVersion } from '../../components/layouts/DashboardLayout';
import { ApiError, api } from '../../lib/api';
import { Building2, Flag, MessageSquare } from 'lucide-react';

interface ModerationItem {
  id: string;
  hostelId?: string;
  type: 'listing' | 'review';
  title: string;
  owner: string;
  reason: string;
  status: 'flagged' | 'pending' | 'approved' | 'removed';
  date: string;
}

interface ModerationResponse {
  items: ModerationItem[];
  stats: {
    flagged: number;
    pending: number;
    approved: number;
    removed: number;
  };
}

const statusStyles = {
  flagged: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
  pending: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400',
  approved: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
  removed: 'bg-secondary text-foreground',
};

const typeIcons = { listing: Building2, review: MessageSquare };

export function ContentModeration() {
  const refreshVersion = useDashboardRefreshVersion();
  const [items, setItems] = useState<ModerationItem[]>([]);
  const [stats, setStats] = useState<ModerationResponse['stats']>({ flagged: 0, pending: 0, approved: 0, removed: 0 });
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.get<ModerationResponse>('/admin/moderation');
      setItems(data.items || []);
      setStats(data.stats);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load moderation items.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [refreshVersion]);

  const filtered = useMemo(() => filter === 'all' ? items : items.filter((item) => item.status === filter), [filter, items]);

  const handleAction = async (item: ModerationItem, action: 'approve' | 'remove') => {
    const reason = window.prompt(`${action === 'approve' ? 'Optional approval note' : 'Reason for removal'}`, item.reason || '');
    try {
      await api.put(`/admin/moderation/${item.type}/${item.id}`, { action, reason: reason || '' });
      await loadData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to update moderation item.');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Content Moderation</h1>
          <p className="mt-1 text-sm text-muted-foreground">Review flagged content and maintain quality.</p>
        </div>

        {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Flagged', count: stats.flagged, color: 'text-red-600 dark:text-red-400' },
            { label: 'Pending Review', count: stats.pending, color: 'text-yellow-600 dark:text-yellow-400' },
            { label: 'Approved', count: stats.approved, color: 'text-green-600 dark:text-green-400' },
            { label: 'Removed', count: stats.removed, color: 'text-muted-foreground' },
          ].map((item) => (
            <div key={item.label} className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground">{item.label}</p>
              <p className={`mt-1 text-2xl font-bold ${item.color}`}>{item.count}</p>
            </div>
          ))}
        </div>

        <div className="flex w-fit gap-1 rounded-xl bg-muted p-1">
          {['all', 'flagged', 'pending', 'approved', 'removed'].map((value) => (
            <button key={value} onClick={() => setFilter(value)} className={`rounded-lg px-4 py-2 text-sm font-medium capitalize transition-colors ${filter === value ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}>
              {value}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="rounded-xl border border-border bg-card py-16 text-center text-muted-foreground">Loading moderation items...</div>
        ) : (
          <div className="space-y-3">
            {filtered.map((item) => {
              const Icon = typeIcons[item.type] || Flag;
              return (
                <div key={`${item.type}:${item.id}`} className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-card">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary"><Icon size={18} className="text-muted-foreground" /></div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-0.5 flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-foreground">{item.title}</h3>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusStyles[item.status]}`}>{item.status.charAt(0).toUpperCase() + item.status.slice(1)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{item.reason} · by {item.owner} · {new Date(item.date).toLocaleDateString()}</p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    {item.status !== 'approved' && item.status !== 'removed' && <button onClick={() => void handleAction(item, 'approve')} className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90">Approve</button>}
                    {item.status !== 'removed' && <button onClick={() => void handleAction(item, 'remove')} className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90">Remove</button>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
