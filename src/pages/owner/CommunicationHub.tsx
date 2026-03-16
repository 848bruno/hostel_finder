import { useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '../../components/layouts/DashboardLayout';
import { ApiError, api } from '../../lib/api';
import { Mail, Phone, Search, Send } from 'lucide-react';

interface HostelOption {
  _id: string;
  name: string;
}

interface Message {
  _id: string;
  sender: 'owner' | 'tenant';
  text: string;
  createdAt: string;
}

interface Conversation {
  _id: string;
  tenantName: string;
  tenantPhone?: string;
  tenantEmail?: string;
  unreadCountOwner: number;
  lastMessage: string;
  lastMessageTime: string;
  hostel?: { _id: string; name: string };
  messages: Message[];
}

function formatRelative(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString();
}

export function CommunicationHub() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [hostels, setHostels] = useState<HostelOption[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    hostelId: '',
    tenantName: '',
    tenantPhone: '',
    tenantEmail: '',
    initialMessage: '',
  });

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [conversationData, hostelData] = await Promise.all([
        api.get<{ conversations: Conversation[] }>('/owners/conversations'),
        api.get<{ hostels: HostelOption[] }>('/owners/hostels'),
      ]);
      setConversations(conversationData.conversations || []);
      setHostels(hostelData.hostels || []);
      setSelectedConversationId((current) => current || conversationData.conversations?.[0]?._id || null);
      setForm((current) => ({ ...current, hostelId: current.hostelId || hostelData.hostels?.[0]?._id || '' }));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load conversations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filtered = useMemo(() => conversations.filter((conversation) => conversation.tenantName.toLowerCase().includes(search.toLowerCase())), [conversations, search]);
  const selectedConversation = conversations.find((conversation) => conversation._id === selectedConversationId) || null;

  useEffect(() => {
    if (!selectedConversation || selectedConversation.unreadCountOwner === 0) return;
    void api.put<{ conversation: Conversation }>(`/owners/conversations/${selectedConversation._id}/read`).then((result) => {
      setConversations((current) => current.map((conversation) => conversation._id === selectedConversation._id ? result.conversation : conversation));
    }).catch(() => {});
  }, [selectedConversation]);

  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const result = await api.post<{ conversation: Conversation }>('/owners/conversations', form);
      setConversations((current) => [result.conversation, ...current]);
      setSelectedConversationId(result.conversation._id);
      setShowForm(false);
      setForm({
        hostelId: hostels[0]?._id || '',
        tenantName: '',
        tenantPhone: '',
        tenantEmail: '',
        initialMessage: '',
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create conversation.');
    } finally {
      setSaving(false);
    }
  };

  const handleSendMessage = async () => {
    if (!selectedConversation || !message.trim()) return;
    try {
      const result = await api.post<{ conversation: Conversation }>(`/owners/conversations/${selectedConversation._id}/messages`, {
        text: message,
        sender: 'owner',
      });
      setConversations((current) => current.map((conversation) => conversation._id === selectedConversation._id ? result.conversation : conversation));
      setMessage('');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to send message.');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-heading font-bold text-foreground">Communication Hub</h1>
            <p className="mt-1 text-sm text-muted-foreground">Chat with your tenants using real stored conversations.</p>
          </div>
          <button onClick={() => setShowForm((current) => !current)} className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90">
            {showForm ? 'Hide Form' : 'New Conversation'}
          </button>
        </div>

        {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        {showForm && (
          <form onSubmit={handleCreate} className="grid grid-cols-1 gap-4 rounded-2xl border border-border bg-card p-5 shadow-card md:grid-cols-2">
            <select value={form.hostelId} onChange={(event) => setForm((current) => ({ ...current, hostelId: event.target.value }))} className="rounded-xl border border-input bg-background px-4 py-3 text-sm">
              <option value="">No hostel</option>
              {hostels.map((hostel) => <option key={hostel._id} value={hostel._id}>{hostel.name}</option>)}
            </select>
            <input value={form.tenantName} onChange={(event) => setForm((current) => ({ ...current, tenantName: event.target.value }))} placeholder="Tenant name" className="rounded-xl border border-input bg-background px-4 py-3 text-sm" />
            <input value={form.tenantPhone} onChange={(event) => setForm((current) => ({ ...current, tenantPhone: event.target.value }))} placeholder="Tenant phone" className="rounded-xl border border-input bg-background px-4 py-3 text-sm" />
            <input value={form.tenantEmail} onChange={(event) => setForm((current) => ({ ...current, tenantEmail: event.target.value }))} placeholder="Tenant email" className="rounded-xl border border-input bg-background px-4 py-3 text-sm" />
            <textarea value={form.initialMessage} onChange={(event) => setForm((current) => ({ ...current, initialMessage: event.target.value }))} placeholder="Initial tenant message" rows={4} className="rounded-xl border border-input bg-background px-4 py-3 text-sm md:col-span-2" />
            <button disabled={saving} className="rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60 md:col-span-2">
              {saving ? 'Saving...' : 'Create Conversation'}
            </button>
          </form>
        )}

        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card" style={{ height: 'calc(100vh - 240px)' }}>
          <div className="flex h-full">
            <div className="flex w-80 shrink-0 flex-col border-r border-border">
              <div className="border-b border-border p-3">
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search chats..." className="w-full rounded-lg bg-secondary py-2 pl-9 pr-4 text-sm text-foreground" />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                {loading ? (
                  <div className="p-4 text-sm text-muted-foreground">Loading conversations...</div>
                ) : filtered.length === 0 ? (
                  <div className="p-4 text-sm text-muted-foreground">No conversations found.</div>
                ) : filtered.map((conversation) => (
                  <button key={conversation._id} onClick={() => setSelectedConversationId(conversation._id)} className={`flex w-full items-start gap-3 p-3 text-left transition-colors hover:bg-secondary/50 ${selectedConversationId === conversation._id ? 'border-r-2 border-primary bg-primary/5' : ''}`}>
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground">{conversation.tenantName.charAt(0)}</div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-foreground">{conversation.tenantName}</span>
                        <span className="text-[10px] text-muted-foreground">{formatRelative(conversation.lastMessageTime)}</span>
                      </div>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">{conversation.lastMessage}</p>
                    </div>
                    {conversation.unreadCountOwner > 0 && <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">{conversation.unreadCountOwner}</span>}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-1 flex-col">
              {!selectedConversation ? (
                <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">Select a conversation to start messaging.</div>
              ) : (
                <>
                  <div className="flex items-center justify-between border-b border-border p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">{selectedConversation.tenantName.charAt(0)}</div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{selectedConversation.tenantName}</p>
                        <p className="text-xs text-muted-foreground">{selectedConversation.hostel?.name || 'No hostel linked'}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {selectedConversation.tenantPhone && <button onClick={() => window.open(`tel:${selectedConversation.tenantPhone}`)} className="rounded-lg p-2 hover:bg-secondary"><Phone size={16} className="text-muted-foreground" /></button>}
                      {selectedConversation.tenantEmail && <button onClick={() => window.open(`mailto:${selectedConversation.tenantEmail}`)} className="rounded-lg p-2 hover:bg-secondary"><Mail size={16} className="text-muted-foreground" /></button>}
                    </div>
                  </div>

                  <div className="flex-1 space-y-3 overflow-y-auto p-4">
                    {selectedConversation.messages.map((entry) => (
                      <div key={entry._id} className={`flex ${entry.sender === 'owner' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs rounded-2xl px-4 py-2.5 text-sm ${entry.sender === 'owner' ? 'rounded-tr-sm bg-primary text-primary-foreground' : 'rounded-tl-sm bg-secondary text-foreground'}`}>
                          <p>{entry.text}</p>
                          <p className={`mt-1 text-[10px] ${entry.sender === 'owner' ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>{formatRelative(entry.createdAt)}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-border p-3">
                    <div className="flex items-center gap-2">
                      <input value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Type a message..." className="flex-1 rounded-xl bg-secondary px-4 py-2.5 text-sm text-foreground" onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault();
                          void handleSendMessage();
                        }
                      }} />
                      <button onClick={() => void handleSendMessage()} className="rounded-xl bg-primary p-2.5 text-primary-foreground hover:opacity-90">
                        <Send size={18} />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
