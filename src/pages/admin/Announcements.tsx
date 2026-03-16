import { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layouts/DashboardLayout';
import { ApiError, api } from '../../lib/api';
import { Calendar, Eye, Plus, Save, Send, Users } from 'lucide-react';

interface Announcement {
  _id: string;
  title: string;
  message: string;
  audience: 'all' | 'students' | 'owners';
  status: 'draft' | 'sent';
  publishedAt?: string | null;
  createdAt: string;
  viewCount: number;
}

const audienceLabels = {
  all: 'All Users',
  students: 'Students',
  owners: 'Owners',
};

export function Announcements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: '',
    message: '',
    audience: 'all' as Announcement['audience'],
    status: 'draft' as Announcement['status'],
  });

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.get<{ announcements: Announcement[] }>('/admin/announcements');
      setAnnouncements(data.announcements || []);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load announcements.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setForm({ title: '', message: '', audience: 'all', status: 'draft' });
    setShowNew(false);
  };

  const handleSubmit = async (statusOverride?: Announcement['status']) => {
    if (!form.title.trim() || !form.message.trim()) {
      setError('Title and message are required.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const payload = { ...form, status: statusOverride || form.status };
      if (editingId) {
        await api.put(`/admin/announcements/${editingId}`, payload);
      } else {
        await api.post('/admin/announcements', payload);
      }
      await loadData();
      resetForm();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save announcement.');
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (announcement: Announcement) => {
    setEditingId(announcement._id);
    setForm({
      title: announcement.title,
      message: announcement.message,
      audience: announcement.audience,
      status: announcement.status,
    });
    setShowNew(true);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-heading font-bold text-foreground">Announcements</h1>
            <p className="mt-1 text-sm text-muted-foreground">Broadcast messages to platform users.</p>
          </div>
          <button onClick={() => {
            if (showNew) {
              resetForm();
            } else {
              setShowNew(true);
            }
          }} className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90">
            <Plus size={18} />
            {showNew ? 'Close Form' : 'New Announcement'}
          </button>
        </div>

        {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        {showNew && (
          <div className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-card">
            <input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} placeholder="Announcement title..." className="w-full rounded-xl border border-input bg-background px-4 py-3 text-lg font-semibold text-foreground" />
            <textarea value={form.message} onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))} rows={4} placeholder="Write your announcement..." className="w-full resize-none rounded-xl border border-input bg-background px-4 py-3 text-foreground" />
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <select value={form.audience} onChange={(event) => setForm((current) => ({ ...current, audience: event.target.value as Announcement['audience'] }))} className="rounded-xl border border-input bg-background px-4 py-2.5 text-sm">
                <option value="all">All Users</option>
                <option value="students">Students Only</option>
                <option value="owners">Owners Only</option>
              </select>
              <div className="flex gap-2">
                <button onClick={() => resetForm()} className="rounded-xl border border-input px-4 py-2.5 text-sm font-medium text-foreground hover:bg-secondary">Cancel</button>
                <button disabled={saving} onClick={() => void handleSubmit('draft')} className="flex items-center gap-2 rounded-xl border border-input px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-secondary disabled:opacity-60">
                  <Save size={16} />
                  Save Draft
                </button>
                <button disabled={saving} onClick={() => void handleSubmit('sent')} className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60">
                  <Send size={16} />
                  Publish
                </button>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="rounded-xl border border-border bg-card py-16 text-center text-muted-foreground">Loading announcements...</div>
        ) : announcements.length === 0 ? (
          <div className="rounded-xl border border-border bg-card py-16 text-center text-muted-foreground">No announcements found.</div>
        ) : (
          <div className="space-y-4">
            {announcements.map((announcement) => (
              <div key={announcement._id} className="rounded-2xl border border-border bg-card p-5 shadow-card">
                <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="mb-1 flex items-center gap-2">
                      <h3 className="font-heading font-bold text-foreground">{announcement.title}</h3>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${announcement.status === 'sent' ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' : 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400'}`}>
                        {announcement.status === 'sent' ? 'Published' : 'Draft'}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{announcement.message}</p>
                  </div>
                  <button onClick={() => startEdit(announcement)} className="rounded-lg border border-border px-3 py-2 text-xs font-medium text-foreground hover:bg-secondary">
                    Edit
                  </button>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Users size={12} />{audienceLabels[announcement.audience]}</span>
                  <span className="flex items-center gap-1"><Calendar size={12} />{new Date(announcement.publishedAt || announcement.createdAt).toLocaleDateString()}</span>
                  <span className="flex items-center gap-1"><Eye size={12} />{announcement.viewCount} views</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
