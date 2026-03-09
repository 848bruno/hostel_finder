import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { DashboardLayout } from '../../components/layouts/DashboardLayout';
import { api } from '../../lib/api';
import { setHostelList } from '../../store/hostelSlice';
import type { BackendHostel } from '../../store/hostelSlice';
import type { RootState, AppDispatch } from '../../store';
import { Search, Filter, MapPin, DollarSign, Users, Star, Navigation } from 'lucide-react';

export function SearchHostels() {
  const dispatch = useDispatch<AppDispatch>();
  const cachedHostels = useSelector((state: RootState) => state.hostels.list);
  const listLoaded = useSelector((state: RootState) => state.hostels.listLoaded);
  const [hostels, setHostels] = useState<BackendHostel[]>(cachedHostels);
  const [filteredHostels, setFilteredHostels] = useState<BackendHostel[]>([]);
  const [loading, setLoading] = useState(!listLoaded);
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    hostelType: 'all',
    minPrice: '',
    maxPrice: '',
    wifi: false,
    parking: false,
    laundry: false,
    kitchen: false,
    security: false,
  });

  useEffect(() => {
    if (listLoaded && cachedHostels.length > 0) {
      setHostels(cachedHostels);
      setLoading(false);
    } else {
      loadHostels();
    }
  }, []);
  useEffect(() => { applyFilters(); }, [searchTerm, filters, hostels]);

  const loadHostels = async () => {
    setLoading(true);
    try {
      const data = await api.get<{ hostels: BackendHostel[] }>('/hostels?limit=100');
      const list = data.hostels ?? [];
      setHostels(list);
      dispatch(setHostelList(list));
    } catch (error) {
      console.error('Error loading hostels:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadNearby = () => {
    if (!navigator.geolocation) return alert('Geolocation is not supported by your browser.');
    setNearbyLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const data = await api.get<{ hostels: BackendHostel[] }>(
            `/hostels/search/proximity?latitude=${latitude}&longitude=${longitude}&radiusKm=10&limit=100`
          );
          const list = data.hostels ?? [];
          setHostels(list);
          dispatch(setHostelList(list));
        } catch {
          alert('Could not find nearby hostels.');
        } finally {
          setNearbyLoading(false);
        }
      },
      () => { setNearbyLoading(false); alert('Could not get your location.'); }
    );
  };

  const applyFilters = () => {
    let filtered = hostels;

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      filtered = filtered.filter(
        h => h.name.toLowerCase().includes(q) ||
             (h.location?.city ?? '').toLowerCase().includes(q) ||
             (h.location?.address ?? '').toLowerCase().includes(q) ||
             (h.location?.nearbyUniversity ?? '').toLowerCase().includes(q)
      );
    }
    if (filters.hostelType !== 'all') filtered = filtered.filter(h => h.hostelType === filters.hostelType);
    if (filters.minPrice) filtered = filtered.filter(h => h.pricePerMonth >= Number(filters.minPrice));
    if (filters.maxPrice) filtered = filtered.filter(h => h.pricePerMonth <= Number(filters.maxPrice));
    if (filters.wifi) filtered = filtered.filter(h => h.amenities?.wifi);
    if (filters.parking) filtered = filtered.filter(h => h.amenities?.parking);
    if (filters.laundry) filtered = filtered.filter(h => h.amenities?.laundry);
    if (filters.kitchen) filtered = filtered.filter(h => h.amenities?.kitchen);
    if (filters.security) filtered = filtered.filter(h => h.amenities?.security);

    setFilteredHostels(filtered);
  };

  const resetFilters = () => {
    setFilters({ hostelType: 'all', minPrice: '', maxPrice: '', wifi: false, parking: false, laundry: false, kitchen: false, security: false });
    setSearchTerm('');
    loadHostels();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Search Hostels</h1>
          <p className="text-gray-600 mt-1">Find the perfect accommodation for you</p>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by name, city or university..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={loadNearby}
              disabled={nearbyLoading}
              className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
            >
              <Navigation size={18} />
              {nearbyLoading ? 'Locating...' : 'Near Me'}
            </button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium flex items-center justify-center gap-2 transition-colors"
            >
              <Filter size={20} />
              Filters
            </button>
          </div>

          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Hostel Type</label>
                  <select
                    value={filters.hostelType}
                    onChange={(e) => setFilters({ ...filters, hostelType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="mixed">Mixed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Min Price (KSh)</label>
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.minPrice}
                    onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Max Price (KSh)</label>
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.maxPrice}
                    onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Amenities</label>
                <div className="flex flex-wrap gap-3">
                  {['wifi', 'parking', 'laundry', 'kitchen', 'security'].map((amenity) => (
                    <label key={amenity} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters[amenity as keyof typeof filters] as boolean}
                        onChange={(e) => setFilters({ ...filters, [amenity]: e.target.checked })}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 capitalize">{amenity}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  onClick={resetFilters}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
                >
                  Reset Filters
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="text-sm text-gray-600">
          Found {filteredHostels.length} hostel{filteredHostels.length !== 1 ? 's' : ''}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : filteredHostels.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <Building2 size={48} className="mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">No hostels found matching your criteria</p>
            <button
              onClick={resetFilters}
              className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredHostels.map((hostel) => (
              <Link
                key={hostel._id}
                to={`/student/hostel/${hostel._id}`}
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="h-48 bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white overflow-hidden">
                  {hostel.images && hostel.images.length > 0
                    ? <img src={hostel.images[0]} alt={hostel.name} className="w-full h-full object-cover" />
                    : <Building2 size={64} />}
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{hostel.name}</h3>
                  <div className="flex items-start gap-2 text-sm text-gray-600 mb-3">
                    <MapPin size={16} className="mt-0.5 flex-shrink-0" />
                    <span className="line-clamp-2">
                      {hostel.location?.address ?? hostel.location?.city ?? 'Location not set'}
                    </span>
                  </div>
                  {hostel.location?.nearbyUniversity && (
                    <p className="text-xs text-blue-600 mb-2">Near {hostel.location.nearbyUniversity}</p>
                  )}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-1 text-green-600 font-bold">
                      <DollarSign size={18} />
                      <span>KSh {hostel.pricePerMonth.toLocaleString()}/mo</span>
                    </div>
                    <div className="flex items-center gap-1 text-gray-600">
                      <Users size={16} />
                      <span className="text-sm capitalize">{hostel.hostelType}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{hostel.availableRooms} rooms available</span>
                    <span className="flex items-center gap-1 text-yellow-600">
                      <Star size={14} fill="currentColor" />
                      {hostel.averageRating > 0 ? hostel.averageRating.toFixed(1) : 'New'}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

function Building2(props: { size: number; className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={props.size} height={props.size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={props.className}>
      <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
      <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
      <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
      <path d="M10 6h4" /><path d="M10 10h4" /><path d="M10 14h4" /><path d="M10 18h4" />
    </svg>
  );
}
