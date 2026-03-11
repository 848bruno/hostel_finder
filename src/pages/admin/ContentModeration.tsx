import { useState } from 'react';
import { DashboardLayout } from '../../components/layouts/DashboardLayout';
import { motion } from 'framer-motion';
import { Flag, MessageSquare, Building2 } from 'lucide-react';

const mockContent = [
  { id: '1', type: 'listing', title: 'KU Gate Hostel', owner: 'James Kamau', reason: 'Misleading images', status: 'flagged' as const, date: '2024-03-10' },
  { id: '2', type: 'review', title: 'Review by Brian O.', owner: 'Student', reason: 'Inappropriate language', status: 'pending' as const, date: '2024-03-09' },
  { id: '3', type: 'listing', title: 'Riverside Studios', owner: 'Mary Nyambura', reason: 'Auto-flagged: suspicious pricing', status: 'approved' as const, date: '2024-03-07' },
];

const statusStyles = { flagged: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400', pending: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400', approved: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' };
const typeIcons = { listing: Building2, review: MessageSquare };

export function ContentModeration() {
  const [filter, setFilter] = useState('all');
  const filtered = filter === 'all' ? mockContent : mockContent.filter(c => c.status === filter);
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div><h1 className="text-2xl font-heading font-bold text-foreground">Content Moderation</h1><p className="text-muted-foreground text-sm mt-1">Review flagged content and maintain quality</p></div>
        <div className="grid grid-cols-3 gap-4">
          {[{ label: 'Flagged', count: mockContent.filter(c => c.status === 'flagged').length, color: 'text-red-600 dark:text-red-400' }, { label: 'Pending Review', count: mockContent.filter(c => c.status === 'pending').length, color: 'text-yellow-600 dark:text-yellow-400' }, { label: 'Approved', count: mockContent.filter(c => c.status === 'approved').length, color: 'text-green-600 dark:text-green-400' }].map(s => (
            <div key={s.label} className="p-4 rounded-xl bg-card border border-border"><p className="text-xs text-muted-foreground">{s.label}</p><p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.count}</p></div>
          ))}
        </div>
        <div className="flex gap-1 bg-muted p-1 rounded-xl w-fit">
          {['all', 'flagged', 'pending', 'approved'].map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${filter === f ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}>{f}</button>
          ))}
        </div>
        <div className="space-y-3">
          {filtered.map((item, i) => {
            const Icon = typeIcons[item.type as keyof typeof typeIcons] || Flag;
            return (
              <motion.div key={item.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="bg-card rounded-2xl p-5 shadow-card border border-border flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center shrink-0"><Icon size={18} className="text-muted-foreground" /></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5"><h3 className="text-sm font-semibold text-foreground">{item.title}</h3><span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusStyles[item.status]}`}>{item.status.charAt(0).toUpperCase() + item.status.slice(1)}</span></div>
                  <p className="text-xs text-muted-foreground">{item.reason} · by {item.owner} · {item.date}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  {item.status !== 'approved' && <button className="px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-semibold hover:opacity-90">Approve</button>}
                  {item.status !== 'approved' && <button className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold hover:opacity-90">Remove</button>}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}
