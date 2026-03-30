import { useEffect, useState } from 'react';
import { DashboardLayout, useDashboardRefreshVersion } from '../../components/layouts/DashboardLayout';
import { ApiError, getToken, api } from '../../lib/api';
import { AlertTriangle, Download, FileText, Upload } from 'lucide-react';

interface BulkImportJob {
  _id: string;
  type?: 'import' | 'export';
  dataType: 'users' | 'hostels' | 'bookings' | 'payments' | 'audit';
  fileName?: string;
  status: 'pending' | 'running' | 'retry' | 'completed' | 'failed';
  summary: {
    created: number;
    skipped: number;
    failed: number;
  };
  errorMessages: string[];
  downloadUrl?: string;
  createdAt: string;
  completedAt?: string | null;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5100/api';

async function downloadExport(path: string, fallbackName: string) {
  const token = getToken();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!response.ok) {
    let message = 'Failed to export data.';
    try {
      const data = await response.json();
      message = data.message || message;
    } catch {
      // ignore invalid json
    }
    throw new ApiError(response.status, message);
  }
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fallbackName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export function BulkDataManagement() {
  const refreshVersion = useDashboardRefreshVersion();
  const [jobs, setJobs] = useState<BulkImportJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');
  const [dataType, setDataType] = useState<'users' | 'hostels' | 'bookings'>('users');
  const [file, setFile] = useState<File | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.get<{ jobs?: BulkImportJob[]; imports?: BulkImportJob[] }>('/admin/bulk-data');
      setJobs(data.jobs || data.imports || []);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load bulk jobs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [refreshVersion]);

  const handleImport = async () => {
    if (!file) {
      setError('Select a CSV file first.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const csvText = await file.text();
      await api.post('/admin/bulk-data/import', {
        dataType,
        fileName: file.name,
        csvText,
      });
      setFile(null);
      await loadData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to import CSV.');
    } finally {
      setSaving(false);
    }
  };

  const handleExport = async (type: string) => {
    setExporting(true);
    setError('');
    try {
      await api.post('/admin/bulk-data/export', { type });
      await loadData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to queue export job.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Bulk Data Management</h1>
          <p className="mt-1 text-sm text-muted-foreground">Import and export platform data using real CSV jobs.</p>
        </div>

        {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10"><Upload size={20} className="text-primary" /></div>
              <h2 className="text-lg font-bold text-foreground">Import Data</h2>
            </div>
            <p className="mb-4 text-sm text-muted-foreground">Upload CSV files to bulk import users, hostels, or bookings.</p>
            <input type="file" accept=".csv,text/csv" onChange={(event) => setFile(event.target.files?.[0] || null)} className="mb-4 w-full rounded-xl border border-input bg-background px-4 py-3 text-sm" />
            <select value={dataType} onChange={(event) => setDataType(event.target.value as typeof dataType)} className="mb-3 w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm">
              <option value="users">Users</option>
              <option value="hostels">Hostels</option>
              <option value="bookings">Bookings</option>
            </select>
            <button onClick={() => void handleImport()} disabled={saving} className="w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60">
              {saving ? 'Importing...' : 'Start Import'}
            </button>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 dark:bg-green-900/30"><Download size={20} className="text-green-600 dark:text-green-400" /></div>
              <h2 className="text-lg font-bold text-foreground">Export Data</h2>
            </div>
            <p className="mb-4 text-sm text-muted-foreground">Download platform data as CSV files for reporting.</p>
            <div className="space-y-3">
              {[
                { label: 'All Users', type: 'users' },
                { label: 'All Hostels', type: 'hostels' },
                { label: 'All Bookings', type: 'bookings' },
                { label: 'Payment Records', type: 'payments' },
                { label: 'Audit Logs', type: 'audit' },
              ].map((item) => (
                <button key={item.type} onClick={() => void handleExport(item.type)} disabled={exporting} className="flex w-full items-center justify-between rounded-xl border border-border p-3.5 text-left transition-colors hover:bg-secondary disabled:opacity-60">
                  <div className="flex items-center gap-3">
                    <FileText size={16} className="text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">{item.label}</span>
                  </div>
                  <Download size={16} className="text-muted-foreground" />
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-2xl border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800/30 dark:bg-yellow-900/10">
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-yellow-600 dark:text-yellow-400" />
          <div>
            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">Caution</p>
            <p className="mt-0.5 text-xs text-yellow-700 dark:text-yellow-400/80">Bulk imports create live platform records. Keep headers consistent with the selected data type.</p>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card shadow-card">
          <div className="border-b border-border p-4">
            <h2 className="text-lg font-bold text-foreground">Recent Import Jobs</h2>
          </div>
          {loading ? (
            <div className="py-16 text-center text-muted-foreground">Loading jobs...</div>
          ) : jobs.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground">No import jobs found.</div>
          ) : (
            <div className="divide-y divide-border">
              {jobs.map((job) => (
                <div key={job._id} className="p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{job.fileName || `${job.dataType}.csv`}</p>
                      <p className="text-xs text-muted-foreground">{job.type || 'import'} · {job.dataType} · {new Date(job.createdAt).toLocaleString()}</p>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${job.status === 'completed' ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' : job.status === 'failed' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'}`}>
                      {job.status}
                    </span>
                  </div>
                  {job.type !== 'export' && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      Created: {job.summary.created} · Skipped: {job.summary.skipped} · Failed: {job.summary.failed}
                    </div>
                  )}
                  {job.errorMessages.length > 0 && <div className="mt-2 rounded-xl bg-secondary/40 p-3 text-xs text-muted-foreground">{job.errorMessages.slice(0, 3).join(' | ')}</div>}
                  {job.type === 'export' && job.status === 'completed' && job.downloadUrl && (
                    <button
                      onClick={() => void downloadExport(job.downloadUrl as string, job.fileName || `${job.dataType}-export.csv`).catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to download export.'))}
                      className="mt-3 inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-xs font-semibold text-foreground hover:bg-secondary"
                    >
                      <Download size={14} />
                      Download export
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
