import { useEffect, useState } from 'react';
import { DashboardLayout, useDashboardRefreshVersion } from '../../components/layouts/DashboardLayout';
import { ApiError, api } from '../../lib/api';
import { Activity, AlertTriangle, CheckCircle2, Cpu, Database, HardDrive, Server, Wifi, XCircle } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface HealthService {
  name: string;
  status: 'healthy' | 'warning' | 'down';
  uptime: string;
  responseTime: string;
  detail?: string;
}

interface SystemHealthResponse {
  summary: {
    overallUptime: string;
    avgResponse: number;
    servicesUp: string;
    dbSizeGb: number;
  };
  uptimeData: Array<{ hour: string; uptime: number }>;
  services: HealthService[];
  system: {
    hostname: string;
    platform: string;
    memoryUsageMb: number;
  };
}

const iconMap = {
  'API Server': Server,
  'Database (MongoDB)': Database,
  'File Storage': HardDrive,
  'Payment Gateway': Wifi,
  'Email Service': Wifi,
};

const statusConfig = {
  healthy: { icon: CheckCircle2, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/30', label: 'Healthy' },
  warning: { icon: AlertTriangle, color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-100 dark:bg-yellow-900/30', label: 'Warning' },
  down: { icon: XCircle, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/30', label: 'Down' },
};

export function SystemHealth() {
  const refreshVersion = useDashboardRefreshVersion();
  const [data, setData] = useState<SystemHealthResponse>({
    summary: { overallUptime: '0%', avgResponse: 0, servicesUp: '0/0', dbSizeGb: 0 },
    uptimeData: [],
    services: [],
    system: { hostname: '', platform: '', memoryUsageMb: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError('');
      try {
        const result = await api.get<SystemHealthResponse>('/admin/system-health');
        setData(result);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Failed to load system health.');
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, [refreshVersion]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">System Health</h1>
          <p className="mt-1 text-sm text-muted-foreground">Monitor platform infrastructure and service status.</p>
        </div>

        {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            { label: 'Overall Uptime', value: data.summary.overallUptime, icon: Activity, color: 'text-green-600 dark:text-green-400' },
            { label: 'Avg Response', value: `${Math.round(data.summary.avgResponse || 0)}ms`, icon: Cpu, color: 'text-primary' },
            { label: 'Services Up', value: data.summary.servicesUp, icon: Server, color: 'text-primary dark:text-blue-400' },
            { label: 'DB Size', value: `${data.summary.dbSizeGb} GB`, icon: Database, color: 'text-primary dark:text-purple-400' },
          ].map((item) => (
            <div key={item.label} className="rounded-xl border border-border bg-card p-4">
              <div className="mb-2 flex items-center gap-2 text-xs font-medium text-muted-foreground"><item.icon size={14} />{item.label}</div>
              <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
          <h2 className="mb-4 text-lg font-bold text-foreground">24h Uptime Monitor</h2>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.uptimeData}>
                <defs>
                  <linearGradient id="upGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(142, 71%, 40%)" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="hsl(142, 71%, 40%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="hour" tick={{ fontSize: 10 }} interval={3} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} tickFormatter={(value) => `${value}%`} />
                <Tooltip contentStyle={{ borderRadius: '12px' }} formatter={(value) => [`${Number(value || 0).toFixed(2)}%`, 'Uptime']} />
                <Area type="monotone" dataKey="uptime" stroke="hsl(142, 71%, 40%)" fill="url(#upGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card shadow-card">
          <div className="border-b border-border p-4">
            <h2 className="text-lg font-bold text-foreground">Service Status</h2>
            <p className="mt-1 text-xs text-muted-foreground">Host: {data.system.hostname || 'unknown'} · Platform: {data.system.platform || 'unknown'} · Memory: {data.system.memoryUsageMb} MB</p>
          </div>
          {loading ? (
            <div className="py-16 text-center text-muted-foreground">Loading health checks...</div>
          ) : (
            <div className="divide-y divide-border">
              {data.services.map((service) => {
                const config = statusConfig[service.status];
                const StatusIcon = config.icon;
                const ServiceIcon = iconMap[service.name as keyof typeof iconMap] || Server;
                return (
                  <div key={service.name} className="flex items-center justify-between p-4 transition-colors hover:bg-secondary/50">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary"><ServiceIcon size={18} className="text-muted-foreground" /></div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{service.name}</p>
                        <p className="text-xs text-muted-foreground">Uptime: {service.uptime} · Avg: {service.responseTime}{service.detail ? ` · ${service.detail}` : ''}</p>
                      </div>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${config.bg} ${config.color}`}>
                      <StatusIcon size={12} />
                      {config.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
