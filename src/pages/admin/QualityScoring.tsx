import { DashboardLayout } from '../../components/layouts/DashboardLayout';
import { motion } from 'framer-motion';
import { Star, TrendingUp, TrendingDown, Award } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const hostelScores = [
  { name: 'KU Gate Hostel', score: 92, trend: 'up', reviews: 48 },
  { name: 'Thika Road Apartments', score: 85, trend: 'up', reviews: 32 },
  { name: 'Riverside Studios', score: 78, trend: 'down', reviews: 24 },
  { name: 'Juja Valley Hostel', score: 71, trend: 'up', reviews: 18 },
  { name: 'USIU Close Rooms', score: 65, trend: 'down', reviews: 12 },
];

const getScoreColor = (score: number) => score >= 80 ? 'hsl(142, 71%, 40%)' : score >= 60 ? 'hsl(38, 92%, 50%)' : 'hsl(0, 72%, 51%)';

export function QualityScoring() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div><h1 className="text-2xl font-heading font-bold text-foreground">Quality Scoring</h1><p className="text-muted-foreground text-sm mt-1">Monitor hostel quality across the platform</p></div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[{ label: 'Avg Score', value: '78.2', icon: Star, color: 'text-yellow-600 dark:text-yellow-400' }, { label: 'Top Rated', value: hostelScores[0].name, icon: Award, color: 'text-green-600 dark:text-green-400' }, { label: 'Below Threshold', value: hostelScores.filter(h => h.score < 70).length, icon: TrendingDown, color: 'text-red-600 dark:text-red-400' }].map(s => (
            <div key={s.label} className="p-4 rounded-xl bg-card border border-border"><div className="flex items-center gap-2 text-xs text-muted-foreground font-medium mb-2"><s.icon size={14} />{s.label}</div><p className={`text-xl font-bold ${s.color}`}>{s.value}</p></div>
          ))}
        </div>
        <div className="bg-card rounded-2xl p-6 shadow-card border border-border">
          <h2 className="font-heading font-bold text-lg text-foreground mb-4">Quality Scores</h2>
          <div className="h-64"><ResponsiveContainer width="100%" height="100%">
            <BarChart data={hostelScores}><CartesianGrid strokeDasharray="3 3" className="stroke-border" /><XAxis dataKey="name" tick={{ fontSize: 11 }} /><YAxis domain={[0, 100]} tick={{ fontSize: 12 }} /><Tooltip contentStyle={{ borderRadius: '12px' }} /><Bar dataKey="score" radius={[6, 6, 0, 0]}>{hostelScores.map((h, i) => <Cell key={i} fill={getScoreColor(h.score)} />)}</Bar></BarChart>
          </ResponsiveContainer></div>
        </div>
        <div className="bg-card rounded-2xl shadow-card border border-border overflow-hidden">
          <div className="divide-y divide-border">{hostelScores.map((hostel, i) => (
            <motion.div key={hostel.name} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }} className="p-4 flex items-center justify-between hover:bg-secondary/50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center font-bold text-foreground text-sm">#{i + 1}</div>
                <div><p className="text-sm font-semibold text-foreground">{hostel.name}</p><p className="text-xs text-muted-foreground">{hostel.reviews} reviews</p></div>
              </div>
              <div className="flex items-center gap-3">
                {hostel.trend === 'up' ? <TrendingUp size={16} className="text-green-600" /> : <TrendingDown size={16} className="text-red-500" />}
                <div className="w-24 bg-muted rounded-full h-2 overflow-hidden"><div className="h-full rounded-full" style={{ width: `${hostel.score}%`, backgroundColor: getScoreColor(hostel.score) }} /></div>
                <span className="text-sm font-bold w-8 text-right" style={{ color: getScoreColor(hostel.score) }}>{hostel.score}</span>
              </div>
            </motion.div>
          ))}</div>
        </div>
      </div>
    </DashboardLayout>
  );
}
