import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../components/layouts/DashboardLayout';
import { api } from '../../lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PlusCircle, Edit, Trash2, Eye, EyeOff, Search, Building2,
  MapPin, Star, Filter
} from 'lucide-react';

interface Hostel {
  _id: string;
  name: string;
  description?: string;
  hostelType: string;
  pricePerMonth: number;
  totalRooms: number;
  availableRooms: number;
  averageRating: number;
  reviewCount?: number;
  isApproved?: boolean;
  isActive?: boolean;
  isPublished?: boolean;
  images?: string[];
  location?: { address?: string; city?: string; nearbyUniversity?: string };
  amenities?: Record<string, boolean>;
}

export function ManageHostels() {
  const navigate = useNavigate();
  const [hostels, setHostels] = useState<Hostel[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'pending'>('all');

  useEffect(() => { loadHostels(); }, []);

  const loadHostels = async () => {
    setLoading(true);
    try {
      const data = await api.get<{ hostels: Hostel[] } | Hostel[]>('/owners/hostels');
      const list = Array.isArray(data) ? data : (data.hostels ?? []);
      setHostels(list);
    } catch (error) {
      console.error('Error loading hostels:', error);
    } finally {
      setLoading(false);
    }
  };

  const filtered = hostels
    .filter(h => h.name.toLowerCase().includes(search.toLowerCase()) ||
      (h.location?.city || '').toLowerCase().includes(search.toLowerCase()))
    .filter(h => {
      if (statusFilter === 'approved') return h.isApproved === true;
      if (statusFilter === 'pending') return h.isApproved === false;
      return true;
    });

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this hostel?')) return;
    try {
      await api.delete(`/hostels/${id}`);
      setHostels(prev => prev.filter(h => h._id !== id));
    } catch (error) {
      console.error('Error deleting hostel:', error);
    }
  };

  const toggleActive = async (hostel: Hostel) => {
    try {
      await api.put(`/hostels/${hostel._id}`, { isActive: !hostel.isActive });
      setHostels(prev => prev.map(h => h._id === hostel._id ? { ...h, isActive: !h.isActive } : h));
    } catch (error) {
      console.error('Error toggling active status:', error);
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">My Hostels</h1>
          <p className="text-muted-foreground mt-1">Manage your hostel properties</p>
        </div>
        <Link to="/owner/hostels/new" className="inline-flex items-center gap-2 px-5 py-3 gradient-hero text-primary-foreground rounded-xl text-sm font-semibold hover:opacity-90 shadow-hero">
          <PlusCircle size={18} /> Add New Hostel
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-2xl p-4 shadow-card border border-border mb-6 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or city..."
            className="w-full py-2.5 pl-10 pr-4 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'approved', 'pending'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                statusFilter === f
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-foreground hover:bg-muted'
              }`}
            >
              <Filter size={14} className="inline mr-1.5" />
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Hostels List */}
      {loading ? (
        <div className="text-center py-16 bg-card rounded-2xl border border-border">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your hostels...</p>
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {filtered.map((hostel) => {
              const occ = hostel.totalRooms > 0 ? Math.round(((hostel.totalRooms - hostel.availableRooms) / hostel.totalRooms) * 100) : 0;

              return (
                <motion.div
                  key={hostel._id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-card rounded-2xl shadow-card border border-border overflow-hidden"
                >
                  <div className="flex flex-col lg:flex-row">
                    {/* Image / Placeholder */}
                    <div className="lg:w-56 h-40 lg:h-auto bg-gradient-to-br from-primary/15 to-accent/10 flex items-center justify-center shrink-0 overflow-hidden">
                      {hostel.images?.[0] ? (
                        <img src={hostel.images[0]} alt={hostel.name} className="w-full h-full object-cover" />
                      ) : (
                        <Building2 size={40} className="text-primary/40" />
                      )}
                    </div>

                    <div className="flex-1 p-5">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                        <div>
                          <div className="flex items-center gap-2.5 mb-1">
                            <h3 className="font-heading font-bold text-lg text-foreground">{hostel.name}</h3>
                            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${hostel.isApproved ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'}`}>
                              {hostel.isApproved ? '● Approved' : '○ Pending'}
                            </span>
                            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${hostel.isActive ? 'bg-primary/20 text-primary dark:bg-blue-900/30 dark:text-blue-300' : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'}`}>
                              {hostel.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <MapPin size={13} />
                            <span>{hostel.location?.address || hostel.location?.city || 'Location not set'}</span>
                          </div>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <button
                            onClick={() => navigate(`/student/hostel/${hostel._id}`)}
                            className="p-2.5 rounded-xl border border-input hover:bg-secondary transition-colors"
                            title="Preview"
                          >
                            <Eye size={16} className="text-muted-foreground" />
                          </button>
                          <button
                            onClick={() => navigate(`/owner/hostels/edit/${hostel._id}`)}
                            className="p-2.5 rounded-xl border border-input hover:bg-secondary transition-colors"
                            title="Edit"
                          >
                            <Edit size={16} className="text-muted-foreground" />
                          </button>
                          <button
                            onClick={() => toggleActive(hostel)}
                            className="p-2.5 rounded-xl border border-input hover:bg-secondary transition-colors"
                            title={hostel.isActive ? "Deactivate" : "Activate"}
                          >
                            {hostel.isActive ? <EyeOff size={16} className="text-muted-foreground" /> : <Eye size={16} className="text-muted-foreground" />}
                          </button>
                          <button
                            onClick={() => handleDelete(hostel._id)}
                            className="p-2.5 rounded-xl border border-destructive/30 hover:bg-destructive/10 transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={16} className="text-destructive" />
                          </button>
                        </div>
                      </div>

                      {/* Stats row */}
                      <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm mb-4">
                        <div className="flex items-center gap-1.5">
                          <Building2 size={14} className="text-muted-foreground" />
                          <span className="text-muted-foreground">{hostel.totalRooms} rooms</span>
                          <span className="text-foreground font-semibold">({hostel.availableRooms} free)</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Star size={14} className="text-yellow-500 fill-yellow-500" />
                          <span className="font-semibold text-foreground">{hostel.averageRating?.toFixed(1) || 'New'}</span>
                        </div>
                        <span className="font-bold text-primary">
                          KES {hostel.pricePerMonth.toLocaleString()}<span className="text-xs text-muted-foreground font-normal">/mo</span>
                        </span>
                      </div>

                      {/* Occupancy bar */}
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground w-16">Occupancy</span>
                        <div className="flex-1 bg-muted rounded-full h-2.5 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${occ}%` }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                            className={`h-full rounded-full ${occ > 70 ? 'bg-green-500' : occ > 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
                          />
                        </div>
                        <span className="text-xs font-bold text-foreground w-10 text-right">{occ}%</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {filtered.length === 0 && !loading && (
            <div className="text-center py-16 bg-card rounded-2xl border border-border">
              <Building2 size={40} className="text-muted-foreground mx-auto mb-3" />
              <p className="text-lg font-medium text-foreground">No hostels found</p>
              <p className="text-sm text-muted-foreground mt-1">Try adjusting your search or filters</p>
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
