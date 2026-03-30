import { useEffect, useMemo, useState } from 'react';
import { DashboardLayout, useDashboardRefreshVersion } from '../../components/layouts/DashboardLayout';
import { ApiError, api } from '../../lib/api';
import { Calendar, FileText, Search, User } from 'lucide-react';

interface AuditLog {
  _id: string;
  action: string;
  target: string;
  type: string;
  actorEmail?: string;
  createdAt: string;
}

const typeColors: Record<string, string> = {
  approval: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
  deletion: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
  moderation: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400',
  settings: 'bg-primary/20 dark:bg-blue-900/30 text-primary dark:text-blue-400',
  announcement: 'bg-purple-100 dark:bg-purple-900/30 text-primary dark:text-purple-400',
  support: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300',
  complaint: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300',
  bulk: 'bg-secondary text-foreground',
};

export function AuditLogs() {
  const refreshVersion = useDashboardRefreshVersion();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [error, setError] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      if (typeFilter !== 'all') params.set('type', typeFilter);
      const data = await api.get<{ logs: AuditLog[] }>(`/admin/audit-logs${params.toString() ? `?${params.toString()}` : ''}`);
      setLogs(data.logs || []);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load audit logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [search, typeFilter, refreshVersion]);

  const types = useMemo(() => ['all', ...Array.from(new Set(logs.map((log) => log.type)))], [logs]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Audit Logs</h1>
          <p className="mt-1 text-sm text-muted-foreground">Track administrative actions across the platform.</p>
        </div>

        {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-card sm:flex-row">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search logs..." className="w-full rounded-xl border border-input bg-background py-2.5 pl-9 pr-4 text-sm text-foreground" />
          </div>
          <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} className="rounded-xl border border-input bg-background px-4 py-2.5 text-sm text-foreground">
            <option value="all">All Types</option>
            {types.filter((type) => type !== 'all').map((type) => (
              <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
            ))}
          </select>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
          {loading ? (
            <div className="py-16 text-center text-muted-foreground">Loading audit logs...</div>
          ) : logs.length === 0 ? (
            <div className="py-16 text-center">
              <FileText size={40} className="mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground">No logs found.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {logs.map((log) => (
                <div key={log._id} className="flex items-center justify-between p-4 transition-colors hover:bg-secondary/50">
                  <div className="flex items-center gap-4">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${typeColors[log.type] || 'bg-secondary'}`}>
                      <FileText size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{log.action}</p>
                      <p className="text-xs text-muted-foreground">{log.target}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="flex items-center justify-end gap-1 text-xs text-muted-foreground"><User size={11} />{log.actorEmail || 'Unknown admin'}</p>
                    <p className="mt-0.5 flex items-center justify-end gap-1 text-xs text-muted-foreground"><Calendar size={11} />{new Date(log.createdAt).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
