import { DashboardLayout } from '../../components/layouts/DashboardLayout';
import { Percent, Save, DollarSign, Building2 } from 'lucide-react';

export function CommissionManagement() {
  const defaultRate = 10;
  const tiers = [
    { range: '1-5 hostels', rate: 10, owners: 45 },
    { range: '6-15 hostels', rate: 8, owners: 12 },
    { range: '16+ hostels', rate: 6, owners: 3 },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div><h1 className="text-2xl font-heading font-bold text-foreground">Commission Management</h1><p className="text-muted-foreground text-sm mt-1">Configure platform commission rates</p></div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'Default Rate', value: `${defaultRate}%`, icon: Percent, color: 'text-primary' },
            { label: 'Total Earned (Month)', value: 'KES 125,400', icon: DollarSign, color: 'text-green-600 dark:text-green-400' },
            { label: 'Active Owners', value: '60', icon: Building2, color: 'text-blue-600 dark:text-blue-400' },
          ].map(s => (
            <div key={s.label} className="bg-card rounded-2xl p-5 shadow-card border border-border">
              <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium mb-2"><s.icon size={14} />{s.label}</div>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
        <div className="bg-card rounded-2xl p-6 shadow-card border border-border">
          <h2 className="font-heading font-bold text-lg text-foreground mb-4">Commission Tiers</h2>
          <div className="space-y-4">
            {tiers.map(tier => (
              <div key={tier.range} className="flex items-center justify-between p-4 rounded-xl border border-border bg-secondary/30">
                <div><p className="text-sm font-semibold text-foreground">{tier.range}</p><p className="text-xs text-muted-foreground">{tier.owners} owners in this tier</p></div>
                <div className="flex items-center gap-3">
                  <input type="number" defaultValue={tier.rate} className="w-20 py-2 px-3 rounded-xl border border-input bg-background text-foreground text-sm text-center font-bold focus:outline-none focus:ring-2 focus:ring-ring" />
                  <span className="text-sm font-bold text-muted-foreground">%</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 flex justify-end"><button className="flex items-center gap-2 px-6 py-3 gradient-hero text-primary-foreground rounded-xl font-semibold text-sm hover:opacity-90"><Save size={16} />Save Rates</button></div>
        </div>
      </div>
    </DashboardLayout>
  );
}
