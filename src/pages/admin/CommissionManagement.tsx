import { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layouts/DashboardLayout';
import { ApiError, api } from '../../lib/api';
import { Building2, DollarSign, Percent, Save } from 'lucide-react';

interface CommissionTier {
  rangeLabel: string;
  minHostels: number;
  maxHostels: number | null;
  rate: number;
  owners: number;
}

interface CommissionResponse {
  defaultRate: number;
  tiers: CommissionTier[];
  summary: {
    totalEarned: number;
    activeOwners: number;
  };
}

export function CommissionManagement() {
  const [data, setData] = useState<CommissionResponse>({ defaultRate: 10, tiers: [], summary: { totalEarned: 0, activeOwners: 0 } });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await api.get<CommissionResponse>('/admin/commissions');
      setData(result);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load commissions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const saveConfig = async () => {
    setSaving(true);
    setError('');
    try {
      await api.put('/admin/commissions', {
        defaultRate: data.defaultRate,
        tiers: data.tiers.map((tier) => ({
          rangeLabel: tier.rangeLabel,
          minHostels: tier.minHostels,
          maxHostels: tier.maxHostels,
          rate: tier.rate,
        })),
      });
      await loadData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save commission config.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Commission Management</h1>
          <p className="mt-1 text-sm text-muted-foreground">Configure platform commission rates from live payment data.</p>
        </div>

        {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { label: 'Default Rate', value: `${data.defaultRate}%`, icon: Percent, color: 'text-primary' },
            { label: 'Total Earned (Month)', value: `KES ${Math.round(data.summary.totalEarned).toLocaleString()}`, icon: DollarSign, color: 'text-green-600 dark:text-green-400' },
            { label: 'Active Owners', value: data.summary.activeOwners, icon: Building2, color: 'text-primary dark:text-blue-400' },
          ].map((item) => (
            <div key={item.label} className="rounded-2xl border border-border bg-card p-5 shadow-card">
              <div className="mb-2 flex items-center gap-2 text-xs font-medium text-muted-foreground"><item.icon size={14} />{item.label}</div>
              <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium text-foreground">Default Rate (%)</label>
            <input type="number" min="0" value={data.defaultRate} onChange={(event) => setData((current) => ({ ...current, defaultRate: Number(event.target.value) }))} className="w-32 rounded-xl border border-input bg-background px-4 py-2.5 text-sm" />
          </div>

          <h2 className="mb-4 text-lg font-bold text-foreground">Commission Tiers</h2>
          <div className="space-y-4">
            {data.tiers.map((tier, index) => (
              <div key={tier.rangeLabel} className="flex items-center justify-between rounded-xl border border-border bg-secondary/30 p-4">
                <div>
                  <p className="text-sm font-semibold text-foreground">{tier.rangeLabel}</p>
                  <p className="text-xs text-muted-foreground">{tier.owners} owners in this tier</p>
                </div>
                <div className="flex items-center gap-3">
                  <input type="number" min="0" value={tier.rate} onChange={(event) => setData((current) => ({
                    ...current,
                    tiers: current.tiers.map((item, itemIndex) => itemIndex === index ? { ...item, rate: Number(event.target.value) } : item),
                  }))} className="w-20 rounded-xl border border-input bg-background px-3 py-2 text-center text-sm font-bold" />
                  <span className="text-sm font-bold text-muted-foreground">%</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 flex justify-end">
            <button onClick={() => void saveConfig()} disabled={saving || loading} className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60">
              <Save size={16} />
              Save Rates
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
