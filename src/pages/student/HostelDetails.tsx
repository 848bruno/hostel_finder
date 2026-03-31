import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { DashboardLayout } from '../../components/layouts/DashboardLayout';
import { api, ApiError } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { toMediaUrl } from '../../lib/media';
import { cacheHostel } from '../../store/hostelSlice';
import type { RootState, AppDispatch } from '../../store';
import type { BackendHostel } from '../../store/hostelSlice';
import {
  MapPin, DollarSign, Users, Wifi, Car, Star,
  Shield, Sparkles, Calendar, ArrowLeft, CreditCard,
  ChevronLeft, ChevronRight, Wind, Utensils, Zap,
  Droplets, GraduationCap, Mail, Building2,
  CheckCircle, Heart, X,
} from 'lucide-react';

// ── Photo Gallery ─────────────────────────────────────────────────────────────
function PhotoGallery({ images, name }: { images: string[]; name: string }) {
  const [current, setCurrent] = useState(0);
  const [fading, setFading] = useState(false);
  const normalizedImages = images.map((image) => toMediaUrl(image)).filter(Boolean);

  if (normalizedImages.length === 0) return null;

  const goTo = (idx: number) => {
    if (fading || idx === current) return;
    setFading(true);
    setTimeout(() => { setCurrent(idx); setFading(false); }, 180);
  };
  const prev = () => goTo((current - 1 + normalizedImages.length) % normalizedImages.length);
  const next = () => goTo((current + 1) % normalizedImages.length);

  return (
    <div className="select-none">
      <div className="relative overflow-hidden" style={{ height: '420px' }}>
        <img
          src={normalizedImages[current]}
          alt={`${name} — ${current + 1}`}
          className={`w-full h-full object-cover transition-opacity duration-200 ${fading ? 'opacity-0' : 'opacity-100'}`}
        />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />
        <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1.5 rounded-full">
          {current + 1} / {normalizedImages.length}
        </div>
        {normalizedImages.length > 1 && (
          <>
            <button onClick={prev} aria-label="Previous"
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/75 text-white rounded-full w-11 h-11 flex items-center justify-center transition-all shadow-lg hover:scale-105">
              <ChevronLeft size={24} />
            </button>
            <button onClick={next} aria-label="Next"
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/75 text-white rounded-full w-11 h-11 flex items-center justify-center transition-all shadow-lg hover:scale-105">
              <ChevronRight size={24} />
            </button>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {normalizedImages.map((_, i) => (
                <button key={i} onClick={() => goTo(i)} aria-label={`Photo ${i + 1}`}
                  className={`rounded-full transition-all duration-200 ${i === current ? 'bg-white w-5 h-2' : 'bg-white/50 hover:bg-white/75 w-2 h-2'}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
      {normalizedImages.length > 1 && (
        <div className="flex gap-2 p-3 bg-gray-950 overflow-x-auto">
          {normalizedImages.map((src, i) => (
            <button key={i} onClick={() => goTo(i)}
              className={`flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all duration-150 ${
                i === current ? 'border-blue-500 scale-105 opacity-100' : 'border-transparent opacity-50 hover:opacity-80'
              }`}
              style={{ width: '72px', height: '56px' }}
            >
              <img src={src} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Amenity config ─────────────────────────────────────────────────────────────
const AMENITY_META: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  wifi:         { label: 'Wi-Fi',         icon: <Wifi size={18} />,      color: 'text-primary bg-primary/10 border border-blue-100' },
  parking:      { label: 'Parking',       icon: <Car size={18} />,       color: 'text-slate-600 bg-slate-50 border border-slate-100' },
  security:     { label: 'Security',      icon: <Shield size={18} />,    color: 'text-green-600 bg-green-50 border border-green-100' },
  airCondition: { label: 'Air Condition', icon: <Wind size={18} />,      color: 'text-cyan-600 bg-cyan-50 border border-cyan-100' },
  kitchen:      { label: 'Kitchen',       icon: <Utensils size={18} />,  color: 'text-orange-600 bg-orange-50 border border-orange-100' },
  laundry:      { label: 'Laundry',       icon: <Sparkles size={18} />,  color: 'text-primary bg-purple-50 border border-purple-100' },
  water:        { label: 'Water Supply',  icon: <Droplets size={18} />,  color: 'text-teal-600 bg-teal-50 border border-teal-100' },
  electricity:  { label: 'Electricity',   icon: <Zap size={18} />,       color: 'text-yellow-600 bg-yellow-50 border border-yellow-100' },
};

// ── Star row ──────────────────────────────────────────────────────────────────
function StarRow({ rating, size = 16, interactive = false, onChange }: {
  rating: number; size?: number; interactive?: boolean; onChange?: (r: number) => void;
}) {
  const [hover, setHover] = useState(0);
  return (
    <div className={`flex gap-0.5 ${interactive ? 'cursor-pointer' : ''}`}>
      {[1, 2, 3, 4, 5].map((s) => {
        const filled = interactive ? (hover || rating) >= s : rating >= s;
        return (
          <Star key={s} size={size}
            className={filled ? 'text-yellow-400' : 'text-gray-300'}
            fill={filled ? 'currentColor' : 'none'}
            onMouseEnter={interactive ? () => setHover(s) : undefined}
            onMouseLeave={interactive ? () => setHover(0) : undefined}
            onClick={interactive && onChange ? () => onChange(s) : undefined}
          />
        );
      })}
    </div>
  );
}

// ── Rate Modal ────────────────────────────────────────────────────────────────
function RateModal({ hostelId, hostelName, onClose, onSuccess }: {
  hostelId: string; hostelName: string; onClose: () => void; onSuccess: () => void;
}) {
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    if (rating < 1) { setError('Please select a star rating.'); return; }
    setLoading(true); setError('');
    try {
      await api.post(`/hostels/${hostelId}/rating`, { rating, review });
      onSuccess();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to submit rating.');
    } finally { setLoading(false); }
  };

  const labels = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Rate your stay</h2>
            <p className="text-sm text-gray-500 mt-0.5">{hostelName}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={22} /></button>
        </div>
        <div className="p-6 space-y-5">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">Overall Rating</label>
            <div className="flex items-center gap-3">
              <StarRow rating={rating} size={38} interactive onChange={setRating} />
              {rating > 0 && (
                <span className="text-sm font-semibold text-amber-600">{labels[rating]}</span>
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Review <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea value={review} onChange={(e) => setReview(e.target.value)}
              placeholder="Share your experience — cleanliness, amenities, location…"
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary resize-none text-sm"
            />
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-colors">Cancel</button>
            <button onClick={submit} disabled={loading || rating < 1}
              className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold transition-colors disabled:opacity-50">
              {loading ? 'Submitting…' : 'Submit Review'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Amount helper ─────────────────────────────────────────────────────────────
function calcAmount(start: string, end: string, price: number, rooms: number) {
  if (!start || !end) return 0;
  const s = new Date(start), e = new Date(end);
  if (e <= s) return 0;
  return price * rooms * Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24 * 30));
}

// ── Main ──────────────────────────────────────────────────────────────────────
interface HostelDetailsProps {
  previewMode?: boolean;
}

export function HostelDetails({ previewMode = false }: HostelDetailsProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useAuth();
  const cachedHostel = useSelector((state: RootState) => id ? state.hostels.byId[id] : undefined);
  const myBookings = useSelector((state: RootState) => state.bookings.list);
  const isOwnerPreview = previewMode || user?.role === 'owner';

  const [hostel, setHostel] = useState<BackendHostel | null>(cachedHostel ?? null);
  const [loading, setLoading] = useState(!cachedHostel);
  const [bookingModal, setBookingModal] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [bookingData, setBookingData] = useState({
    startDate: '', endDate: '', rooms: 1,
    paymentMethod: 'mpesa' as 'mpesa' | 'card',
  });
  const [rateModal, setRateModal] = useState(false);
  const [ratedSuccess, setRatedSuccess] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  const hasConfirmedBooking = myBookings.some(b => b.hostel?._id === id && b.status === 'confirmed');
  const confirmedBooking = myBookings.find(b => b.hostel?._id === id && b.status === 'confirmed');
  const pendingBooking = myBookings.find(b => b.hostel?._id === id && b.status === 'pending_payment');

  useEffect(() => {
    if (!id) return;
    if (cachedHostel) { setHostel(cachedHostel); setLoading(false); }
    else { loadHostel(); }
  }, [id]);

  useEffect(() => {
    if (!id || isOwnerPreview) return;
    void loadFavoriteState();
  }, [id, isOwnerPreview]);

  const loadHostel = async () => {
    try {
      const data = await api.get<BackendHostel>(`/hostels/${id}`);
      setHostel(data);
      dispatch(cacheHostel(data));
    } catch { /* handled below */ }
    finally { setLoading(false); }
  };

  const loadFavoriteState = async () => {
    try {
      const favorites = await api.get<Array<{ _id: string }>>('/students/favorites');
      setIsFavorite((Array.isArray(favorites) ? favorites : []).some((favorite) => favorite._id === id));
    } catch {
      setIsFavorite(false);
    }
  };

  const handleBooking = async () => {
    if (!bookingData.startDate || !bookingData.endDate || !hostel) return;
    setBookingError(''); setBookingLoading(true);
    try {
      const res = await api.post<{ booking: { _id: string } }>('/bookings', {
        hostelId: hostel._id, ...bookingData,
        rooms: bookingData.rooms, paymentMethod: bookingData.paymentMethod,
      });
      navigate(`/student/payment/${res.booking._id}`);
    } catch (err) {
      setBookingError(err instanceof ApiError ? err.message : 'Failed to create booking.');
    } finally { setBookingLoading(false); }
  };

  const handleRateSuccess = () => {
    setRateModal(false); setRatedSuccess(true);
    loadHostel(); // refresh ratings
  };

  const handleToggleFavorite = async () => {
    if (!hostel) return;

    setFavoriteLoading(true);
    try {
      if (isFavorite) {
        await api.delete(`/students/favorites/${hostel._id}`);
        setIsFavorite(false);
      } else {
        await api.post(`/students/favorites/${hostel._id}`);
        setIsFavorite(true);
      }
    } catch (err) {
      setBookingError(err instanceof ApiError ? err.message : 'Failed to update favorites.');
    } finally {
      setFavoriteLoading(false);
    }
  };

  // When extending, pre-fill startDate from the confirmed booking's endDate
  const handleOpenBookingModal = () => {
    if (hasConfirmedBooking && confirmedBooking?.endDate) {
      const nextDay = confirmedBooking.endDate.split('T')[0];
      setBookingData(d => ({ ...d, startDate: nextDay, endDate: '' }));
    }
    setBookingModal(true);
  };

  const amountPreview = calcAmount(bookingData.startDate, bookingData.endDate, hostel?.pricePerMonth ?? 0, bookingData.rooms);

  // ── Loading ──
  if (loading) return (
    <DashboardLayout>
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        <p className="text-gray-400 text-sm">Loading hostel…</p>
      </div>
    </DashboardLayout>
  );

  if (!hostel) return (
    <DashboardLayout>
      <div className="text-center py-24">
        <Building2 size={56} className="mx-auto mb-4 text-gray-200" />
        <p className="text-gray-600 font-medium">Hostel not found</p>
        <button onClick={() => navigate(-1)} className="mt-3 text-primary text-sm hover:underline">Go back</button>
      </div>
    </DashboardLayout>
  );

  const avgRating = hostel.ratings.length > 0
    ? hostel.ratings.reduce((s, r) => s + r.rating, 0) / hostel.ratings.length
    : hostel.averageRating ?? 0;
  const activeAmenities = Object.entries(hostel.amenities ?? {}).filter(([, v]) => v);
  const occupancy = hostel.totalRooms > 0
    ? Math.round(((hostel.totalRooms - hostel.availableRooms) / hostel.totalRooms) * 100)
    : 0;

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Back */}
        <button onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-800 font-medium transition-colors group">
          <ArrowLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />
          {isOwnerPreview ? 'Back to My Hostels' : 'Back to Search'}
        </button>

        {/* ── Hero card ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {hostel.images?.length > 0
            ? <PhotoGallery images={hostel.images} name={hostel.name} />
            : (
              <div className="flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-700" style={{ height: '280px' }}>
                <Building2 size={80} className="text-white/30" />
              </div>
            )
          }

          <div className="p-6 lg:p-8">

            {/* Title + rating */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
              <div className="flex-1 min-w-0">
                {/* Badges */}
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full capitalize ${
                    hostel.hostelType === 'male' ? 'bg-primary/20 text-primary/90' :
                    hostel.hostelType === 'female' ? 'bg-pink-100 text-pink-700' : 'bg-violet-100 text-violet-700'
                  }`}>
                    <Users size={10} className="inline mr-1" />{hostel.hostelType}
                  </span>
                  {hostel.availableRooms > 0
                    ? <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-emerald-100 text-emerald-700">✓ Rooms Available</span>
                    : <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-red-100 text-red-600">Fully Booked</span>
                  }
                </div>

                <h1 className="text-3xl font-extrabold text-gray-900 mb-2 leading-tight">{hostel.name}</h1>

                <div className="space-y-1">
                  {(hostel.location?.address || hostel.location?.city) && (
                    <div className="flex items-center gap-1.5 text-gray-500 text-sm">
                      <MapPin size={14} className="flex-shrink-0 text-gray-400" />
                      {[hostel.location.address, hostel.location.city].filter(Boolean).join(', ')}
                    </div>
                  )}
                  {hostel.location?.nearbyUniversity && (
                    <div className="flex items-center gap-1.5 text-primary text-sm font-semibold">
                      <GraduationCap size={14} className="flex-shrink-0" />
                      Near {hostel.location.nearbyUniversity}
                    </div>
                  )}
                </div>
              </div>

              {/* Rating badge */}
              <div className="flex flex-shrink-0 items-start gap-3">
                {!isOwnerPreview && (
                  <button
                    type="button"
                    onClick={handleToggleFavorite}
                    disabled={favoriteLoading}
                    className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl border transition-colors ${
                      isFavorite
                        ? 'border-red-200 bg-red-50 text-red-600'
                        : 'border-gray-200 bg-white text-gray-500 hover:border-red-200 hover:text-red-600'
                    } disabled:cursor-not-allowed disabled:opacity-60`}
                    aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    <Heart size={20} fill={isFavorite ? 'currentColor' : 'none'} />
                  </button>
                )}
                <div className="text-center bg-amber-50 border border-amber-200 rounded-2xl px-6 py-4">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Star size={22} className="text-amber-500" fill="currentColor" />
                    <span className="text-3xl font-extrabold text-gray-900">{avgRating.toFixed(1)}</span>
                  </div>
                  <p className="text-xs text-gray-500">{hostel.ratings.length} review{hostel.ratings.length !== 1 ? 's' : ''}</p>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
              {[
                { label: 'Monthly Rent', value: `KSh ${Number(hostel.pricePerMonth).toLocaleString()}`, sub: 'per room', icon: <DollarSign size={20} />, from: 'from-emerald-50', to: 'to-green-50', border: 'border-emerald-100', text: 'text-emerald-700' },
                { label: 'Available', value: String(hostel.availableRooms), sub: 'rooms free', icon: null, from: 'from-blue-50', to: 'to-sky-50', border: 'border-blue-100', text: 'text-primary/90' },
                { label: 'Total Rooms', value: String(hostel.totalRooms), sub: 'capacity', icon: null, from: 'from-gray-50', to: 'to-slate-50', border: 'border-gray-100', text: 'text-gray-800' },
                { label: 'Occupancy', value: `${occupancy}%`, sub: 'filled', icon: null, from: 'from-violet-50', to: 'to-purple-50', border: 'border-violet-100', text: 'text-violet-700' },
              ].map((s) => (
                <div key={s.label} className={`bg-gradient-to-br ${s.from} ${s.to} border ${s.border} rounded-xl p-4`}>
                  <p className="text-xs text-gray-500 mb-1.5 font-medium">{s.label}</p>
                  <div className={`font-extrabold text-xl ${s.text} flex items-center gap-1`}>
                    {s.icon}{s.value}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{s.sub}</p>
                </div>
              ))}
            </div>

            {/* About */}
            {hostel.description && (
              <div className="mb-8">
                <h2 className="text-lg font-bold text-gray-900 mb-3">About this Hostel</h2>
                <p className="text-gray-600 leading-relaxed">{hostel.description}</p>
              </div>
            )}

            {/* Amenities */}
            {activeAmenities.length > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-bold text-gray-900 mb-4">What's Included</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {activeAmenities.map(([key]) => {
                    const m = AMENITY_META[key];
                    if (!m) return (
                      <div key={key} className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 text-gray-600">
                        <Sparkles size={18} />
                        <span className="text-sm font-medium capitalize">{key}</span>
                      </div>
                    );
                    return (
                      <div key={key} className={`flex items-center gap-2.5 px-4 py-3 rounded-xl ${m.color}`}>
                        {m.icon}
                        <span className="text-sm font-medium">{m.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Owner */}
            {hostel.owner && (
              <div className="mb-8 flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                  {hostel.owner.username?.[0]?.toUpperCase() ?? 'O'}
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-0.5">Property owner</p>
                  <p className="font-bold text-gray-900">{hostel.owner.username}</p>
                  {hostel.owner.email && (
                    <div className="flex items-center gap-1.5 text-gray-400 text-xs mt-0.5">
                      <Mail size={11} />{hostel.owner.email}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* CTA */}
            {isOwnerPreview ? (
              <div className="w-full py-4 bg-slate-100 text-slate-600 rounded-xl text-center font-semibold border border-slate-200">
                Owner Preview Mode
              </div>
            ) : pendingBooking ? (
              <div className="space-y-3">
                <Link
                  to={`/student/payment/${pendingBooking._id}`}
                  className="w-full py-4 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-lg transition-colors flex items-center justify-center gap-2 shadow-md shadow-amber-100"
                >
                  <CreditCard size={22} />
                  Complete Payment
                </Link>
                <p className="text-center text-xs text-gray-400">You have a pending booking for this hostel</p>
              </div>
            ) : hostel.availableRooms > 0 ? (
              <button onClick={handleOpenBookingModal}
                className={`w-full py-4 text-white rounded-xl font-bold text-lg transition-colors flex items-center justify-center gap-2 shadow-md ${
                  hasConfirmedBooking
                    ? 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 shadow-emerald-100'
                    : 'bg-primary hover:bg-primary/90 active:bg-blue-800 shadow-blue-100'
                }`}>
                <Calendar size={22} />
                {hasConfirmedBooking
                  ? `Extend Period — KSh ${Number(hostel.pricePerMonth).toLocaleString()}/mo`
                  : `Book a Room — KSh ${Number(hostel.pricePerMonth).toLocaleString()}/mo`
                }
              </button>
            ) : (
              <div className="w-full py-4 bg-gray-100 text-gray-400 rounded-xl text-center font-semibold cursor-not-allowed border border-gray-200">
                No Rooms Available
              </div>
            )}
          </div>
        </div>

        {/* ── Reviews ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 lg:p-8">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Student Reviews</h2>
              <p className="text-sm text-gray-400 mt-0.5">{hostel.ratings.length} review{hostel.ratings.length !== 1 ? 's' : ''}</p>
            </div>
            {!isOwnerPreview && hasConfirmedBooking && !ratedSuccess && (
              <button onClick={() => setRateModal(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-sm transition-colors shadow-sm">
                <Star size={15} fill="currentColor" />
                Write a Review
              </button>
            )}
            {!isOwnerPreview && ratedSuccess && (
              <div className="flex items-center gap-2 text-emerald-600 text-sm font-semibold">
                <CheckCircle size={16} /> Review submitted!
              </div>
            )}
          </div>

          {hostel.ratings.length === 0 ? (
            <div className="text-center py-12">
              <Star size={44} className="mx-auto mb-3 text-gray-200" />
              <p className="text-gray-400 text-sm">No reviews yet.</p>
              {!isOwnerPreview && hasConfirmedBooking && !ratedSuccess && (
                <p className="text-gray-500 text-sm mt-1">You've stayed here — share your experience!</p>
              )}
            </div>
          ) : (
            <div className="space-y-5">
              {hostel.ratings.map((r, idx) => {
                const uname = typeof r.student === 'object' ? r.student.username : 'Student';
                const initial = uname?.[0]?.toUpperCase() ?? 'S';
                const palette = ['bg-primary/100', 'bg-violet-500', 'bg-emerald-500', 'bg-amber-500', 'bg-pink-500', 'bg-cyan-500'];
                return (
                  <div key={idx} className="flex gap-4 pb-5 border-b border-gray-100 last:border-0 last:pb-0">
                    <div className={`flex-shrink-0 w-10 h-10 rounded-full ${palette[idx % palette.length]} flex items-center justify-center text-white font-bold text-sm`}>
                      {initial}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <span className="font-semibold text-gray-900 text-sm">{uname}</span>
                        <StarRow rating={r.rating} size={13} />
                        <span className="text-xs text-gray-400 ml-auto">
                          {new Date(r.createdAt).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                      {r.review && <p className="text-gray-600 text-sm leading-relaxed">{r.review}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* ── Booking Modal ── */}
      {!isOwnerPreview && bookingModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{hasConfirmedBooking ? 'Extend Period' : 'Book a Room'}</h2>
                <p className="text-sm text-gray-500">{hostel.name}</p>
              </div>
              <button onClick={() => { setBookingModal(false); setBookingError(''); }} className="text-gray-400 hover:text-gray-600">
                <X size={22} />
              </button>
            </div>
            <div className="p-6 space-y-5">
              {bookingError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{bookingError}</div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Check-in</label>
                  <input type="date" value={bookingData.startDate}
                    onChange={(e) => setBookingData(d => ({ ...d, startDate: e.target.value }))}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Check-out</label>
                  <input type="date" value={bookingData.endDate}
                    onChange={(e) => setBookingData(d => ({ ...d, endDate: e.target.value }))}
                    min={bookingData.startDate || new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">
                  Rooms <span className="normal-case text-gray-400 font-normal">(max {hostel.availableRooms})</span>
                </label>
                <input type="number" min={1} max={hostel.availableRooms} value={bookingData.rooms}
                  onChange={(e) => setBookingData(d => ({ ...d, rooms: Math.max(1, Math.min(hostel.availableRooms, parseInt(e.target.value) || 1)) }))}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Payment Method</label>
                <div className="grid grid-cols-2 gap-3">
                  {(['mpesa', 'card'] as const).map((m) => (
                    <button key={m} type="button"
                      onClick={() => setBookingData(d => ({ ...d, paymentMethod: m }))}
                      className={`py-3 px-4 rounded-xl border-2 font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                        bookingData.paymentMethod === m
                          ? 'border-primary bg-primary/10 text-primary/90'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}>
                      <CreditCard size={16} />
                      {m === 'mpesa' ? 'M-Pesa' : 'Card'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Summary */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-primary/30 rounded-xl p-4 text-sm space-y-2">
                <div className="flex justify-between text-gray-600">
                  <span>Price / month</span>
                  <span className="font-semibold text-gray-800">KSh {hostel.pricePerMonth.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Rooms</span>
                  <span className="font-semibold text-gray-800">{bookingData.rooms}</span>
                </div>
                {bookingData.startDate && bookingData.endDate && amountPreview > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>Duration</span>
                    <span className="font-semibold text-gray-800">
                      {Math.ceil((new Date(bookingData.endDate).getTime() - new Date(bookingData.startDate).getTime()) / (1000 * 60 * 60 * 24 * 30))} month(s)
                    </span>
                  </div>
                )}
                <div className="flex justify-between font-extrabold text-primary pt-2 border-t border-primary/30 text-base">
                  <span>Total</span>
                  <span>KSh {amountPreview > 0 ? amountPreview.toLocaleString() : '—'}</span>
                </div>
              </div>

              <div className="flex gap-3 pt-1">
                <button onClick={() => { setBookingModal(false); setBookingError(''); }}
                  className="flex-1 py-3 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 font-medium transition-colors">Cancel</button>
                <button onClick={handleBooking}
                  disabled={!bookingData.startDate || !bookingData.endDate || bookingLoading || amountPreview <= 0}
                  className="flex-1 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  {bookingLoading ? 'Creating…' : 'Proceed to Payment'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Rate Modal ── */}
      {!isOwnerPreview && rateModal && (
        <RateModal hostelId={hostel._id} hostelName={hostel.name}
          onClose={() => setRateModal(false)} onSuccess={handleRateSuccess} />
      )}
    </DashboardLayout>
  );
}
