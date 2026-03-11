import { useState } from 'react';
import { DashboardLayout } from '../../components/layouts/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { Wrench, AlertTriangle, CheckCircle2, Clock, Plus, Phone, MapPin, Calendar, Search, MessageCircle } from 'lucide-react';

// TODO: Replace with real API data when backend supports maintenance requests
type Priority = 'urgent' | 'high' | 'medium' | 'low';
type Status = 'open' | 'in_progress' | 'resolved';

interface MaintenanceRequest {
  id: string; tenant: string; phone: string; hostel: string; room: string;
  category: string; description: string; priority: Priority; status: Status;
  assignedTo?: string; created_at: string; resolved_at?: string;
}

const mockRequests: MaintenanceRequest[] = [
  { id: 'MR001', tenant: 'Brian Ochieng', phone: '+254712345678', hostel: 'KU Gate Hostel', room: 'Room 12A', category: 'Plumbing', description: 'Leaking tap in bathroom, water pooling on floor', priority: 'urgent', status: 'open', created_at: '2024-03-06' },
  { id: 'MR002', tenant: 'Faith Wanjiku', phone: '+254723456789', hostel: 'Thika Road Apartments', room: 'Room 5B', category: 'Electrical', description: 'Power socket not working near study desk', priority: 'high', status: 'in_progress', assignedTo: 'John Mwangi (Electrician)', created_at: '2024-03-04' },
  { id: 'MR003', tenant: 'Kevin Mutua', phone: '+254734567890', hostel: 'KU Gate Hostel', room: 'Room 8C', category: 'Furniture', description: 'Broken bed frame leg, bed unstable', priority: 'medium', status: 'in_progress', assignedTo: 'Peter Kamau (Carpenter)', created_at: '2024-03-03' },
  { id: 'MR004', tenant: 'Mercy Akinyi', phone: '+254745678901', hostel: 'Riverside Studios', room: 'Room 3A', category: 'Security', description: 'Door lock jammed, cannot lock room properly', priority: 'urgent', status: 'open', created_at: '2024-03-05' },
  { id: 'MR005', tenant: 'Samuel Kiprop', phone: '+254756789012', hostel: 'KU Gate Hostel', room: 'Room 15D', category: 'Plumbing', description: 'Toilet not flushing properly', priority: 'high', status: 'resolved', assignedTo: 'John Mwangi', created_at: '2024-02-28', resolved_at: '2024-03-01' },
];

const priorityConfig: Record<Priority, { color: string; bg: string; label: string }> = {
  urgent: { color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/30', label: 'Urgent' },
  high: { color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-100 dark:bg-orange-900/30', label: 'High' },
  medium: { color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-100 dark:bg-yellow-900/30', label: 'Medium' },
  low: { color: 'text-gray-600 dark:text-gray-400', bg: 'bg-gray-100 dark:bg-gray-900/30', label: 'Low' },
};

const statusConfig: Record<Status, { icon: React.ReactNode; color: string; label: string }> = {
  open: { icon: <AlertTriangle size={14} />, color: 'text-red-600 dark:text-red-400', label: 'Open' },
  in_progress: { icon: <Clock size={14} />, color: 'text-yellow-600 dark:text-yellow-400', label: 'In Progress' },
  resolved: { icon: <CheckCircle2 size={14} />, color: 'text-green-600 dark:text-green-400', label: 'Resolved' },
};

const categories = ['All', 'Plumbing', 'Electrical', 'Furniture', 'Security', 'Pest Control'];

export function Maintenance() {
  const [activeTab, setActiveTab] = useState<'all' | Status>('all');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = mockRequests.filter(r => {
    if (activeTab !== 'all' && r.status !== activeTab) return false;
    if (selectedCategory !== 'All' && r.category !== selectedCategory) return false;
    if (searchQuery && !r.description.toLowerCase().includes(searchQuery.toLowerCase()) && !r.tenant.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const stats = {
    open: mockRequests.filter(r => r.status === 'open').length,
    in_progress: mockRequests.filter(r => r.status === 'in_progress').length,
    resolved: mockRequests.filter(r => r.status === 'resolved').length,
    urgent: mockRequests.filter(r => r.priority === 'urgent' && r.status !== 'resolved').length,
  };

  const tabs: { key: 'all' | Status; label: string; count: number }[] = [
    { key: 'all', label: 'All Requests', count: mockRequests.length },
    { key: 'open', label: 'Open', count: stats.open },
    { key: 'in_progress', label: 'In Progress', count: stats.in_progress },
    { key: 'resolved', label: 'Resolved', count: stats.resolved },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-heading font-bold text-foreground">Maintenance Requests</h1>
            <p className="text-muted-foreground text-sm mt-1">Track and manage property maintenance issues</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90">
            <Plus size={18} /> Log Request
          </button>
        </div>

        {stats.urgent > 0 && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-xl bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 flex items-center gap-3">
            <AlertTriangle size={20} className="text-red-600 dark:text-red-400" />
            <p className="text-sm font-medium text-red-700 dark:text-red-300">{stats.urgent} urgent request{stats.urgent > 1 ? 's' : ''} need immediate attention</p>
          </motion.div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Open', value: stats.open, color: 'text-red-600 dark:text-red-400' },
            { label: 'In Progress', value: stats.in_progress, color: 'text-yellow-600 dark:text-yellow-400' },
            { label: 'Resolved', value: stats.resolved, color: 'text-green-600 dark:text-green-400' },
            { label: 'Avg Resolution', value: '2.3 days', color: 'text-primary' },
          ].map(s => (
            <div key={s.label} className="p-4 rounded-xl bg-card border border-border">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex gap-1 bg-muted p-1 rounded-xl overflow-x-auto">
            {tabs.map(t => (
              <button key={t.key} onClick={() => setActiveTab(t.key)} className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${activeTab === t.key ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
                {t.label} ({t.count})
              </button>
            ))}
          </div>
          <div className="flex gap-2 flex-1">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search requests..." className="w-full pl-9 pr-4 py-2 rounded-xl bg-card border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} className="px-3 py-2 rounded-xl bg-card border border-border text-sm text-foreground focus:outline-none">
              {categories.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {filtered.map((req, i) => (
              <motion.div key={req.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ delay: i * 0.05 }} className="p-4 sm:p-5 rounded-xl bg-card border border-border hover:shadow-md transition-shadow">
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono text-muted-foreground">{req.id}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${priorityConfig[req.priority].bg} ${priorityConfig[req.priority].color}`}>{priorityConfig[req.priority].label}</span>
                      <span className={`flex items-center gap-1 text-xs font-medium ${statusConfig[req.status].color}`}>{statusConfig[req.status].icon} {statusConfig[req.status].label}</span>
                      <span className="px-2 py-0.5 rounded-full text-xs bg-secondary text-secondary-foreground">{req.category}</span>
                    </div>
                    <p className="text-sm font-medium text-foreground">{req.description}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><MapPin size={12} />{req.hostel} · {req.room}</span>
                      <span className="flex items-center gap-1"><Calendar size={12} />{req.created_at}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Reported by: <span className="font-medium text-foreground">{req.tenant}</span></p>
                    {req.assignedTo && <p className="text-xs text-primary">Assigned to: {req.assignedTo}</p>}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => window.open(`tel:${req.phone}`)} className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:opacity-80" title="Call tenant"><Phone size={16} /></button>
                    <button className="p-2 rounded-lg bg-primary/10 text-primary hover:opacity-80" title="Message"><MessageCircle size={16} /></button>
                    {req.status === 'open' && <button className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90">Assign</button>}
                    {req.status === 'in_progress' && <button className="px-3 py-2 rounded-lg bg-green-600 text-white text-xs font-semibold hover:opacity-90">Resolve</button>}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {filtered.length === 0 && (
            <div className="py-16 text-center">
              <Wrench size={40} className="text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No maintenance requests found</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
