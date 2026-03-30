import { useEffect, useState } from 'react';
import { Heart, Loader2, MapPin, Search, Star, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { DashboardLayout, useDashboardRefreshVersion } from '../../components/layouts/DashboardLayout';
import { api, ApiError } from '../../lib/api';

interface FavoriteHostel {
  _id: string;
  name: string;
  location?: { address?: string; city?: string };
  pricePerMonth?: number;
  availableRooms?: number;
  averageRating?: number;
  images?: string[];
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5100/api';
const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');

function toImageUrl(image?: string) {
  if (!image) return '';
  if (/^https?:\/\//i.test(image)) return image;
  return `${API_ORIGIN}/${image.replace(/^\/+/, '')}`;
}

export function Favorites() {
  const refreshVersion = useDashboardRefreshVersion();
  const [favorites, setFavorites] = useState<FavoriteHostel[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    void loadFavorites();
  }, [refreshVersion]);

  const loadFavorites = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.get<FavoriteHostel[]>('/students/favorites');
      setFavorites(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load favorites.');
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (hostelId: string) => {
    setRemovingId(hostelId);
    setError('');
    try {
      await api.delete(`/students/favorites/${hostelId}`);
      setFavorites((prev) => prev.filter((hostel) => hostel._id !== hostelId));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to remove hostel from favorites.');
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Favorites</h1>
          <p className="mt-1 text-gray-600">Saved hostels from your account.</p>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 size={32} className="animate-spin text-primary" />
          </div>
        ) : favorites.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <Heart size={28} className="text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">No saved hostels yet</h2>
            <p className="mx-auto mt-2 max-w-lg text-sm text-gray-600">
              Save hostels you want to revisit later and they will appear here.
            </p>
            <Link
              to="/student/search"
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 font-semibold text-white transition-colors hover:bg-primary/90"
            >
              <Search size={18} />
              Browse Hostels
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {favorites.map((hostel) => {
              const imageUrl = toImageUrl(hostel.images?.[0]);

              return (
                <div key={hostel._id} className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                  <Link to={`/student/hostel/${hostel._id}`} className="block">
                    <div className="h-48 bg-gray-100">
                      {imageUrl ? (
                        <img src={imageUrl} alt={hostel.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center bg-gradient-to-br from-red-50 to-gray-100">
                          <Heart size={32} className="text-red-300" />
                        </div>
                      )}
                    </div>
                  </Link>

                  <div className="space-y-4 p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <Link to={`/student/hostel/${hostel._id}`} className="text-lg font-bold text-gray-900 hover:text-primary">
                          {hostel.name}
                        </Link>
                        <div className="mt-1 flex items-start gap-2 text-sm text-gray-600">
                          <MapPin size={15} className="mt-0.5 shrink-0" />
                          <span>{hostel.location?.address ?? hostel.location?.city ?? 'Location unavailable'}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                        <Star size={13} className="fill-current" />
                        {Number(hostel.averageRating ?? 0).toFixed(1)}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold text-green-600">
                        KSh {Number(hostel.pricePerMonth ?? 0).toLocaleString()}/mo
                      </span>
                      <span className="text-gray-500">
                        {hostel.availableRooms ?? 0} room{hostel.availableRooms === 1 ? '' : 's'} left
                      </span>
                    </div>

                    <div className="flex gap-3">
                      <Link
                        to={`/student/hostel/${hostel._id}`}
                        className="flex-1 rounded-xl bg-primary px-4 py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-primary/90"
                      >
                        View Hostel
                      </Link>
                      <button
                        type="button"
                        onClick={() => removeFavorite(hostel._id)}
                        disabled={removingId === hostel._id}
                        className="rounded-xl border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
                      >
                        {removingId === hostel._id ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Trash2 size={16} />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
