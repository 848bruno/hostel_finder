import { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layouts/DashboardLayout';
import { ApiError, api } from '../../lib/api';
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Building2, Eye, Megaphone, RefreshCw, Share2, TrendingUp, Users } from 'lucide-react';

interface MarketingResponse {
  totals: {
    vacancies: number;
    views: number;
    inquiries: number;
    conversionRate: number;
  };
  trafficSources: Array<{ source: string; views: number }>;
  vacancies: Array<{
    hostelId: string;
    hostel: string;
    type: string;
    price: number;
    availableRooms: number;
    daysVacant: number;
    sharesTotal: number;
    boostsTotal: number;
    lastBoostedAt?: string | null;
  }>;
}

const colors = ['hsl(220, 80%, 50%)', 'hsl(142, 71%, 40%)', 'hsl(38, 92%, 50%)', 'hsl(280, 60%, 50%)', 'hsl(0, 72%, 51%)'];

function formatDate(value?: string | null) {
  if (!value) return 'Never';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Never' : date.toLocaleDateString();
}

export function VacancyMarketing() {
  const [data, setData] = useState<MarketingResponse>({
    totals: { vacancies: 0, views: 0, inquiries: 0, conversionRate: 0 },
    trafficSources: [],
    vacancies: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await api.get<MarketingResponse>('/owners/marketing');
      setData(result);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load marketing data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleBoost = async (hostelId: string) => {
    try {
      await api.post(`/owners/marketing/${hostelId}/boost`);
      await loadData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to boost listing.');
    }
  };

  const handleShare = async (hostelId: string) => {
    try {
      await api.post(`/owners/marketing/${hostelId}/share`);
      await loadData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to record listing share.');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-heading font-bold text-foreground">Vacancy Marketing</h1>
            <p className="mt-1 text-sm text-muted-foreground">Promote vacancies and track listing performance.</p>
          </div>
          <button onClick={loadData} className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90">
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            { label: 'Total Vacancies', value: data.totals.vacancies, icon: Building2, color: 'text-primary' },
            { label: 'Total Views', value: data.totals.views, icon: Eye, color: 'text-green-600 dark:text-green-400' },
            { label: 'Inquiries', value: data.totals.inquiries, icon: Users, color: 'text-yellow-600 dark:text-yellow-400' },
            { label: 'Conversion Rate', value: `${data.totals.conversionRate}%`, icon: TrendingUp, color: 'text-primary dark:text-blue-400' },
          ].map((item) => (
            <div key={item.label} className="rounded-xl border border-border bg-card p-4">
              <div className="mb-2 flex items-center gap-2 text-xs font-medium text-muted-foreground"><item.icon size={14} />{item.label}</div>
              <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-foreground"><Megaphone size={18} className="text-primary" />Traffic Sources</h2>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.trafficSources} layout="vertical">
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="source" tick={{ fontSize: 11 }} width={90} />
                  <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '13px' }} />
                  <Bar dataKey="views" radius={[0, 6, 6, 0]}>
                    {data.trafficSources.map((entry, index) => <Cell key={entry.source} fill={colors[index % colors.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <h2 className="mb-4 text-lg font-bold text-foreground">Current Vacancies</h2>
            {loading ? (
              <div className="py-16 text-center text-muted-foreground">Loading vacancies...</div>
            ) : data.vacancies.length === 0 ? (
              <div className="py-16 text-center text-muted-foreground">No current vacancies to market.</div>
            ) : (
              <div className="space-y-3">
                {data.vacancies.map((vacancy) => (
                  <div key={vacancy.hostelId} className="rounded-xl bg-secondary/50 p-4 transition-colors hover:bg-secondary">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{vacancy.hostel}</p>
                        <p className="text-xs text-muted-foreground">{vacancy.availableRooms} room(s) available · {vacancy.type} · {vacancy.daysVacant} days vacant</p>
                        <p className="mt-1 text-xs text-muted-foreground">Last boosted: {formatDate(vacancy.lastBoostedAt)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-primary">KES {Number(vacancy.price || 0).toLocaleString()}/mo</p>
                        <p className="text-xs text-muted-foreground">{vacancy.boostsTotal} boosts · {vacancy.sharesTotal} shares</p>
                      </div>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <button onClick={() => void handleShare(vacancy.hostelId)} className="flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-xs font-medium text-foreground hover:bg-background">
                        <Share2 size={12} />
                        Share
                      </button>
                      <button onClick={() => void handleBoost(vacancy.hostelId)} className="flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90">
                        <Megaphone size={12} />
                        Boost
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
