import { useState } from 'react';
import { DashboardLayout } from '../../components/layouts/DashboardLayout';
import { motion } from 'framer-motion';
import { Eye } from 'lucide-react';

const mockComplaints = [
  { id: 'CP001', subject: 'Hostel not as described', student: 'Brian Ochieng', owner: 'James Kamau', hostel: 'KU Gate Hostel', status: 'open' as const, priority: 'high' as const, date: '2024-03-10' },
  { id: 'CP002', subject: 'Rent overcharge dispute', student: 'Faith Wanjiku', owner: 'Mary Nyambura', hostel: 'Thika Road Apartments', status: 'investigating' as const, priority: 'medium' as const, date: '2024-03-08' },
  { id: 'CP003', subject: 'Security deposit not refunded', student: 'Kevin Mutua', owner: 'James Kamau', hostel: 'KU Gate Hostel', status: 'resolved' as const, priority: 'low' as const, date: '2024-03-05' },
];

const statusStyles = { open: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400', investigating: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400', resolved: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' };

export function ComplaintsDisputes() {
  const [filter, setFilter] = useState('all');
  const filtered = filter === 'all' ? mockComplaints : mockComplaints.filter(c => c.status === filter);
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div><h1 className="text-2xl font-heading font-bold text-foreground">Complaints & Disputes</h1><p className="text-muted-foreground text-sm mt-1">Manage user complaints and resolve disputes</p></div>
        <div className="grid grid-cols-3 gap-4">
          {[{ label: 'Open', count: mockComplaints.filter(c => c.status === 'open').length, color: 'text-red-600 dark:text-red-400' }, { label: 'Investigating', count: mockComplaints.filter(c => c.status === 'investigating').length, color: 'text-yellow-600 dark:text-yellow-400' }, { label: 'Resolved', count: mockComplaints.filter(c => c.status === 'resolved').length, color: 'text-green-600 dark:text-green-400' }].map(s => (
            <div key={s.label} className="p-4 rounded-xl bg-card border border-border"><p className="text-xs text-muted-foreground">{s.label}</p><p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.count}</p></div>
          ))}
        </div>
        <div className="flex gap-1 bg-muted p-1 rounded-xl w-fit">
          {['all', 'open', 'investigating', 'resolved'].map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${filter === f ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}>{f}</button>
          ))}
        </div>
        <div className="space-y-3">
          {filtered.map((complaint, i) => (
            <motion.div key={complaint.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="bg-card rounded-2xl p-5 shadow-card border border-border">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                <div>
                  <div className="flex items-center gap-2 mb-1"><span className="text-xs font-mono text-muted-foreground">{complaint.id}</span><span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusStyles[complaint.status]}`}>{complaint.status.charAt(0).toUpperCase() + complaint.status.slice(1)}</span></div>
                  <h3 className="font-heading font-bold text-foreground">{complaint.subject}</h3>
                </div>
                <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90"><Eye size={14} />View Details</button>
              </div>
              <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                <span>Student: <span className="font-medium text-foreground">{complaint.student}</span></span>
                <span>Owner: <span className="font-medium text-foreground">{complaint.owner}</span></span>
                <span>Property: <span className="font-medium text-foreground">{complaint.hostel}</span></span>
                <span>{complaint.date}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
