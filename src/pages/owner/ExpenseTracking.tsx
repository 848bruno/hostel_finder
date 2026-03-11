import { useState } from 'react';
import { DashboardLayout } from '../../components/layouts/DashboardLayout';
import { motion } from 'framer-motion';
import { DollarSign, Plus, Calendar } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RPieChart, Pie, Cell } from 'recharts';

// TODO: Replace with real API data
const mockExpenses = [
  { id: 'E001', category: 'Utilities', description: 'KPLC Electricity bill', amount: 18500, date: '2024-03-05', hostel: 'KU Gate Hostel' },
  { id: 'E002', category: 'Maintenance', description: 'Plumbing repairs - Room 12A', amount: 4500, date: '2024-03-04', hostel: 'KU Gate Hostel' },
  { id: 'E003', category: 'Utilities', description: 'Nairobi Water Company', amount: 12800, date: '2024-03-03', hostel: 'Thika Road Apartments' },
  { id: 'E004', category: 'Staff', description: 'Security guard salary', amount: 25000, date: '2024-03-01', hostel: 'KU Gate Hostel' },
  { id: 'E005', category: 'Internet', description: 'Safaricom Fiber monthly', amount: 8000, date: '2024-03-01', hostel: 'KU Gate Hostel' },
  { id: 'E006', category: 'Cleaning', description: 'Monthly cleaning supplies', amount: 3500, date: '2024-03-02', hostel: 'Thika Road Apartments' },
];

const trendData = [
  { month: 'Oct', amount: 55000 }, { month: 'Nov', amount: 62000 }, { month: 'Dec', amount: 48000 },
  { month: 'Jan', amount: 71000 }, { month: 'Feb', amount: 65000 }, { month: 'Mar', amount: 72300 },
];

const categoryData = [
  { name: 'Utilities', value: 31300, color: 'hsl(220, 80%, 50%)' },
  { name: 'Staff', value: 25000, color: 'hsl(142, 71%, 40%)' },
  { name: 'Maintenance', value: 4500, color: 'hsl(38, 92%, 50%)' },
  { name: 'Internet', value: 8000, color: 'hsl(280, 60%, 50%)' },
  { name: 'Cleaning', value: 3500, color: 'hsl(0, 72%, 51%)' },
];

export function ExpenseTracking() {
  const [filter, setFilter] = useState('All');
  const categories = ['All', ...new Set(mockExpenses.map(e => e.category))];
  const filtered = filter === 'All' ? mockExpenses : mockExpenses.filter(e => e.category === filter);
  const total = mockExpenses.reduce((s, e) => s + e.amount, 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-heading font-bold text-foreground">Expense Tracking</h1>
            <p className="text-muted-foreground text-sm mt-1">Monitor and manage your property expenses</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90">
            <Plus size={18} /> Add Expense
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-card rounded-2xl p-6 shadow-card border border-border">
            <h2 className="font-heading font-bold text-lg text-foreground mb-4">Monthly Expenses Trend</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs><linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(0, 72%, 51%)" stopOpacity={0.2} /><stop offset="95%" stopColor="hsl(0, 72%, 51%)" stopOpacity={0} /></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={{ borderRadius: '12px' }} formatter={(v) => [`KES ${Number(v).toLocaleString()}`, 'Expenses']} />
                  <Area type="monotone" dataKey="amount" stroke="hsl(0, 72%, 51%)" fill="url(#expGrad)" strokeWidth={2.5} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-card rounded-2xl p-6 shadow-card border border-border">
            <h2 className="font-heading font-bold text-lg text-foreground mb-4">By Category</h2>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <RPieChart><Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} innerRadius={45} strokeWidth={2}>{categoryData.map((e, i) => <Cell key={i} fill={e.color} />)}</Pie><Tooltip formatter={(v) => [`KES ${Number(v).toLocaleString()}`, 'Amount']} /></RPieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 mt-2">{categoryData.map(c => (
              <div key={c.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full" style={{ backgroundColor: c.color }} /><span className="text-muted-foreground">{c.name}</span></div>
                <span className="font-semibold text-foreground">KES {c.value.toLocaleString()}</span>
              </div>
            ))}</div>
          </div>
        </div>

        <div className="bg-card rounded-2xl shadow-card border border-border">
          <div className="p-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="font-heading font-bold text-lg text-foreground">Recent Expenses</h2>
            <div className="flex gap-1 bg-muted p-1 rounded-lg">{categories.map(c => (
              <button key={c} onClick={() => setFilter(c)} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${filter === c ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}>{c}</button>
            ))}</div>
          </div>
          <div className="divide-y divide-border">{filtered.map((exp, i) => (
            <motion.div key={exp.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }} className="p-4 flex items-center justify-between hover:bg-secondary/50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center"><DollarSign size={18} className="text-red-600 dark:text-red-400" /></div>
                <div>
                  <p className="text-sm font-medium text-foreground">{exp.description}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                    <span>{exp.hostel}</span><span>·</span><span className="flex items-center gap-1"><Calendar size={11} />{exp.date}</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-red-600 dark:text-red-400">-KES {exp.amount.toLocaleString()}</p>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-secondary text-secondary-foreground">{exp.category}</span>
              </div>
            </motion.div>
          ))}</div>
          <div className="p-4 border-t border-border flex justify-between">
            <span className="text-sm font-medium text-muted-foreground">Total This Month</span>
            <span className="text-sm font-bold text-foreground">KES {total.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
