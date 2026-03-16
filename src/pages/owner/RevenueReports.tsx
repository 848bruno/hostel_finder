import { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layouts/DashboardLayout';
import { ApiError, getToken, api } from '../../lib/api';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { DollarSign, Download, Receipt, TrendingDown, TrendingUp } from 'lucide-react';

interface RevenueResponse {
  monthlyRevenue: Array<{ month: string; income: number; expenses: number }>;
  hostelRevenue: Array<{ name: string; revenue: number }>;
  totals: {
    income: number;
    expenses: number;
    netProfit: number;
    profitMargin: number;
  };
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5100/api';
const colors = ['hsl(220, 80%, 50%)', 'hsl(142, 71%, 40%)', 'hsl(38, 92%, 50%)', 'hsl(280, 60%, 50%)', 'hsl(0, 72%, 51%)'];

async function downloadRevenueExport() {
  const token = getToken();
  const response = await fetch(`${API_BASE_URL}/owners/revenue-report/export`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!response.ok) {
    let message = 'Failed to export report.';
    try {
      const data = await response.json();
      message = data.message || message;
    } catch {
      // ignore invalid json
    }
    throw new ApiError(response.status, message);
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'owner-revenue-report.csv';
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export function RevenueReports() {
  const [data, setData] = useState<RevenueResponse>({
    monthlyRevenue: [],
    hostelRevenue: [],
    totals: {
      income: 0,
      expenses: 0,
      netProfit: 0,
      profitMargin: 0,
    },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await api.get<RevenueResponse>('/owners/revenue-report');
      setData(result);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load revenue report.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const exportReport = async () => {
    try {
      await downloadRevenueExport();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to export report.');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-heading font-bold text-foreground">Revenue Reports</h1>
            <p className="mt-1 text-sm text-muted-foreground">Financial overview built from real bookings and recorded expenses.</p>
          </div>
          <button onClick={() => void exportReport()} className="flex items-center gap-2 rounded-xl bg-secondary px-4 py-2.5 text-sm font-semibold text-secondary-foreground hover:opacity-90">
            <Download size={18} />
            Export Report
          </button>
        </div>

        {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Total Income', value: `KES ${(data.totals.income / 1e6).toFixed(1)}M`, icon: DollarSign, color: 'text-green-600 dark:text-green-400' },
            { label: 'Total Expenses', value: `KES ${(data.totals.expenses / 1e6).toFixed(1)}M`, icon: TrendingDown, color: 'text-red-600 dark:text-red-400' },
            { label: 'Net Profit', value: `KES ${(data.totals.netProfit / 1e6).toFixed(1)}M`, icon: TrendingUp, color: 'text-primary' },
            { label: 'Profit Margin', value: `${data.totals.profitMargin}%`, icon: Receipt, color: 'text-primary dark:text-blue-400' },
          ].map((item) => (
            <div key={item.label} className="rounded-xl border border-border bg-card p-4">
              <div className="mb-2 flex items-center gap-2 text-xs font-medium text-muted-foreground"><item.icon size={14} />{item.label}</div>
              <p className={`text-xl font-bold ${item.color}`}>{item.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-card lg:col-span-2">
            <h2 className="mb-4 text-lg font-bold text-foreground">Income vs Expenses</h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.monthlyRevenue}>
                  <defs>
                    <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(142, 71%, 40%)" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="hsl(142, 71%, 40%)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(0, 72%, 51%)" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="hsl(0, 72%, 51%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={{ borderRadius: '12px' }} formatter={(value, name) => [`KES ${Number(value).toLocaleString()}`, name === 'income' ? 'Income' : 'Expenses']} />
                  <Area type="monotone" dataKey="income" stroke="hsl(142, 71%, 40%)" fill="url(#incomeGrad)" strokeWidth={2.5} />
                  <Area type="monotone" dataKey="expenses" stroke="hsl(0, 72%, 51%)" fill="url(#expenseGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <h2 className="mb-4 text-lg font-bold text-foreground">Revenue by Property</h2>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.hostelRevenue} layout="vertical">
                  <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={100} />
                  <Tooltip formatter={(value) => [`KES ${Number(value).toLocaleString()}`, 'Revenue']} contentStyle={{ borderRadius: '12px', fontSize: '13px' }} />
                  <Bar dataKey="revenue" radius={[0, 6, 6, 0]}>
                    {data.hostelRevenue.map((entry, index) => <Cell key={entry.name} fill={colors[index % colors.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-2">
              {data.hostelRevenue.map((hostel, index) => (
                <div key={hostel.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: colors[index % colors.length] }} />
                    <span className="text-muted-foreground">{hostel.name}</span>
                  </div>
                  <span className="font-semibold text-foreground">KES {hostel.revenue.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {loading && <div className="rounded-xl border border-border bg-card py-10 text-center text-muted-foreground">Loading revenue report...</div>}
      </div>
    </DashboardLayout>
  );
}
