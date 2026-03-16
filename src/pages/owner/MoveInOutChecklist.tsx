import { useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '../../components/layouts/DashboardLayout';
import { ApiError, getToken, api } from '../../lib/api';
import { AlertTriangle, ArrowRightLeft, Camera, CheckCircle2, ClipboardCheck, Clock, Download, MapPin } from 'lucide-react';

type ChecklistStatus = 'pending' | 'completed' | 'disputed';

interface HostelOption {
  _id: string;
  name: string;
}

interface ChecklistItem {
  area: string;
  condition: 'good' | 'fair' | 'damaged' | 'missing';
  notes?: string;
  photoTaken: boolean;
}

interface MoveRecord {
  _id: string;
  tenantName: string;
  roomLabel: string;
  type: 'move_in' | 'move_out';
  date: string;
  status: ChecklistStatus;
  deposit: number;
  deductions: number;
  items: ChecklistItem[];
  hostel?: { _id: string; name: string };
  hostelName?: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5100/api';

const conditionStyles: Record<string, { color: string; bg: string }> = {
  good: { color: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
  fair: { color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-100 dark:bg-yellow-900/30' },
  damaged: { color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/30' },
  missing: { color: 'text-foreground', bg: 'bg-muted' },
};

const statusStyles: Record<ChecklistStatus, { color: string; bg: string; icon: React.ReactNode; label: string }> = {
  pending: { color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-100 dark:bg-yellow-900/30', icon: <Clock size={14} />, label: 'Pending' },
  completed: { color: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/30', icon: <CheckCircle2 size={14} />, label: 'Completed' },
  disputed: { color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/30', icon: <AlertTriangle size={14} />, label: 'Disputed' },
};

async function downloadChecklistReport(recordId: string) {
  const token = getToken();
  const response = await fetch(`${API_BASE_URL}/owners/checklists/${recordId}/report`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!response.ok) {
    let message = 'Failed to download report.';
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
  link.download = `checklist-${recordId}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export function MoveInOutChecklist() {
  const [records, setRecords] = useState<MoveRecord[]>([]);
  const [hostels, setHostels] = useState<HostelOption[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'move_in' | 'move_out'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    hostelId: '',
    tenantName: '',
    roomLabel: '',
    type: 'move_in',
    date: '',
    status: 'pending',
    deposit: '',
    deductions: '',
    areasText: 'Door & Lock\nWalls & Paint\nWindows\nBed & Mattress\nBathroom',
  });

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [checklistData, hostelData] = await Promise.all([
        api.get<{ records: MoveRecord[] }>('/owners/checklists'),
        api.get<{ hostels: HostelOption[] }>('/owners/hostels'),
      ]);
      setRecords(checklistData.records || []);
      setHostels(hostelData.hostels || []);
      setForm((current) => ({ ...current, hostelId: current.hostelId || hostelData.hostels?.[0]?._id || '' }));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load checklists.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filtered = useMemo(() => activeTab === 'all' ? records : records.filter((record) => record.type === activeTab), [activeTab, records]);

  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const items = form.areasText
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .map((area) => ({ area, condition: 'good', photoTaken: false }));

      await api.post('/owners/checklists', {
        hostelId: form.hostelId,
        tenantName: form.tenantName,
        roomLabel: form.roomLabel,
        type: form.type,
        date: form.date,
        status: form.status,
        deposit: Number(form.deposit || 0),
        deductions: Number(form.deductions || 0),
        items,
      });
      setShowForm(false);
      setForm({
        hostelId: hostels[0]?._id || '',
        tenantName: '',
        roomLabel: '',
        type: 'move_in',
        date: '',
        status: 'pending',
        deposit: '',
        deductions: '',
        areasText: 'Door & Lock\nWalls & Paint\nWindows\nBed & Mattress\nBathroom',
      });
      await loadData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create checklist.');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusUpdate = async (recordId: string, status: ChecklistStatus) => {
    try {
      await api.put(`/owners/checklists/${recordId}`, { status });
      await loadData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to update checklist.');
    }
  };

  const stats = {
    total: records.length,
    moveIn: records.filter((record) => record.type === 'move_in').length,
    moveOut: records.filter((record) => record.type === 'move_out').length,
    disputes: records.filter((record) => record.status === 'disputed').length,
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-heading font-bold text-foreground">Move-in / Move-out Checklists</h1>
            <p className="mt-1 text-sm text-muted-foreground">Document room condition with persisted inspection records.</p>
          </div>
          <button onClick={() => setShowForm((current) => !current)} className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity">
            <ClipboardCheck size={18} />
            {showForm ? 'Hide Form' : 'New Checklist'}
          </button>
        </div>

        {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        {showForm && (
          <form onSubmit={handleCreate} className="grid grid-cols-1 gap-4 rounded-2xl border border-border bg-card p-5 shadow-card md:grid-cols-2">
            <select value={form.hostelId} onChange={(event) => setForm((current) => ({ ...current, hostelId: event.target.value }))} className="rounded-xl border border-input bg-background px-4 py-3 text-sm">
              {hostels.map((hostel) => <option key={hostel._id} value={hostel._id}>{hostel.name}</option>)}
            </select>
            <input value={form.tenantName} onChange={(event) => setForm((current) => ({ ...current, tenantName: event.target.value }))} placeholder="Tenant name" className="rounded-xl border border-input bg-background px-4 py-3 text-sm" />
            <input value={form.roomLabel} onChange={(event) => setForm((current) => ({ ...current, roomLabel: event.target.value }))} placeholder="Room label" className="rounded-xl border border-input bg-background px-4 py-3 text-sm" />
            <select value={form.type} onChange={(event) => setForm((current) => ({ ...current, type: event.target.value }))} className="rounded-xl border border-input bg-background px-4 py-3 text-sm">
              <option value="move_in">Move-in</option>
              <option value="move_out">Move-out</option>
            </select>
            <input type="date" value={form.date} onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))} className="rounded-xl border border-input bg-background px-4 py-3 text-sm" />
            <select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))} className="rounded-xl border border-input bg-background px-4 py-3 text-sm">
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="disputed">Disputed</option>
            </select>
            <input type="number" min="0" value={form.deposit} onChange={(event) => setForm((current) => ({ ...current, deposit: event.target.value }))} placeholder="Deposit" className="rounded-xl border border-input bg-background px-4 py-3 text-sm" />
            <input type="number" min="0" value={form.deductions} onChange={(event) => setForm((current) => ({ ...current, deductions: event.target.value }))} placeholder="Deductions" className="rounded-xl border border-input bg-background px-4 py-3 text-sm md:col-span-2" />
            <textarea value={form.areasText} onChange={(event) => setForm((current) => ({ ...current, areasText: event.target.value }))} rows={6} placeholder="One inspection area per line" className="rounded-xl border border-input bg-background px-4 py-3 text-sm md:col-span-2" />
            <button disabled={saving || hostels.length === 0} className="rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60 md:col-span-2">
              {saving ? 'Saving...' : 'Create Checklist'}
            </button>
          </form>
        )}

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: 'Total Records', value: stats.total, color: 'text-primary' },
            { label: 'Move-ins', value: stats.moveIn, color: 'text-emerald-600 dark:text-emerald-400' },
            { label: 'Move-outs', value: stats.moveOut, color: 'text-yellow-600 dark:text-yellow-400' },
            { label: 'Disputes', value: stats.disputes, color: 'text-red-600 dark:text-red-400' },
          ].map((item) => (
            <div key={item.label} className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground">{item.label}</p>
              <p className={`mt-1 text-2xl font-bold ${item.color}`}>{item.value}</p>
            </div>
          ))}
        </div>

        <div className="flex w-fit gap-1 rounded-xl bg-muted p-1">
          {[
            { key: 'all' as const, label: 'All Records' },
            { key: 'move_in' as const, label: 'Move-ins' },
            { key: 'move_out' as const, label: 'Move-outs' },
          ].map((tab) => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${activeTab === tab.key ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}>
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="py-16 text-center text-muted-foreground">Loading checklists...</div>
        ) : (
          <div className="space-y-3">
            {filtered.map((record) => (
              <div key={record._id} className="overflow-hidden rounded-xl border border-border bg-card">
                <button onClick={() => setExpandedId(expandedId === record._id ? null : record._id)} className="w-full p-5 text-left transition-colors hover:bg-secondary/20">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <div className="flex flex-1 items-center gap-3">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${record.type === 'move_in' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'}`}>
                        <ArrowRightLeft size={18} />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-semibold text-foreground">{record.tenantName}</span>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${record.type === 'move_in' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'}`}>
                            {record.type === 'move_in' ? 'Move-in' : 'Move-out'}
                          </span>
                          <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusStyles[record.status].bg} ${statusStyles[record.status].color}`}>
                            {statusStyles[record.status].icon} {statusStyles[record.status].label}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                          <span><MapPin size={10} className="inline" /> {record.hostelName || record.hostel?.name || 'Unknown hostel'} · Room {record.roomLabel}</span>
                          <span>{new Date(record.date).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Deposit: KES {Number(record.deposit || 0).toLocaleString()}</p>
                      {record.deductions > 0 && <p className="text-xs font-medium text-red-600 dark:text-red-400">Deductions: KES {Number(record.deductions || 0).toLocaleString()}</p>}
                    </div>
                  </div>
                </button>

                {expandedId === record._id && (
                  <div className="border-t border-border p-4">
                    {record.items.length > 0 ? (
                      <>
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                          {record.items.map((item, index) => (
                            <div key={`${record._id}-${index}`} className="flex items-center gap-3 rounded-lg bg-secondary/30 p-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium text-foreground">{item.area}</span>
                                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${conditionStyles[item.condition].bg} ${conditionStyles[item.condition].color}`}>{item.condition}</span>
                                </div>
                                {item.notes && <p className="mt-0.5 text-xs text-muted-foreground">{item.notes}</p>}
                              </div>
                              {item.photoTaken && <Camera size={14} className="shrink-0 text-primary" />}
                            </div>
                          ))}
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2">
                          <button onClick={() => void downloadChecklistReport(record._id)} className="flex items-center gap-1 rounded-lg bg-secondary px-4 py-2 text-xs font-semibold text-foreground">
                            <Download size={12} />
                            Download Report
                          </button>
                          {record.status === 'pending' && <button onClick={() => void handleStatusUpdate(record._id, 'completed')} className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground">Mark Completed</button>}
                          {record.status === 'disputed' && <button onClick={() => void handleStatusUpdate(record._id, 'completed')} className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground">Resolve Dispute</button>}
                        </div>
                      </>
                    ) : (
                      <div className="text-sm text-muted-foreground">No checklist items were recorded for this inspection.</div>
                    )}
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
