import { useState } from 'react';
import { DashboardLayout } from '../../components/layouts/DashboardLayout';
import { motion } from 'framer-motion';
import { UserCheck, Plus, Phone, Mail, MapPin, Star, Shield, Search } from 'lucide-react';

// TODO: Replace with real API data
const mockCaretakers = [
  { id: 'C001', name: 'John Mwangi', phone: '+254712345678', email: 'john@email.com', role: 'Main Caretaker', hostel: 'KU Gate Hostel', rating: 4.5, status: 'active' },
  { id: 'C002', name: 'Peter Kamau', phone: '+254723456789', email: 'peter@email.com', role: 'Night Watchman', hostel: 'KU Gate Hostel', rating: 4.2, status: 'active' },
  { id: 'C003', name: 'Grace Njeri', phone: '+254734567890', email: 'grace@email.com', role: 'Cleaner Supervisor', hostel: 'Thika Road Apartments', rating: 4.8, status: 'active' },
  { id: 'C004', name: 'Samuel Odhiambo', phone: '+254745678901', email: 'sam@email.com', role: 'Electrician', hostel: 'All Properties', rating: 4.0, status: 'on_leave' },
];

export function CaretakerAccounts() {
  const [search, setSearch] = useState('');
  const filtered = mockCaretakers.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.role.toLowerCase().includes(search.toLowerCase()));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-heading font-bold text-foreground">Caretaker Accounts</h1>
            <p className="text-muted-foreground text-sm mt-1">Manage your property caretakers and staff</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90">
            <Plus size={18} /> Add Caretaker
          </button>
        </div>

        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or role..." className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-card border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((ct, i) => (
            <motion.div key={ct.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="bg-card rounded-2xl p-5 shadow-card border border-border hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl gradient-hero flex items-center justify-center text-primary-foreground font-bold text-lg shrink-0">{ct.name.charAt(0)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-heading font-bold text-foreground">{ct.name}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${ct.status === 'active' ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400'}`}>
                      {ct.status === 'active' ? 'Active' : 'On Leave'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-primary mb-2"><Shield size={13} />{ct.role}</div>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <p className="flex items-center gap-1.5"><MapPin size={12} />{ct.hostel}</p>
                    <p className="flex items-center gap-1.5"><Phone size={12} />{ct.phone}</p>
                    <p className="flex items-center gap-1.5"><Mail size={12} />{ct.email}</p>
                  </div>
                  <div className="flex items-center gap-1 mt-3">
                    <Star size={14} className="text-yellow-500 fill-yellow-500" />
                    <span className="text-sm font-semibold text-foreground">{ct.rating}</span>
                    <span className="text-xs text-muted-foreground">/ 5.0</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-4 pt-4 border-t border-border">
                <button onClick={() => window.open(`tel:${ct.phone}`)} className="flex-1 py-2 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-semibold hover:opacity-80 flex items-center justify-center gap-1"><Phone size={13} />Call</button>
                <button className="flex-1 py-2 rounded-lg bg-primary/10 text-primary text-xs font-semibold hover:opacity-80 flex items-center justify-center gap-1"><Mail size={13} />Email</button>
              </div>
            </motion.div>
          ))}
        </div>
        {filtered.length === 0 && <div className="py-16 text-center"><UserCheck size={40} className="text-muted-foreground mx-auto mb-3" /><p className="text-muted-foreground">No caretakers found</p></div>}
      </div>
    </DashboardLayout>
  );
}
