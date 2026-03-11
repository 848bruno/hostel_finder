import { DashboardLayout } from '../../components/layouts/DashboardLayout';
import { motion } from 'framer-motion';
import { Activity, Server, Database, Wifi, HardDrive, Cpu, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const uptimeData = Array.from({ length: 24 }, (_, i) => ({ hour: `${i}:00`, uptime: 99.5 + Math.random() * 0.5 }));

const services = [
  { name: 'API Server', status: 'healthy' as const, uptime: '99.97%', responseTime: '45ms', icon: Server },
  { name: 'Database (MongoDB)', status: 'healthy' as const, uptime: '99.99%', responseTime: '12ms', icon: Database },
  { name: 'File Storage', status: 'healthy' as const, uptime: '99.95%', responseTime: '85ms', icon: HardDrive },
  { name: 'Payment Gateway', status: 'warning' as const, uptime: '99.80%', responseTime: '250ms', icon: Wifi },
  { name: 'Email Service', status: 'healthy' as const, uptime: '99.90%', responseTime: '120ms', icon: Wifi },
];

const statusConfig = {
  healthy: { icon: CheckCircle2, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/30', label: 'Healthy' },
  warning: { icon: AlertTriangle, color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-100 dark:bg-yellow-900/30', label: 'Warning' },
  down: { icon: XCircle, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/30', label: 'Down' },
};

export function SystemHealth() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div><h1 className="text-2xl font-heading font-bold text-foreground">System Health</h1><p className="text-muted-foreground text-sm mt-1">Monitor platform infrastructure and services</p></div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[{ label: 'Overall Uptime', value: '99.95%', icon: Activity, color: 'text-green-600 dark:text-green-400' }, { label: 'Avg Response', value: '45ms', icon: Cpu, color: 'text-primary' }, { label: 'Services Up', value: `${services.filter(s => s.status === 'healthy').length}/${services.length}`, icon: Server, color: 'text-primary dark:text-blue-400' }, { label: 'DB Size', value: '2.4 GB', icon: Database, color: 'text-primary dark:text-purple-400' }].map(s => (
            <div key={s.label} className="p-4 rounded-xl bg-card border border-border"><div className="flex items-center gap-2 text-xs text-muted-foreground font-medium mb-2"><s.icon size={14} />{s.label}</div><p className={`text-2xl font-bold ${s.color}`}>{s.value}</p></div>
          ))}
        </div>
        <div className="bg-card rounded-2xl p-6 shadow-card border border-border">
          <h2 className="font-heading font-bold text-lg text-foreground mb-4">24h Uptime Monitor</h2>
          <div className="h-56"><ResponsiveContainer width="100%" height="100%">
            <AreaChart data={uptimeData}>
              <defs><linearGradient id="upGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(142, 71%, 40%)" stopOpacity={0.2} /><stop offset="95%" stopColor="hsl(142, 71%, 40%)" stopOpacity={0} /></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" /><XAxis dataKey="hour" tick={{ fontSize: 10 }} interval={3} /><YAxis domain={[99, 100]} tick={{ fontSize: 11 }} tickFormatter={v => `${v}%`} />
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              <Tooltip contentStyle={{ borderRadius: '12px' }} formatter={(v: any) => [`${Number(v).toFixed(2)}%`, 'Uptime']} /><Area type="monotone" dataKey="uptime" stroke="hsl(142, 71%, 40%)" fill="url(#upGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer></div>
        </div>
        <div className="bg-card rounded-2xl shadow-card border border-border overflow-hidden">
          <div className="p-4 border-b border-border"><h2 className="font-heading font-bold text-lg text-foreground">Service Status</h2></div>
          <div className="divide-y divide-border">{services.map((svc, i) => {
            const cfg = statusConfig[svc.status];
            const StatusIcon = cfg.icon;
            return (
              <motion.div key={svc.name} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }} className="p-4 flex items-center justify-between hover:bg-secondary/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center"><svc.icon size={18} className="text-muted-foreground" /></div>
                  <div><p className="text-sm font-semibold text-foreground">{svc.name}</p><p className="text-xs text-muted-foreground">Uptime: {svc.uptime} · Avg: {svc.responseTime}</p></div>
                </div>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.color}`}><StatusIcon size={12} />{cfg.label}</span>
              </motion.div>
            );
          })}</div>
        </div>
      </div>
    </DashboardLayout>
  );
}
