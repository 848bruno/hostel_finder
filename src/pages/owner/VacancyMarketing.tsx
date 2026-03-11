import { DashboardLayout } from '../../components/layouts/DashboardLayout';
import { motion } from 'framer-motion';
import { Megaphone, TrendingUp, Eye, Users, Building2, Share2, Globe, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

// TODO: Replace with real API data
const trafficData = [
  { source: 'Search', views: 245 },
  { source: 'Direct', views: 128 },
  { source: 'Social Media', views: 89 },
  { source: 'Referral', views: 56 },
  { source: 'University', views: 42 },
];
const colors = ['hsl(220, 80%, 50%)', 'hsl(142, 71%, 40%)', 'hsl(38, 92%, 50%)', 'hsl(280, 60%, 50%)', 'hsl(0, 72%, 51%)'];

const vacantRooms = [
  { hostel: 'KU Gate Hostel', room: 'Room 4A', type: 'Single', price: 8000, daysVacant: 12 },
  { hostel: 'KU Gate Hostel', room: 'Room 9B', type: 'Double', price: 12000, daysVacant: 5 },
  { hostel: 'Thika Road Apartments', room: 'Room 2C', type: 'Bedsitter', price: 15000, daysVacant: 22 },
  { hostel: 'Riverside Studios', room: 'Room 7A', type: 'Single', price: 9500, daysVacant: 3 },
];

export function VacancyMarketing() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-heading font-bold text-foreground">Vacancy Marketing</h1>
            <p className="text-muted-foreground text-sm mt-1">Promote vacancies and track listing performance</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90">
            <Megaphone size={18} /> Boost Listing
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Vacancies', value: vacantRooms.length, icon: Building2, color: 'text-primary' },
            { label: 'Total Views (30d)', value: '560', icon: Eye, color: 'text-green-600 dark:text-green-400' },
            { label: 'Inquiries', value: '23', icon: Users, color: 'text-yellow-600 dark:text-yellow-400' },
            { label: 'Conversion Rate', value: '12%', icon: TrendingUp, color: 'text-blue-600 dark:text-blue-400' },
          ].map(s => (
            <div key={s.label} className="p-4 rounded-xl bg-card border border-border">
              <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium mb-2"><s.icon size={14} />{s.label}</div>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card rounded-2xl p-6 shadow-card border border-border">
            <h2 className="font-heading font-bold text-lg text-foreground flex items-center gap-2 mb-4"><BarChart3 size={18} className="text-primary" />Traffic Sources</h2>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trafficData} layout="vertical">
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="source" tick={{ fontSize: 11 }} width={90} />
                  <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '13px' }} />
                  <Bar dataKey="views" radius={[0, 6, 6, 0]}>{trafficData.map((_, i) => <Cell key={i} fill={colors[i]} />)}</Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-card rounded-2xl p-6 shadow-card border border-border">
            <h2 className="font-heading font-bold text-lg text-foreground mb-4">Current Vacancies</h2>
            <div className="space-y-3">
              {vacantRooms.map((room, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} className="flex items-center justify-between p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{room.room} · {room.type}</p>
                    <p className="text-xs text-muted-foreground">{room.hostel} · {room.daysVacant} days vacant</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-primary">KES {room.price.toLocaleString()}/mo</p>
                    <button className="text-xs text-primary hover:underline flex items-center gap-1 mt-1"><Share2 size={10} />Share</button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-card rounded-2xl p-6 shadow-card border border-border">
          <h2 className="font-heading font-bold text-lg text-foreground mb-4">Marketing Tips</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { icon: Globe, title: 'Social Media', desc: 'Share listings on WhatsApp groups and Facebook to reach more students' },
              { icon: Eye, title: 'Quality Photos', desc: 'Listings with quality photos get 3x more views' },
              { icon: TrendingUp, title: 'Competitive Pricing', desc: 'Your rooms are 8% above area average — consider seasonal discounts' },
            ].map((tip, i) => (
              <div key={i} className="p-4 rounded-xl border border-border bg-secondary/30">
                <tip.icon size={20} className="text-primary mb-3" />
                <p className="text-sm font-semibold text-foreground mb-1">{tip.title}</p>
                <p className="text-xs text-muted-foreground">{tip.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
