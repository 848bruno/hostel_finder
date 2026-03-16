import { useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '../../components/layouts/DashboardLayout';
import { ApiError, api } from '../../lib/api';
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart as RPieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Calendar, DollarSign, Plus, Trash2 } from 'lucide-react';

interface HostelOption {
  _id: string;
  name: string;
}

interface Expense {
  _id: string;
  hostel?: { _id: string; name: string };
  hostelName?: string;
  category: string;
  description: string;
  amount: number;
  date: string;
}

interface ExpenseResponse {
  expenses: Expense[];
  total: number;
  trend: Array<{ month: string; amount: number }>;
  categories: Array<{ name: string; value: number }>;
}

const chartColors = ['hsl(220, 80%, 50%)', 'hsl(142, 71%, 40%)', 'hsl(38, 92%, 50%)', 'hsl(0, 72%, 51%)', 'hsl(280, 60%, 50%)'];

export function ExpenseTracking() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [hostels, setHostels] = useState<HostelOption[]>([]);
  const [trend, setTrend] = useState<ExpenseResponse['trend']>([]);
  const [categoryData, setCategoryData] = useState<ExpenseResponse['categories']>([]);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    hostelId: '',
    category: 'Utilities',
    description: '',
    amount: '',
    date: '',
  });

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [expenseData, hostelData] = await Promise.all([
        api.get<ExpenseResponse>('/owners/expenses'),
        api.get<{ hostels: HostelOption[] }>('/owners/hostels'),
      ]);
      setExpenses(expenseData.expenses);
      setTrend(expenseData.trend);
      setCategoryData(expenseData.categories);
      setTotal(expenseData.total);
      setHostels(hostelData.hostels || []);
      setForm((current) => ({ ...current, hostelId: current.hostelId || hostelData.hostels?.[0]?._id || '' }));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load expenses.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const categories = useMemo(() => ['All', ...new Set(expenses.map((expense) => expense.category))], [expenses]);
  const filtered = filter === 'All' ? expenses : expenses.filter((expense) => expense.category === filter);

  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.post('/owners/expenses', {
        ...form,
        amount: Number(form.amount),
      });
      setShowForm(false);
      setForm({
        hostelId: hostels[0]?._id || '',
        category: 'Utilities',
        description: '',
        amount: '',
        date: '',
      });
      await loadData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save expense.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (expenseId: string) => {
    try {
      await api.delete(`/owners/expenses/${expenseId}`);
      await loadData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to delete expense.');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-heading font-bold text-foreground">Expense Tracking</h1>
            <p className="mt-1 text-sm text-muted-foreground">Monitor and manage your property expenses.</p>
          </div>
          <button onClick={() => setShowForm((current) => !current)} className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90">
            <Plus size={18} />
            {showForm ? 'Hide Form' : 'Add Expense'}
          </button>
        </div>

        {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        {showForm && (
          <form onSubmit={handleCreate} className="grid grid-cols-1 gap-4 rounded-2xl border border-border bg-card p-5 shadow-card md:grid-cols-2">
            <select value={form.hostelId} onChange={(event) => setForm((current) => ({ ...current, hostelId: event.target.value }))} className="rounded-xl border border-input bg-background px-4 py-3 text-sm">
              {hostels.map((hostel) => <option key={hostel._id} value={hostel._id}>{hostel.name}</option>)}
            </select>
            <input value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))} placeholder="Category" className="rounded-xl border border-input bg-background px-4 py-3 text-sm" />
            <input value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} placeholder="Description" className="rounded-xl border border-input bg-background px-4 py-3 text-sm md:col-span-2" />
            <input type="number" min="0" value={form.amount} onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))} placeholder="Amount" className="rounded-xl border border-input bg-background px-4 py-3 text-sm" />
            <input type="date" value={form.date} onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))} className="rounded-xl border border-input bg-background px-4 py-3 text-sm" />
            <button disabled={saving || hostels.length === 0} className="rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60 md:col-span-2">
              {saving ? 'Saving...' : 'Save Expense'}
            </button>
          </form>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-card lg:col-span-2">
            <h2 className="mb-4 text-lg font-bold text-foreground">Monthly Expenses Trend</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trend}>
                  <defs>
                    <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(0, 72%, 51%)" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="hsl(0, 72%, 51%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={{ borderRadius: '12px' }} formatter={(value) => [`KES ${Number(value).toLocaleString()}`, 'Expenses']} />
                  <Area type="monotone" dataKey="amount" stroke="hsl(0, 72%, 51%)" fill="url(#expGrad)" strokeWidth={2.5} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <h2 className="mb-4 text-lg font-bold text-foreground">By Category</h2>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <RPieChart>
                  <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} innerRadius={45} strokeWidth={2}>
                    {categoryData.map((entry, index) => <Cell key={entry.name} fill={chartColors[index % chartColors.length]} />)}
                  </Pie>
                  <Tooltip formatter={(value) => [`KES ${Number(value).toLocaleString()}`, 'Amount']} />
                </RPieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 space-y-2">
              {categoryData.map((category, index) => (
                <div key={category.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: chartColors[index % chartColors.length] }} />
                    <span className="text-muted-foreground">{category.name}</span>
                  </div>
                  <span className="font-semibold text-foreground">KES {category.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card shadow-card">
          <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-bold text-foreground">Recent Expenses</h2>
            <div className="flex gap-1 rounded-lg bg-muted p-1">
              {categories.map((category) => (
                <button key={category} onClick={() => setFilter(category)} className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${filter === category ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}>
                  {category}
                </button>
              ))}
            </div>
          </div>
          {loading ? (
            <div className="py-16 text-center text-muted-foreground">Loading expenses...</div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground">No expenses found.</div>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map((expense) => (
                <div key={expense._id} className="flex items-center justify-between p-4 transition-colors hover:bg-secondary/50">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
                      <DollarSign size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{expense.description}</p>
                      <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{expense.hostelName || expense.hostel?.name || 'Unknown hostel'}</span>
                        <span>·</span>
                        <span className="flex items-center gap-1"><Calendar size={11} />{new Date(expense.date).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm font-bold text-red-600 dark:text-red-400">-KES {Number(expense.amount || 0).toLocaleString()}</p>
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] text-secondary-foreground">{expense.category}</span>
                    </div>
                    <button onClick={() => void handleDelete(expense._id)} className="rounded-lg border border-border p-2 text-muted-foreground hover:bg-secondary hover:text-foreground">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="flex justify-between border-t border-border p-4">
            <span className="text-sm font-medium text-muted-foreground">Total Recorded</span>
            <span className="text-sm font-bold text-foreground">KES {Number(total || 0).toLocaleString()}</span>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
