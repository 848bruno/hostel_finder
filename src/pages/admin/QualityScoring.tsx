import { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layouts/DashboardLayout';
import { ApiError, api } from '../../lib/api';
import { Award, Star, TrendingDown, TrendingUp } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface QualityScoreItem {
  name: string;
  score: number;
  trend: 'up' | 'stable' | 'down';
  reviews: number;
}

interface QualityResponse {
  scores: QualityScoreItem[];
  summary: {
    averageScore: number;
    topRated: string;
    belowThreshold: number;
  };
}

const getScoreColor = (score: number) => score >= 80 ? 'hsl(142, 71%, 40%)' : score >= 60 ? 'hsl(38, 92%, 50%)' : 'hsl(0, 72%, 51%)';

export function QualityScoring() {
  const [data, setData] = useState<QualityResponse>({ scores: [], summary: { averageScore: 0, topRated: 'N/A', belowThreshold: 0 } });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError('');
      try {
        const result = await api.get<QualityResponse>('/admin/quality-scores');
        setData(result);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Failed to load quality scores.');
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Quality Scoring</h1>
          <p className="mt-1 text-sm text-muted-foreground">Monitor hostel quality across the platform.</p>
        </div>

        {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { label: 'Avg Score', value: data.summary.averageScore, icon: Star, color: 'text-yellow-600 dark:text-yellow-400' },
            { label: 'Top Rated', value: data.summary.topRated, icon: Award, color: 'text-green-600 dark:text-green-400' },
            { label: 'Below Threshold', value: data.summary.belowThreshold, icon: TrendingDown, color: 'text-red-600 dark:text-red-400' },
          ].map((item) => (
            <div key={item.label} className="rounded-xl border border-border bg-card p-4">
              <div className="mb-2 flex items-center gap-2 text-xs font-medium text-muted-foreground"><item.icon size={14} />{item.label}</div>
              <p className={`text-xl font-bold ${item.color}`}>{item.value}</p>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
          <h2 className="mb-4 text-lg font-bold text-foreground">Quality Scores</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.scores}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius: '12px' }} />
                <Bar dataKey="score" radius={[6, 6, 0, 0]}>
                  {data.scores.map((hostel) => <Cell key={hostel.name} fill={getScoreColor(hostel.score)} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
          {loading ? (
            <div className="py-16 text-center text-muted-foreground">Loading quality scores...</div>
          ) : (
            <div className="divide-y divide-border">
              {data.scores.map((hostel, index) => (
                <div key={hostel.name} className="flex items-center justify-between p-4 transition-colors hover:bg-secondary/50">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-sm font-bold text-foreground">#{index + 1}</div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{hostel.name}</p>
                      <p className="text-xs text-muted-foreground">{hostel.reviews} reviews</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {hostel.trend === 'up' ? <TrendingUp size={16} className="text-green-600" /> : hostel.trend === 'down' ? <TrendingDown size={16} className="text-red-500" /> : <Star size={16} className="text-yellow-500" />}
                    <div className="h-2 w-24 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full" style={{ width: `${hostel.score}%`, backgroundColor: getScoreColor(hostel.score) }} />
                    </div>
                    <span className="w-8 text-right text-sm font-bold" style={{ color: getScoreColor(hostel.score) }}>{hostel.score}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
