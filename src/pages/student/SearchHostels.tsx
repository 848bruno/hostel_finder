import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '../../components/layouts/DashboardLayout';
import { supabase } from '../../lib/supabase';
import { Hostel, Amenity } from '../../types/database';
import { Search, Filter, MapPin, DollarSign, Users, Star } from 'lucide-react';

type HostelWithAmenities = Hostel & { amenities: Amenity | null };

export function SearchHostels() {
  const [hostels, setHostels] = useState<HostelWithAmenities[]>([]);
  const [filteredHostels, setFilteredHostels] = useState<HostelWithAmenities[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    genderType: 'all',
    minPrice: '',
    maxPrice: '',
    wifi: false,
    parking: false,
    laundry: false,
    kitchen: false,
    security: false,
  });

  useEffect(() => {
    loadHostels();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchTerm, filters, hostels]);

  const loadHostels = async () => {
    try {
      const { data } = await supabase
        .from('hostels')
        .select(`
          *,
          amenities(*)
        `)
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (data) {
        setHostels(data as HostelWithAmenities[]);
        setFilteredHostels(data as HostelWithAmenities[]);
      }
    } catch (error) {
      console.error('Error loading hostels:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = hostels;

    if (searchTerm) {
      filtered = filtered.filter(
        h => h.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
             h.address.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filters.genderType !== 'all') {
      filtered = filtered.filter(h => h.gender_type === filters.genderType);
    }

    if (filters.minPrice) {
      filtered = filtered.filter(h => Number(h.price_per_month) >= Number(filters.minPrice));
    }

    if (filters.maxPrice) {
      filtered = filtered.filter(h => Number(h.price_per_month) <= Number(filters.maxPrice));
    }

    if (filters.wifi) {
      filtered = filtered.filter(h => h.amenities?.wifi);
    }
    if (filters.parking) {
      filtered = filtered.filter(h => h.amenities?.parking);
    }
    if (filters.laundry) {
      filtered = filtered.filter(h => h.amenities?.laundry);
    }
    if (filters.kitchen) {
      filtered = filtered.filter(h => h.amenities?.kitchen);
    }
    if (filters.security) {
      filtered = filtered.filter(h => h.amenities?.security);
    }

    setFilteredHostels(filtered);
  };

  const resetFilters = () => {
    setFilters({
      genderType: 'all',
      minPrice: '',
      maxPrice: '',
      wifi: false,
      parking: false,
      laundry: false,
      kitchen: false,
      security: false,
    });
    setSearchTerm('');
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
                placeholder="Search by name or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Gender Type</label>
                  <select
                    value={filters.genderType}
                    onChange={(e) => setFilters({ ...filters, genderType: e.target.value })}
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
                key={hostel.id}
                to={`/student/hostel/${hostel.id}`}
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="h-48 bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white">
                  <Building2 size={64} />
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{hostel.name}</h3>
                  <div className="flex items-start gap-2 text-sm text-gray-600 mb-3">
                    <MapPin size={16} className="mt-0.5 flex-shrink-0" />
                    <span className="line-clamp-2">{hostel.address}</span>
                  </div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-1 text-green-600 font-bold">
                      <DollarSign size={18} />
                      <span>KSh {Number(hostel.price_per_month).toLocaleString()}/mo</span>
                    </div>
                    <div className="flex items-center gap-1 text-gray-600">
                      <Users size={16} />
                      <span className="text-sm capitalize">{hostel.gender_type}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{hostel.available_rooms} rooms available</span>
                    <span className="flex items-center gap-1 text-yellow-600">
                      <Star size={14} fill="currentColor" />
                      4.5
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
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={props.size}
      height={props.size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={props.className}
    >
      <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
      <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
      <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
      <path d="M10 6h4" />
      <path d="M10 10h4" />
      <path d="M10 14h4" />
      <path d="M10 18h4" />
    </svg>
  );
}
