import { useState } from 'react';
import { DashboardLayout } from '../../components/layouts/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { ClipboardCheck, Camera, CheckCircle2, AlertTriangle, Clock, ArrowRightLeft, Calendar, MapPin, Download } from 'lucide-react';

type ChecklistStatus = 'pending' | 'completed' | 'disputed';

interface ChecklistItem {
  area: string;
  condition: 'good' | 'fair' | 'damaged' | 'missing';
  notes?: string;
  photoTaken: boolean;
}

interface MoveRecord {
  id: string;
  tenant: string;
  hostel: string;
  room: string;
  type: 'move_in' | 'move_out';
  date: string;
  status: ChecklistStatus;
  deposit: number;
  deductions: number;
  items: ChecklistItem[];
}

// TODO: Replace with real API data
const mockRecords: MoveRecord[] = [
  {
    id: 'MV001', tenant: 'Brian Ochieng', hostel: 'KU Gate Hostel', room: '12A', type: 'move_in', date: '2024-01-15', status: 'completed', deposit: 8500, deductions: 0,
    items: [
      { area: 'Door & Lock', condition: 'good', photoTaken: true },
      { area: 'Walls & Paint', condition: 'good', photoTaken: true },
      { area: 'Windows', condition: 'good', photoTaken: true },
      { area: 'Bed & Mattress', condition: 'good', photoTaken: true },
      { area: 'Wardrobe', condition: 'fair', notes: 'Minor scratch on door', photoTaken: true },
      { area: 'Bathroom', condition: 'good', photoTaken: true },
      { area: 'Electrical Fittings', condition: 'good', photoTaken: true },
    ]
  },
  {
    id: 'MV002', tenant: 'Kevin Mutua', hostel: 'KU Gate Hostel', room: '8C', type: 'move_out', date: '2024-03-01', status: 'disputed', deposit: 7500, deductions: 3500,
    items: [
      { area: 'Door & Lock', condition: 'good', photoTaken: true },
      { area: 'Walls & Paint', condition: 'damaged', notes: 'Large stain on east wall, needs repainting', photoTaken: true },
      { area: 'Windows', condition: 'fair', notes: 'Curtain rail bent', photoTaken: true },
      { area: 'Bed & Mattress', condition: 'damaged', notes: 'Mattress torn, needs replacement', photoTaken: true },
      { area: 'Wardrobe', condition: 'good', photoTaken: true },
      { area: 'Bathroom', condition: 'fair', notes: 'Shower head cracked', photoTaken: true },
      { area: 'Electrical Fittings', condition: 'good', photoTaken: true },
    ]
  },
  {
    id: 'MV003', tenant: 'Mercy Akinyi', hostel: 'Riverside Studios', room: '3A', type: 'move_in', date: '2024-01-01', status: 'completed', deposit: 15000, deductions: 0,
    items: [
      { area: 'Door & Lock', condition: 'good', photoTaken: true },
      { area: 'Walls & Paint', condition: 'good', photoTaken: true },
      { area: 'Kitchen', condition: 'good', photoTaken: true },
      { area: 'Bathroom', condition: 'good', photoTaken: true },
      { area: 'Appliances', condition: 'good', photoTaken: true },
    ]
  },
  {
    id: 'MV004', tenant: 'Faith Wanjiku', hostel: 'Thika Road Apartments', room: '5B', type: 'move_out', date: '2024-03-15', status: 'pending', deposit: 12000, deductions: 0,
    items: []
  },
];

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

export function MoveInOutChecklist() {
  const [activeTab, setActiveTab] = useState<'all' | 'move_in' | 'move_out'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = activeTab === 'all' ? mockRecords : mockRecords.filter(r => r.type === activeTab);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-heading font-bold text-foreground">Move-in / Move-out Checklists</h1>
            <p className="text-muted-foreground text-sm mt-1">Document room condition with photos to handle deposit disputes</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity">
            <ClipboardCheck size={18} /> New Checklist
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Records', value: mockRecords.length, color: 'text-primary' },
            { label: 'Move-ins', value: mockRecords.filter(r => r.type === 'move_in').length, color: 'text-emerald-600 dark:text-emerald-400' },
            { label: 'Move-outs', value: mockRecords.filter(r => r.type === 'move_out').length, color: 'text-yellow-600 dark:text-yellow-400' },
            { label: 'Disputes', value: mockRecords.filter(r => r.status === 'disputed').length, color: 'text-red-600 dark:text-red-400' },
          ].map(s => (
            <div key={s.label} className="p-4 rounded-xl bg-card border border-border">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-muted p-1 rounded-xl w-fit">
          {[
            { key: 'all' as const, label: 'All Records' },
            { key: 'move_in' as const, label: 'Move-ins' },
            { key: 'move_out' as const, label: 'Move-outs' },
          ].map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === t.key ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Records */}
        <div className="space-y-3">
          {filtered.map((record, i) => (
            <motion.div key={record.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="rounded-xl bg-card border border-border overflow-hidden">
              <button onClick={() => setExpandedId(expandedId === record.id ? null : record.id)} className="w-full p-5 text-left hover:bg-secondary/20 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex items-center gap-3 flex-1">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${record.type === 'move_in' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'}`}>
                      <ArrowRightLeft size={18} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-foreground">{record.tenant}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${record.type === 'move_in' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'}`}>
                          {record.type === 'move_in' ? 'Move-in' : 'Move-out'}
                        </span>
                        <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusStyles[record.status].bg} ${statusStyles[record.status].color}`}>
                          {statusStyles[record.status].icon} {statusStyles[record.status].label}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                        <span><MapPin size={10} className="inline" /> {record.hostel} · Room {record.room}</span>
                        <span><Calendar size={10} className="inline" /> {record.date}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Deposit: KES {record.deposit.toLocaleString()}</p>
                    {record.deductions > 0 && <p className="text-xs text-red-600 dark:text-red-400 font-medium">Deductions: KES {record.deductions.toLocaleString()}</p>}
                  </div>
                </div>
              </button>

              <AnimatePresence>
                {expandedId === record.id && record.items.length > 0 && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-t border-border overflow-hidden">
                    <div className="p-4 space-y-2">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Room Condition Report</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {record.items.map((item, j) => (
                          <div key={j} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-foreground">{item.area}</span>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${conditionStyles[item.condition].bg} ${conditionStyles[item.condition].color}`}>{item.condition}</span>
                              </div>
                              {item.notes && <p className="text-xs text-muted-foreground mt-0.5">{item.notes}</p>}
                            </div>
                            {item.photoTaken && <Camera size={14} className="text-primary shrink-0" />}
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2 pt-2 flex-wrap">
                        <button className="px-4 py-2 rounded-lg bg-secondary text-foreground text-xs font-semibold flex items-center gap-1"><Download size={12} /> Download Report</button>
                        {record.status === 'disputed' && (
                          <>
                            <button className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold">Resolve Dispute</button>
                            <button className="px-4 py-2 rounded-lg bg-secondary text-foreground text-xs font-semibold">Compare Move-in Photos</button>
                          </>
                        )}
                        {record.status === 'pending' && (
                          <button className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold">Start Inspection</button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
