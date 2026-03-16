import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { ArrowRight, Check, MapPin, Plus, Scale, Star, X } from 'lucide-react';
import { DashboardLayout } from '../../components/layouts/DashboardLayout';
import { api } from '../../lib/api';
import { setHostelList } from '../../store/hostelSlice';
import type { BackendHostel } from '../../store/hostelSlice';
import type { AppDispatch, RootState } from '../../store';

const amenityRows: Array<{ key: keyof BackendHostel['amenities']; label: string }> = [
  { key: 'wifi', label: 'Wi-Fi' },
  { key: 'security', label: 'Security' },
  { key: 'water', label: 'Water' },
  { key: 'electricity', label: 'Electricity' },
  { key: 'parking', label: 'Parking' },
  { key: 'laundry', label: 'Laundry' },
  { key: 'kitchen', label: 'Kitchen' },
  { key: 'airCondition', label: 'Air Conditioning' },
];

function findBest(values: number[], direction: 'high' | 'low'): number {
  if (values.length < 2) return -1;
  const target = direction === 'high' ? Math.max(...values) : Math.min(...values);
  if (values.filter((value) => value === target).length > 1) return -1;
  return values.indexOf(target);
}

function CompareRow({
  label,
  values,
  best,
}: {
  label: string;
  values: string[];
  best?: number;
}) {
  return (
    <tr className="border-t border-border/50">
      <td className="p-3 pl-4 font-medium text-muted-foreground">{label}</td>
      {values.map((value, index) => (
        <td
          key={`${label}-${index}`}
          className={`p-3 text-center font-medium ${
            best === index ? 'font-bold text-emerald-600' : 'text-foreground'
          }`}
        >
          {value}
          {best === index && (
            <span className="ml-1 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] text-emerald-700">
              Best
            </span>
          )}
        </td>
      ))}
    </tr>
  );
}

export function CompareHostels() {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const cachedHostels = useSelector((state: RootState) => state.hostels.list);
  const listLoaded = useSelector((state: RootState) => state.hostels.listLoaded);

  const [hostels, setHostels] = useState<BackendHostel[]>(cachedHostels);
  const [selected, setSelected] = useState<string[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [loading, setLoading] = useState(!listLoaded);

  useEffect(() => {
    if (listLoaded) {
      setHostels(cachedHostels);
      setLoading(false);
      return;
    }

    void loadHostels();
  }, [cachedHostels, listLoaded]);

  async function loadHostels() {
    setLoading(true);
    try {
      const data = await api.get<{ hostels: BackendHostel[] }>('/hostels?limit=100');
      const list = data.hostels ?? [];
      setHostels(list);
      dispatch(setHostelList(list));
    } catch (error) {
      console.error('Error loading hostels for comparison:', error);
    } finally {
      setLoading(false);
    }
  }

  const selectedHostels = useMemo(
    () => selected.map((id) => hostels.find((hostel) => hostel._id === id)).filter(Boolean) as BackendHostel[],
    [hostels, selected]
  );

  const availableHostels = useMemo(
    () => hostels.filter((hostel) => !selected.includes(hostel._id)),
    [hostels, selected]
  );

  const addHostel = (id: string) => {
    if (selected.length < 3 && !selected.includes(id)) {
      setSelected((current) => [...current, id]);
    }
    setShowPicker(false);
  };

  const removeHostel = (id: string) => {
    setSelected((current) => current.filter((selectedId) => selectedId !== id));
  };

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="flex items-center gap-3 text-3xl font-heading font-bold text-foreground">
          <Scale size={28} className="text-primary" /> Compare Hostels
        </h1>
        <p className="mt-1 text-muted-foreground">Compare up to 3 hostels side by side</p>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-border bg-card py-16 text-center shadow-card">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
          <p className="mt-4 text-sm text-muted-foreground">Loading hostels…</p>
        </div>
      ) : (
        <>
          <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
            {[0, 1, 2].map((slot) => {
              const hostel = selectedHostels[slot];
              if (hostel) {
                return (
                  <motion.div
                    key={hostel._id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative rounded-2xl border-2 border-primary/20 bg-card p-5 shadow-card"
                  >
                    <button
                      onClick={() => removeHostel(hostel._id)}
                      className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-destructive/10 text-destructive transition-colors hover:bg-destructive/20"
                    >
                      <X size={14} />
                    </button>
                    <h3 className="pr-8 font-heading font-bold text-foreground">{hostel.name}</h3>
                    <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin size={12} /> {hostel.location?.city || 'Unknown city'}
                    </p>
                    <p className="mt-2 font-bold text-primary">
                      KES {Number(hostel.pricePerMonth).toLocaleString()}/mo
                    </p>
                  </motion.div>
                );
              }

              return (
                <button
                  key={slot}
                  onClick={() => setShowPicker(true)}
                  className="flex min-h-[120px] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-card p-5 shadow-card transition-colors hover:border-primary/40"
                >
                  <Plus size={24} className="text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">Add Hostel</span>
                </button>
              );
            })}
          </div>

          <AnimatePresence>
            {showPicker && (
              <>
                <div className="fixed inset-0 z-40 bg-black/40" onClick={() => setShowPicker(false)} />
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="fixed inset-x-4 top-[15%] z-50 flex max-h-[60vh] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-xl md:left-1/2 md:w-[480px] md:-translate-x-1/2 md:inset-x-auto"
                >
                  <div className="flex items-center justify-between border-b border-border p-4">
                    <h3 className="font-heading font-bold text-foreground">Select a Hostel</h3>
                    <button
                      onClick={() => setShowPicker(false)}
                      className="text-muted-foreground transition-colors hover:text-foreground"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-2">
                    {availableHostels.length === 0 ? (
                      <div className="rounded-xl px-3 py-8 text-center text-sm text-muted-foreground">
                        No more hostels available to add.
                      </div>
                    ) : (
                      availableHostels.map((hostel) => (
                        <button
                          key={hostel._id}
                          onClick={() => addHostel(hostel._id)}
                          className="flex w-full items-center justify-between rounded-xl p-3 text-left transition-colors hover:bg-secondary"
                        >
                          <div>
                            <p className="text-sm font-medium text-foreground">{hostel.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {hostel.location?.city || 'Unknown city'} · KES {Number(hostel.pricePerMonth).toLocaleString()}/mo
                            </p>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-amber-500">
                            <Star size={12} className="fill-current" /> {Number(hostel.averageRating || 0).toFixed(1)}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {selectedHostels.length >= 2 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="overflow-hidden rounded-2xl border border-border bg-card shadow-card"
            >
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="w-40 p-4 text-left font-heading font-bold text-muted-foreground">Feature</th>
                      {selectedHostels.map((hostel) => (
                        <th
                          key={hostel._id}
                          className="min-w-[180px] p-4 text-center font-heading font-bold text-foreground"
                        >
                          {hostel.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <CompareRow
                      label="Price/Month"
                      values={selectedHostels.map((hostel) => `KES ${Number(hostel.pricePerMonth).toLocaleString()}`)}
                      best={findBest(selectedHostels.map((hostel) => Number(hostel.pricePerMonth)), 'low')}
                    />
                    <CompareRow
                      label="Rating"
                      values={selectedHostels.map((hostel) => `⭐ ${Number(hostel.averageRating || 0).toFixed(1)} (${hostel.ratings.length})`)}
                      best={findBest(selectedHostels.map((hostel) => Number(hostel.averageRating || 0)), 'high')}
                    />
                    <CompareRow
                      label="Available Rooms"
                      values={selectedHostels.map((hostel) => `${hostel.availableRooms} of ${hostel.totalRooms}`)}
                      best={findBest(selectedHostels.map((hostel) => Number(hostel.availableRooms)), 'high')}
                    />
                    <CompareRow
                      label="Gender"
                      values={selectedHostels.map((hostel) => hostel.hostelType.charAt(0).toUpperCase() + hostel.hostelType.slice(1))}
                    />
                    <CompareRow
                      label="Location"
                      values={selectedHostels.map((hostel) => [
                        hostel.location?.address,
                        hostel.location?.city,
                      ].filter(Boolean).join(', ') || 'Not specified')}
                    />
                    <CompareRow
                      label="Nearby University"
                      values={selectedHostels.map((hostel) => hostel.location?.nearbyUniversity || 'Not specified')}
                    />

                    <tr className="border-t-2 border-border">
                      <td colSpan={selectedHostels.length + 1} className="bg-secondary/50 p-4 font-heading font-bold text-foreground">
                        Amenities
                      </td>
                    </tr>

                    {amenityRows.map((amenity) => (
                      <tr key={amenity.key} className="border-t border-border/50">
                        <td className="p-3 pl-4 text-muted-foreground">{amenity.label}</td>
                        {selectedHostels.map((hostel) => (
                          <td key={`${hostel._id}-${amenity.key}`} className="p-3 text-center">
                            {hostel.amenities?.[amenity.key] ? (
                              <Check size={18} className="mx-auto text-emerald-600" />
                            ) : (
                              <X size={18} className="mx-auto text-muted-foreground/30" />
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}

                    <tr className="border-t-2 border-border">
                      <td className="p-4 font-medium text-foreground">View Details</td>
                      {selectedHostels.map((hostel) => (
                        <td key={`view-${hostel._id}`} className="p-4 text-center">
                          <button
                            onClick={() => navigate(`/student/hostel/${hostel._id}`)}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-primary/90"
                          >
                            View <ArrowRight size={12} />
                          </button>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {selectedHostels.length < 2 && (
            <div className="py-16 text-center text-muted-foreground">
              <Scale size={48} className="mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium">Select at least 2 hostels to compare</p>
              <p className="mt-1 text-sm">Click the + cards above to add hostels</p>
            </div>
          )}
        </>
      )}
    </DashboardLayout>
  );
}
