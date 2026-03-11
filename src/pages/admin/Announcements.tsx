import { useState } from 'react';
import { DashboardLayout } from '../../components/layouts/DashboardLayout';
import { motion } from 'framer-motion';
import { Plus, Send, Eye, Calendar, Users } from 'lucide-react';

const mockAnnouncements = [
  { id: '1', title: 'System Maintenance Scheduled', message: 'Platform will be down for maintenance on March 15, 2024 from 2:00 AM to 4:00 AM EAT.', audience: 'All Users', date: '2024-03-10', status: 'sent', views: 342 },
  { id: '2', title: 'New Payment Options Available', message: 'We now support Airtel Money in addition to M-Pesa for all transactions.', audience: 'Students', date: '2024-03-08', status: 'sent', views: 256 },
  { id: '3', title: 'Owner Verification Update', message: 'New KYC requirements for hostel owners effective April 1, 2024.', audience: 'Owners', date: '2024-03-05', status: 'draft', views: 0 },
];

export function Announcements() {
  const [showNew, setShowNew] = useState(false);
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div><h1 className="text-2xl font-heading font-bold text-foreground">Announcements</h1><p className="text-muted-foreground text-sm mt-1">Broadcast messages to platform users</p></div>
          <button onClick={() => setShowNew(!showNew)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90"><Plus size={18} />New Announcement</button>
        </div>
        {showNew && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-2xl p-6 shadow-card border border-border space-y-4">
            <input placeholder="Announcement title..." className="w-full py-3 px-4 rounded-xl border border-input bg-background text-foreground text-lg font-semibold placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
            <textarea rows={4} placeholder="Write your announcement..." className="w-full py-3 px-4 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
            <div className="flex items-center justify-between">
              <select className="py-2.5 px-4 rounded-xl border border-input bg-background text-foreground text-sm"><option>All Users</option><option>Students Only</option><option>Owners Only</option></select>
              <div className="flex gap-2">
                <button onClick={() => setShowNew(false)} className="px-4 py-2.5 rounded-xl border border-input text-foreground text-sm font-medium hover:bg-secondary">Cancel</button>
                <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90"><Send size={16} />Publish</button>
              </div>
            </div>
          </motion.div>
        )}
        <div className="space-y-4">
          {mockAnnouncements.map((ann, i) => (
            <motion.div key={ann.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="bg-card rounded-2xl p-5 shadow-card border border-border">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-heading font-bold text-foreground">{ann.title}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${ann.status === 'sent' ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400'}`}>{ann.status === 'sent' ? 'Published' : 'Draft'}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{ann.message}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Users size={12} />{ann.audience}</span>
                <span className="flex items-center gap-1"><Calendar size={12} />{ann.date}</span>
                <span className="flex items-center gap-1"><Eye size={12} />{ann.views} views</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
