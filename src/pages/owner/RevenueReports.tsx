import { DashboardLayout } from '../../components/layouts/DashboardLayout';
import { Receipt, DollarSign, TrendingUp, TrendingDown, Download } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

// TODO: Replace with real API data
const monthlyRevenue = [
  { month: 'Sep', income: 182000, expenses: 42000 }, { month: 'Oct', income: 201600, expenses: 48000 },
  { month: 'Nov', income: 224000, expenses: 51000 }, { month: 'Dec', income: 210000, expenses: 45000 },
  { month: 'Jan', income: 238000, expenses: 52000 }, { month: 'Feb', income: 245000, expenses: 49000 },
  { month: 'Mar', income: 260000, expenses: 55000 }, { month: 'Apr', income: 275000, expenses: 58000 },
];

const hostelRevenue = [
  { name: 'KU Gate Hostel', revenue: 680000, color: 'hsl(220, 80%, 50%)' },
  { name: 'Thika Road Apartments', revenue: 420000, color: 'hsl(142, 71%, 40%)' },
  { name: 'Riverside Studios', revenue: 310000, color: 'hsl(38, 92%, 50%)' },
];

export function RevenueReports() {
  const totalIncome = monthlyRevenue.reduce((s, m) => s + m.income, 0);
  const totalExpenses = monthlyRevenue.reduce((s, m) => s + m.expenses, 0);
  const netProfit = totalIncome - totalExpenses;
  const profitMargin = ((netProfit / totalIncome) * 100).toFixed(1);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-heading font-bold text-foreground">Revenue Reports</h1>
            <p className="text-muted-foreground text-sm mt-1">Comprehensive financial overview of your properties</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-secondary text-secondary-foreground font-semibold text-sm hover:opacity-90">
            <Download size={18} /> Export Report
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Income', value: `KES ${(totalIncome/1e6).toFixed(1)}M`, icon: DollarSign, color: 'text-green-600 dark:text-green-400', trend: '+12.5%' },
            { label: 'Total Expenses', value: `KES ${(totalExpenses/1e6).toFixed(1)}M`, icon: TrendingDown, color: 'text-red-600 dark:text-red-400', trend: '+8.2%' },
            { label: 'Net Profit', value: `KES ${(netProfit/1e6).toFixed(1)}M`, icon: TrendingUp, color: 'text-primary', trend: '+15.3%' },
            { label: 'Profit Margin', value: `${profitMargin}%`, icon: Receipt, color: 'text-blue-600 dark:text-blue-400', trend: 'Healthy' },
          ].map(s => (
            <div key={s.label} className="p-4 rounded-xl bg-card border border-border">
              <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium mb-2"><s.icon size={14} />{s.label}</div>
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-green-600 dark:text-green-400 font-semibold mt-1">{s.trend}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-card rounded-2xl p-6 shadow-card border border-border">
            <h2 className="font-heading font-bold text-lg text-foreground mb-4">Income vs Expenses</h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyRevenue}>
                  <defs>
                    <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(142, 71%, 40%)" stopOpacity={0.2} /><stop offset="95%" stopColor="hsl(142, 71%, 40%)" stopOpacity={0} /></linearGradient>
                    <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(0, 72%, 51%)" stopOpacity={0.2} /><stop offset="95%" stopColor="hsl(0, 72%, 51%)" stopOpacity={0} /></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} /><YAxis tick={{ fontSize: 12 }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={{ borderRadius: '12px' }} formatter={(v, n) => [`KES ${Number(v).toLocaleString()}`, n === 'income' ? 'Income' : 'Expenses']} />
                  <Area type="monotone" dataKey="income" stroke="hsl(142, 71%, 40%)" fill="url(#incomeGrad)" strokeWidth={2.5} />
                  <Area type="monotone" dataKey="expenses" stroke="hsl(0, 72%, 51%)" fill="url(#expenseGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="flex gap-6 mt-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-green-600" />Income</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-red-500" />Expenses</span>
            </div>
          </div>

          <div className="bg-card rounded-2xl p-6 shadow-card border border-border">
            <h2 className="font-heading font-bold text-lg text-foreground mb-4">Revenue by Property</h2>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hostelRevenue} layout="vertical">
                  <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={100} />
                  <Tooltip formatter={(v) => [`KES ${Number(v).toLocaleString()}`, 'Revenue']} contentStyle={{ borderRadius: '12px', fontSize: '13px' }} />
                  <Bar dataKey="revenue" radius={[0, 6, 6, 0]}>{hostelRevenue.map((e, i) => <Cell key={i} fill={e.color} />)}</Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 mt-4">{hostelRevenue.map(h => (
              <div key={h.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full" style={{ backgroundColor: h.color }} /><span className="text-muted-foreground">{h.name}</span></div>
                <span className="font-semibold text-foreground">KES {h.revenue.toLocaleString()}</span>
              </div>
            ))}</div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
