import { useState } from 'react';
import { DashboardLayout } from '../../components/layouts/DashboardLayout';
import { motion } from 'framer-motion';
import { FileText, Search, Calendar, User } from 'lucide-react';

const mockLogs = [
  { id: '1', action: 'Owner Approved', user: 'admin@smarthostel.ke', target: 'James Kamau (Owner)', timestamp: '2024-03-10 14:32:15', type: 'approval' },
  { id: '2', action: 'Hostel Deleted', user: 'admin@smarthostel.ke', target: 'Old Hostel XYZ', timestamp: '2024-03-10 13:45:00', type: 'deletion' },
  { id: '3', action: 'User Suspended', user: 'admin@smarthostel.ke', target: 'john.doe@student.com', timestamp: '2024-03-09 16:20:30', type: 'moderation' },
  { id: '4', action: 'Commission Rate Changed', user: 'admin@smarthostel.ke', target: '10% → 12%', timestamp: '2024-03-09 10:15:00', type: 'settings' },
  { id: '5', action: 'Announcement Published', user: 'admin@smarthostel.ke', target: 'System Maintenance Notice', timestamp: '2024-03-08 09:00:00', type: 'announcement' },
];

const typeColors: Record<string, string> = { approval: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400', deletion: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400', moderation: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400', settings: 'bg-primary/20 dark:bg-blue-900/30 text-primary dark:text-blue-400', announcement: 'bg-purple-100 dark:bg-purple-900/30 text-primary dark:text-purple-400' };

export function AuditLogs() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const types = ['all', ...new Set(mockLogs.map(l => l.type))];
  const filtered = mockLogs.filter(l => (typeFilter === 'all' || l.type === typeFilter) && (l.action.toLowerCase().includes(search.toLowerCase()) || l.target.toLowerCase().includes(search.toLowerCase())));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div><h1 className="text-2xl font-heading font-bold text-foreground">Audit Logs</h1><p className="text-muted-foreground text-sm mt-1">Track all administrative actions</p></div>
        <div className="bg-card rounded-2xl p-4 shadow-card border border-border flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search logs..." className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm" /></div>
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="py-2.5 px-4 rounded-xl border border-input bg-background text-foreground text-sm"><option value="all">All Types</option>{types.filter(t => t !== 'all').map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}</select>
        </div>
        <div className="bg-card rounded-2xl shadow-card border border-border overflow-hidden">
          <div className="divide-y divide-border">
            {filtered.map((log, i) => (
              <motion.div key={log.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }} className="p-4 flex items-center justify-between hover:bg-secondary/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${typeColors[log.type] || 'bg-secondary'}`}><FileText size={16} /></div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{log.action}</p>
                    <p className="text-xs text-muted-foreground">{log.target}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end"><User size={11} />{log.user}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end mt-0.5"><Calendar size={11} />{log.timestamp}</p>
                </div>
              </motion.div>
            ))}
          </div>
          {filtered.length === 0 && <div className="py-16 text-center"><FileText size={40} className="text-muted-foreground mx-auto mb-3" /><p className="text-muted-foreground">No logs found</p></div>}
        </div>
      </div>
    </DashboardLayout>
  );
}
