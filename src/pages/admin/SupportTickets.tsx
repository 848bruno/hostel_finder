import { useState } from 'react';
import { DashboardLayout } from '../../components/layouts/DashboardLayout';
import { motion } from 'framer-motion';
import { Headphones, Search, Clock, MessageCircle, User } from 'lucide-react';

const mockTickets = [
  { id: 'T001', subject: 'Cannot complete M-Pesa payment', user: 'brian.o@student.com', role: 'Student', status: 'open' as const, priority: 'high' as const, date: '2024-03-10', replies: 2 },
  { id: 'T002', subject: 'Hostel listing not showing on search', user: 'james@owner.com', role: 'Owner', status: 'in_progress' as const, priority: 'medium' as const, date: '2024-03-09', replies: 5 },
  { id: 'T003', subject: 'How to update room pricing?', user: 'mary@owner.com', role: 'Owner', status: 'resolved' as const, priority: 'low' as const, date: '2024-03-07', replies: 3 },
  { id: 'T004', subject: 'Account verification stuck', user: 'peter@owner.com', role: 'Owner', status: 'open' as const, priority: 'high' as const, date: '2024-03-10', replies: 0 },
];

const statusStyles = { open: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400', in_progress: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400', resolved: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' };
const statusLabels = { open: 'Open', in_progress: 'In Progress', resolved: 'Resolved' };
const priorityStyles = { high: 'text-red-600 dark:text-red-400', medium: 'text-yellow-600 dark:text-yellow-400', low: 'text-muted-foreground' };

export function SupportTickets() {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const filtered = mockTickets.filter(t => (filter === 'all' || t.status === filter) && (t.subject.toLowerCase().includes(search.toLowerCase()) || t.user.toLowerCase().includes(search.toLowerCase())));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div><h1 className="text-2xl font-heading font-bold text-foreground">Support Tickets</h1><p className="text-muted-foreground text-sm mt-1">Manage user support requests</p></div>
        <div className="grid grid-cols-3 gap-4">
          {[{ label: 'Open', value: mockTickets.filter(t => t.status === 'open').length, color: 'text-red-600 dark:text-red-400' }, { label: 'In Progress', value: mockTickets.filter(t => t.status === 'in_progress').length, color: 'text-yellow-600 dark:text-yellow-400' }, { label: 'Resolved', value: mockTickets.filter(t => t.status === 'resolved').length, color: 'text-green-600 dark:text-green-400' }].map(s => (
            <div key={s.label} className="p-4 rounded-xl bg-card border border-border"><p className="text-xs text-muted-foreground">{s.label}</p><p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p></div>
          ))}
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tickets..." className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-card border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none" /></div>
          <div className="flex gap-1 bg-muted p-1 rounded-xl">
            {[{ k: 'all', l: 'All' }, { k: 'open', l: 'Open' }, { k: 'in_progress', l: 'In Progress' }, { k: 'resolved', l: 'Resolved' }].map(f => (
              <button key={f.k} onClick={() => setFilter(f.k)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === f.k ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}>{f.l}</button>
            ))}
          </div>
        </div>
        <div className="space-y-3">
          {filtered.map((ticket, i) => (
            <motion.div key={ticket.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="bg-card rounded-2xl p-5 shadow-card border border-border">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-2"><span className="text-xs font-mono text-muted-foreground">{ticket.id}</span><span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusStyles[ticket.status]}`}>{statusLabels[ticket.status]}</span><span className={`text-xs font-semibold ${priorityStyles[ticket.priority]}`}>{ticket.priority}</span></div>
                <button className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 flex items-center gap-1"><MessageCircle size={13} />Reply</button>
              </div>
              <h3 className="text-sm font-semibold text-foreground mb-1">{ticket.subject}</h3>
              <div className="flex items-center gap-4 text-xs text-muted-foreground"><span className="flex items-center gap-1"><User size={11} />{ticket.user} ({ticket.role})</span><span className="flex items-center gap-1"><Clock size={11} />{ticket.date}</span><span className="flex items-center gap-1"><MessageCircle size={11} />{ticket.replies} replies</span></div>
            </motion.div>
          ))}
          {filtered.length === 0 && <div className="py-16 text-center"><Headphones size={40} className="text-muted-foreground mx-auto mb-3" /><p className="text-muted-foreground">No tickets found</p></div>}
        </div>
      </div>
    </DashboardLayout>
  );
}
