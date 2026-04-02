import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { CircleMarker, MapContainer, Popup, TileLayer, Tooltip, useMap } from 'react-leaflet';
import {
  ArrowRightLeft,
  ArrowUpDown,
  Building2,
  Heart,
  LayoutGrid,
  Map,
  MapPin,
  Navigation,
  Search,
  SlidersHorizontal,
  Star,
  Users,
  X,
} from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { DashboardLayout, useDashboardRefreshVersion } from '../../components/layouts/DashboardLayout';
import { api } from '../../lib/api';
import { toMediaUrl } from '../../lib/media';
import { setHostelList } from '../../store/hostelSlice';
import type { BackendHostel } from '../../store/hostelSlice';
import type { AppDispatch, RootState } from '../../store';

type AmenityKey =
  | 'wifi'
  | 'parking'
  | 'laundry'
  | 'kitchen'
  | 'security'
  | 'water'
  | 'electricity'
  | 'airCondition';

type SortOption = 'rating' | 'price_low' | 'price_high' | 'available' | 'name' | 'distance';
type ViewMode = 'grid' | 'map';
type SearchFilters = {
  hostelType: 'all' | BackendHostel['hostelType'];
  city: string;
  university: string;
  minPrice: string;
  maxPrice: string;
  maxDistance: string;
} & Record<AmenityKey, boolean>;

const amenityOptions: Array<{ key: AmenityKey; label: string }> = [
  { key: 'wifi', label: 'WiFi' },
  { key: 'parking', label: 'Parking' },
  { key: 'laundry', label: 'Laundry' },
  { key: 'kitchen', label: 'Kitchen' },
  { key: 'security', label: 'Security' },
  { key: 'water', label: 'Water' },
  { key: 'electricity', label: 'Electricity' },
  { key: 'airCondition', label: 'Air Conditioning' },
];

const sortLabels: Record<SortOption, string> = {
  rating: 'Highest Rated',
  price_low: 'Price: Low to High',
  price_high: 'Price: High to Low',
  available: 'Most Available',
  name: 'Name A-Z',
  distance: 'Nearest First',
};

const DEFAULT_PRIMARY_UNIVERSITY = 'Kirinyaga University';
const DEFAULT_MAP_CENTER: [number, number] = [-0.0236, 37.9062];

const createDefaultFilters = (): SearchFilters => ({
  hostelType: 'all',
  city: 'all',
  university: DEFAULT_PRIMARY_UNIVERSITY,
  minPrice: '',
  maxPrice: '',
  maxDistance: '',
  wifi: false,
  parking: false,
  laundry: false,
  kitchen: false,
  security: false,
  water: false,
  electricity: false,
  airCondition: false,
});

function getHostelCoordinates(hostel: BackendHostel): [number, number] | null {
  const raw = hostel.location?.coordinates;
  if (!Array.isArray(raw) || raw.length < 2) return null;

  const [longitude, latitude] = raw;
  if (typeof latitude !== 'number' || typeof longitude !== 'number') return null;

  return [latitude, longitude];
}

function getDistanceKm(origin: [number, number], target: [number, number]): number {
  const [lat1, lon1] = origin;
  const [lat2, lon2] = target;
  const toRad = (value: number) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function HostelMapViewport({
  hostelPositions,
  userLocation,
}: {
  hostelPositions: Array<{ id: string; position: [number, number] }>;
  userLocation: [number, number] | null;
}) {
  const map = useMap();

  useEffect(() => {
    const points = hostelPositions.map(({ position }) => position);

    if (userLocation) {
      points.push(userLocation);
    }

    if (points.length === 0) {
      map.setView(DEFAULT_MAP_CENTER, 7, { animate: false });
      return;
    }

    if (points.length === 1) {
      map.setView(points[0], 15, { animate: false });
      return;
    }

    map.fitBounds(points, {
      padding: [48, 48],
      maxZoom: 15,
      animate: false,
    });
  }, [hostelPositions, map, userLocation]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      map.invalidateSize();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [map]);

  return null;
}

function HostelMapView({
  hostels,
  userLocation,
  selectedHostelId,
  onSelectHostel,
}: {
  hostels: BackendHostel[];
  userLocation: [number, number] | null;
  selectedHostelId: string | null;
  onSelectHostel: (hostelId: string) => void;
}) {
  const plottedHostels = useMemo(() => {
    return hostels
      .map((hostel) => {
        const coords = getHostelCoordinates(hostel);
        if (!coords) return null;

        return {
          hostel,
          position: coords,
          distanceKm: userLocation ? getDistanceKm(userLocation, coords) : null,
        };
      })
      .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));
  }, [hostels, userLocation]);

  const selectedHostel =
    plottedHostels.find((entry) => entry.hostel._id === selectedHostelId) ?? plottedHostels[0] ?? null;

  if (plottedHostels.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-card">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-secondary">
          <Map size={26} className="text-muted-foreground" />
        </div>
        <p className="font-medium text-foreground">Map view is unavailable for these listings.</p>
        <p className="mt-2 text-sm text-muted-foreground">
          The current hostels do not include location coordinates, so grid view is still the reliable fallback.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
      <div className="border-b border-border px-5 py-4">
        <h3 className="font-heading text-lg font-bold text-card-foreground">Map View</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Hostel points are plotted from saved coordinates. Click a marker to inspect a listing.
        </p>
      </div>

      <div className="grid gap-6 p-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(280px,0.9fr)]">
        <div className="relative h-[420px] overflow-hidden rounded-2xl border border-border">
          <MapContainer
            center={DEFAULT_MAP_CENTER}
            zoom={7}
            scrollWheelZoom
            className="h-full w-full"
          >
            <TileLayer
              attribution='Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            />

            <HostelMapViewport hostelPositions={plottedHostels.map(({ hostel, position }) => ({ id: hostel._id, position }))} userLocation={userLocation} />

            {plottedHostels.map((entry) => {
              const isSelected = selectedHostel?.hostel._id === entry.hostel._id;

              return (
                <CircleMarker
                  key={entry.hostel._id}
                  center={entry.position}
                  pathOptions={{
                    color: isSelected ? '#1d4ed8' : '#0f172a',
                    fillColor: isSelected ? '#2563eb' : '#1e293b',
                    fillOpacity: 0.92,
                    weight: isSelected ? 3 : 2,
                  }}
                  radius={isSelected ? 11 : 8}
                  eventHandlers={{
                    click: () => onSelectHostel(entry.hostel._id),
                  }}
                >
                  <Tooltip direction="top" offset={[0, -8]} opacity={1}>
                    {entry.hostel.name}
                  </Tooltip>
                  <Popup>
                    <div className="min-w-[220px] max-w-[260px] space-y-2">
                      {entry.hostel.images?.[0] ? (
                        <img
                          src={toMediaUrl(entry.hostel.images[0])}
                          alt={entry.hostel.name}
                          className="h-28 w-full rounded-lg object-cover"
                        />
                      ) : null}
                      <div>
                        <p className="font-semibold text-slate-900">{entry.hostel.name}</p>
                        <p className="text-xs text-slate-600">
                          {entry.hostel.location.city ?? 'City not set'}
                          {entry.hostel.location.nearbyUniversity
                            ? ` · Near ${entry.hostel.location.nearbyUniversity}`
                            : ''}
                        </p>
                      </div>
                      <div className="text-sm text-slate-700">
                        <p>KES {entry.hostel.pricePerMonth.toLocaleString()} / month</p>
                        <p>{entry.hostel.availableRooms} room(s) available</p>
                        {entry.distanceKm !== null ? (
                          <p>{entry.distanceKm.toFixed(1)} km from your location</p>
                        ) : null}
                      </div>
                      <Link
                        to={`/student/hostel/${entry.hostel._id}`}
                        className="inline-flex items-center text-sm font-semibold text-blue-700 hover:underline"
                      >
                        Open hostel details
                      </Link>
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}

            {userLocation ? (
              <CircleMarker
                center={userLocation}
                radius={9}
                pathOptions={{
                  color: '#047857',
                  fillColor: '#10b981',
                  fillOpacity: 0.95,
                  weight: 3,
                }}
              >
                <Tooltip direction="top" offset={[0, -8]} opacity={1}>
                  Your location
                </Tooltip>
              </CircleMarker>
            ) : null}
          </MapContainer>
        </div>

        <div className="rounded-2xl border border-border bg-background/60 p-5">
          {selectedHostel ? (
            <>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
                    Selected Hostel
                  </p>
                  <h4 className="mt-2 font-heading text-xl font-bold text-foreground">
                    {selectedHostel.hostel.name}
                  </h4>
                </div>
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  {selectedHostel.hostel.hostelType}
                </span>
              </div>

              <div className="mt-5 space-y-3 text-sm text-muted-foreground">
                <p className="flex items-center gap-2">
                  <MapPin size={14} className="text-primary" />
                  {selectedHostel.hostel.location.address ?? selectedHostel.hostel.location.city ?? 'Location not set'}
                </p>
                {selectedHostel.hostel.location.nearbyUniversity && (
                  <p className="text-primary">
                    Near {selectedHostel.hostel.location.nearbyUniversity}
                  </p>
                )}
                {selectedHostel.distanceKm !== null && (
                  <p>{selectedHostel.distanceKm.toFixed(1)} km from your current location</p>
                )}
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-border bg-card px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Price</p>
                  <p className="mt-2 font-heading text-2xl font-bold text-primary">
                    KES {selectedHostel.hostel.pricePerMonth.toLocaleString()}
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-card px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Availability</p>
                  <p className="mt-2 font-heading text-2xl font-bold text-foreground">
                    {selectedHostel.hostel.availableRooms} rooms
                  </p>
                </div>
              </div>

              <Link
                to={`/student/hostel/${selectedHostel.hostel._id}`}
                className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:opacity-90"
              >
                Open Hostel Details
              </Link>
            </>
          ) : null}

          <div className="mt-5 flex flex-wrap gap-2 border-t border-border pt-5 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-primary" />
              Hostel marker
            </span>
            {userLocation && (
              <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                Your location
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function SearchHostels() {
  const refreshVersion = useDashboardRefreshVersion();
  const dispatch = useDispatch<AppDispatch>();
  const cachedHostels = useSelector((state: RootState) => state.hostels.list);
  const listLoaded = useSelector((state: RootState) => state.hostels.listLoaded);

  const [hostels, setHostels] = useState<BackendHostel[]>(cachedHostels);
  const [loading, setLoading] = useState(!listLoaded);
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showSort, setShowSort] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('rating');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [filters, setFilters] = useState<SearchFilters>(createDefaultFilters);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [nearbyMode, setNearbyMode] = useState(false);
  const [selectedMapHostelId, setSelectedMapHostelId] = useState<string | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [favoriteBusyId, setFavoriteBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (refreshVersion > 0) {
      void loadHostels();
      return;
    }

    if (listLoaded) {
      setHostels(cachedHostels);
      setLoading(false);
      return;
    }

    void loadHostels();
  }, [cachedHostels, listLoaded, refreshVersion]);

  useEffect(() => {
    void loadFavorites();
  }, [refreshVersion]);

  const cityOptions = useMemo(
    () =>
      [...new Set(hostels.map((hostel) => hostel.location?.city).filter(Boolean as unknown as (value: string | undefined) => value is string))]
        .sort((a, b) => a.localeCompare(b)),
    [hostels]
  );

  const universityOptions = useMemo(
    () =>
      [
        ...new Set(
          [
            DEFAULT_PRIMARY_UNIVERSITY,
            ...hostels
              .map((hostel) => hostel.location?.nearbyUniversity)
              .filter(Boolean as unknown as (value: string | undefined) => value is string),
          ]
        ),
      ].sort((a, b) => {
        if (a === DEFAULT_PRIMARY_UNIVERSITY) return -1;
        if (b === DEFAULT_PRIMARY_UNIVERSITY) return 1;
        return a.localeCompare(b);
      }),
    [hostels]
  );

  const canSortByDistance = useMemo(
    () => Boolean(userLocation) && hostels.some((hostel) => Boolean(getHostelCoordinates(hostel))),
    [hostels, userLocation]
  );

  const filteredHostels = useMemo(() => {
    let filtered = [...hostels];

    if (searchTerm.trim()) {
      const query = searchTerm.trim().toLowerCase();
      filtered = filtered.filter(
        (hostel) =>
          hostel.name.toLowerCase().includes(query) ||
          (hostel.location?.city ?? '').toLowerCase().includes(query) ||
          (hostel.location?.address ?? '').toLowerCase().includes(query) ||
          (hostel.location?.nearbyUniversity ?? '').toLowerCase().includes(query)
      );
    }

    if (filters.hostelType !== 'all') {
      filtered = filtered.filter((hostel) => hostel.hostelType === filters.hostelType);
    }

    if (filters.city !== 'all') {
      filtered = filtered.filter((hostel) => hostel.location?.city === filters.city);
    }

    if (filters.university !== 'all') {
      filtered = filtered.filter(
        (hostel) => hostel.location?.nearbyUniversity === filters.university
      );
    }

    if (filters.minPrice) {
      filtered = filtered.filter((hostel) => hostel.pricePerMonth >= Number(filters.minPrice));
    }

    if (filters.maxPrice) {
      filtered = filtered.filter((hostel) => hostel.pricePerMonth <= Number(filters.maxPrice));
    }

    amenityOptions.forEach((amenity) => {
      if (!filters[amenity.key]) return;
      filtered = filtered.filter((hostel) => Boolean(hostel.amenities?.[amenity.key]));
    });

    if (filters.maxDistance && userLocation) {
      filtered = filtered.filter((hostel) => {
        const coords = getHostelCoordinates(hostel);
        if (!coords) return false;

        return getDistanceKm(userLocation, coords) <= Number(filters.maxDistance);
      });
    }

    filtered.sort((left, right) => {
      switch (sortBy) {
        case 'price_low':
          return left.pricePerMonth - right.pricePerMonth;
        case 'price_high':
          return right.pricePerMonth - left.pricePerMonth;
        case 'available':
          return right.availableRooms - left.availableRooms;
        case 'name':
          return left.name.localeCompare(right.name);
        case 'distance': {
          const leftCoords = getHostelCoordinates(left);
          const rightCoords = getHostelCoordinates(right);

          if (!userLocation || !leftCoords || !rightCoords) return 0;

          return getDistanceKm(userLocation, leftCoords) - getDistanceKm(userLocation, rightCoords);
        }
        case 'rating':
        default:
          return right.averageRating - left.averageRating;
      }
    });

    return filtered;
  }, [filters, hostels, searchTerm, sortBy, userLocation]);

  const hasMappableHostels = useMemo(
    () => filteredHostels.some((hostel) => Boolean(getHostelCoordinates(hostel))),
    [filteredHostels]
  );

  const activeFilterCount = useMemo(
    () =>
      [
        filters.hostelType !== 'all',
        filters.city !== 'all',
        filters.university !== 'all',
        filters.minPrice !== '',
        filters.maxPrice !== '',
        filters.maxDistance !== '',
        ...amenityOptions.map((amenity) => filters[amenity.key]),
      ].filter(Boolean).length,
    [filters]
  );

  const activeFilterChips = useMemo(() => {
    const chips: Array<{ label: string; clear: () => void }> = [];

    if (filters.hostelType !== 'all') {
      chips.push({
        label: `Type: ${filters.hostelType}`,
        clear: () => setFilters((prev) => ({ ...prev, hostelType: 'all' })),
      });
    }

    if (filters.city !== 'all') {
      chips.push({
        label: filters.city,
        clear: () => setFilters((prev) => ({ ...prev, city: 'all' })),
      });
    }

    if (filters.university !== 'all') {
      chips.push({
        label: filters.university,
        clear: () => setFilters((prev) => ({ ...prev, university: 'all' })),
      });
    }

    if (filters.minPrice) {
      chips.push({
        label: `Min KES ${filters.minPrice}`,
        clear: () => setFilters((prev) => ({ ...prev, minPrice: '' })),
      });
    }

    if (filters.maxPrice) {
      chips.push({
        label: `Max KES ${filters.maxPrice}`,
        clear: () => setFilters((prev) => ({ ...prev, maxPrice: '' })),
      });
    }

    if (filters.maxDistance) {
      chips.push({
        label: `${filters.maxDistance} km`,
        clear: () => setFilters((prev) => ({ ...prev, maxDistance: '' })),
      });
    }

    amenityOptions.forEach((amenity) => {
      if (!filters[amenity.key]) return;

      chips.push({
        label: amenity.label,
        clear: () => setFilters((prev) => ({ ...prev, [amenity.key]: false })),
      });
    });

    return chips;
  }, [filters]);

  useEffect(() => {
    if (sortBy === 'distance' && !canSortByDistance) {
      setSortBy('rating');
    }
  }, [canSortByDistance, sortBy]);

  useEffect(() => {
    if (viewMode === 'map' && !hasMappableHostels) {
      setViewMode('grid');
    }
  }, [hasMappableHostels, viewMode]);

  useEffect(() => {
    if (filteredHostels.length === 0) {
      setSelectedMapHostelId(null);
      return;
    }

    if (!selectedMapHostelId || !filteredHostels.some((hostel) => hostel._id === selectedMapHostelId)) {
      setSelectedMapHostelId(filteredHostels[0]._id);
    }
  }, [filteredHostels, selectedMapHostelId]);

  async function loadHostels() {
    setLoading(true);

    try {
      const data = await api.get<{ hostels: BackendHostel[] }>('/hostels?limit=100');
      const list = data.hostels ?? [];
      setHostels(list);
      dispatch(setHostelList(list));
      setNearbyMode(false);
    } catch (error) {
      console.error('Error loading hostels:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadFavorites() {
    try {
      const data = await api.get<Array<{ _id: string }>>('/students/favorites');
      setFavoriteIds(new Set((Array.isArray(data) ? data : []).map((hostel) => hostel._id)));
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  }

  async function toggleFavorite(hostelId: string) {
    const isFavorite = favoriteIds.has(hostelId);
    setFavoriteBusyId(hostelId);

    try {
      if (isFavorite) {
        await api.delete(`/students/favorites/${hostelId}`);
        setFavoriteIds((prev) => {
          const next = new Set(prev);
          next.delete(hostelId);
          return next;
        });
      } else {
        await api.post(`/students/favorites/${hostelId}`);
        setFavoriteIds((prev) => new Set(prev).add(hostelId));
      }
    } catch (error) {
      console.error('Error updating favorite:', error);
    } finally {
      setFavoriteBusyId(null);
    }
  }

  function loadNearby() {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setNearbyLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const radiusKm = Number(filters.maxDistance || 10);

        try {
          const data = await api.get<{ hostels: BackendHostel[] }>(
            `/hostels/search/proximity?latitude=${latitude}&longitude=${longitude}&radiusKm=${radiusKm}&limit=100`
          );
          setHostels(data.hostels ?? []);
          setUserLocation([latitude, longitude]);
          setNearbyMode(true);
          setSortBy('distance');
        } catch (error) {
          console.error('Error loading nearby hostels:', error);
          alert('Could not find nearby hostels.');
        } finally {
          setNearbyLoading(false);
        }
      },
      () => {
        setNearbyLoading(false);
        alert('Could not get your location.');
      }
    );
  }

  function resetFilters() {
    setFilters(createDefaultFilters());
    setSearchTerm('');
    setSortBy('rating');
    setViewMode('grid');
    setShowFilters(false);
    setShowSort(false);
    setUserLocation(null);
    void loadHostels();
  }

  return (
    <DashboardLayout>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold text-foreground">Search Hostels</h1>
          <p className="mt-1 text-muted-foreground">
            Find the right hostel with richer filters, sorting, nearby discovery, and a map-style view.
          </p>
        </div>
        <Link
          to="/student/compare"
          className="inline-flex items-center gap-2 rounded-xl border border-input bg-card px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
        >
          <ArrowRightLeft size={16} />
          Compare Hostels
        </Link>
      </div>

      <div className="mb-6 flex flex-col gap-3 xl:flex-row">
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="text"
            placeholder="Search by name, city, address or university..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="w-full rounded-xl border border-input bg-card py-3.5 pl-12 pr-10 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={loadNearby}
          disabled={nearbyLoading}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-60"
        >
          <Navigation size={18} />
          {nearbyLoading ? 'Locating...' : filters.maxDistance ? `Near Me (${filters.maxDistance} km)` : 'Near Me'}
        </button>

        <button
          type="button"
          onClick={() => setShowFilters((prev) => !prev)}
          className={`inline-flex items-center justify-center gap-2 rounded-xl border px-5 py-3.5 text-sm font-medium transition-all ${
            showFilters || activeFilterCount > 0
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-input bg-card text-foreground hover:border-primary/30'
          }`}
        >
          <SlidersHorizontal size={18} />
          Filters
          {activeFilterCount > 0 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-foreground/20 text-[11px] font-bold">
              {activeFilterCount}
            </span>
          )}
        </button>

        <div className="relative">
          <button
            type="button"
            onClick={() => setShowSort((prev) => !prev)}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-input bg-card px-5 py-3.5 text-sm font-medium text-foreground transition-colors hover:border-primary/30"
          >
            <ArrowUpDown size={18} />
            <span className="hidden sm:inline">{sortLabels[sortBy]}</span>
            <span className="sm:hidden">Sort</span>
          </button>

          <AnimatePresence>
            {showSort && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setShowSort(false)} />
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="absolute right-0 top-full z-40 mt-2 w-60 overflow-hidden rounded-xl border border-border bg-card py-1 shadow-card"
                >
                  {(Object.entries(sortLabels) as Array<[SortOption, string]>).map(([option, label]) => {
                    const disabled = option === 'distance' && !canSortByDistance;

                    return (
                      <button
                        key={option}
                        type="button"
                        disabled={disabled}
                        onClick={() => {
                          if (disabled) return;
                          setSortBy(option);
                          setShowSort(false);
                        }}
                        className={`w-full px-4 py-2.5 text-left text-sm transition-colors ${
                          sortBy === option
                            ? 'bg-primary/10 font-medium text-primary'
                            : 'text-foreground hover:bg-secondary'
                        } ${disabled ? 'cursor-not-allowed opacity-50 hover:bg-transparent' : ''}`}
                      >
                        {label}
                        {disabled ? ' (use Near Me first)' : ''}
                      </button>
                    );
                  })}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        <div className="flex overflow-hidden rounded-xl border border-input">
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={`inline-flex items-center gap-1.5 px-4 py-3.5 text-sm font-medium transition-colors ${
              viewMode === 'grid'
                ? 'bg-primary text-primary-foreground'
                : 'bg-card text-foreground hover:bg-secondary'
            }`}
          >
            <LayoutGrid size={16} />
            <span className="hidden sm:inline">Grid</span>
          </button>
          <button
            type="button"
            onClick={() => hasMappableHostels && setViewMode('map')}
            disabled={!hasMappableHostels}
            className={`inline-flex items-center gap-1.5 px-4 py-3.5 text-sm font-medium transition-colors ${
              viewMode === 'map'
                ? 'bg-primary text-primary-foreground'
                : 'bg-card text-foreground hover:bg-secondary'
            } ${!hasMappableHostels ? 'cursor-not-allowed opacity-50' : ''}`}
          >
            <Map size={16} />
            <span className="hidden sm:inline">Map</span>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 overflow-hidden"
          >
            <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h3 className="font-heading font-bold text-foreground">Filters</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    B-style filters added on top of A&apos;s existing search flow.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {activeFilterCount > 0 && (
                    <button
                      type="button"
                      onClick={resetFilters}
                      className="text-sm font-medium text-destructive hover:underline"
                    >
                      Clear all
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowFilters(false)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">Hostel Type</label>
                  <select
                    value={filters.hostelType}
                    onChange={(event) =>
                      setFilters((prev) => ({
                        ...prev,
                        hostelType: event.target.value as SearchFilters['hostelType'],
                      }))
                    }
                    className="w-full rounded-xl border border-input bg-card px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="all">All</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="mixed">Mixed</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">County / City</label>
                  <select
                    value={filters.city}
                    onChange={(event) =>
                      setFilters((prev) => ({ ...prev, city: event.target.value }))
                    }
                    className="w-full rounded-xl border border-input bg-card px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="all">All Counties</option>
                    {cityOptions.map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">University</label>
                  <select
                    value={filters.university}
                    onChange={(event) =>
                      setFilters((prev) => ({ ...prev, university: event.target.value }))
                    }
                    className="w-full rounded-xl border border-input bg-card px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="all">All Universities</option>
                    {universityOptions.map((university) => (
                      <option key={university} value={university}>
                        {university}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 flex items-center gap-1.5 text-sm font-medium text-foreground">
                    <Navigation size={14} />
                    Max Distance
                  </label>
                  <select
                    value={filters.maxDistance}
                    onChange={(event) =>
                      setFilters((prev) => ({ ...prev, maxDistance: event.target.value }))
                    }
                    className="w-full rounded-xl border border-input bg-card px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">Any distance</option>
                    <option value="0.5">Within 0.5 km</option>
                    <option value="1">Within 1 km</option>
                    <option value="2">Within 2 km</option>
                    <option value="5">Within 5 km</option>
                    <option value="10">Within 10 km</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-foreground">Min Price</label>
                    <input
                      type="number"
                      placeholder="3000"
                      value={filters.minPrice}
                      onChange={(event) =>
                        setFilters((prev) => ({ ...prev, minPrice: event.target.value }))
                      }
                      className="w-full rounded-xl border border-input bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-foreground">Max Price</label>
                    <input
                      type="number"
                      placeholder="20000"
                      value={filters.maxPrice}
                      onChange={(event) =>
                        setFilters((prev) => ({ ...prev, maxPrice: event.target.value }))
                      }
                      className="w-full rounded-xl border border-input bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </div>
              </div>

              <div>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <label className="block text-sm font-medium text-foreground">Amenities</label>
                  <p className="text-xs text-muted-foreground">
                    Distance filters work best after using Near Me.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {amenityOptions.map((amenity) => (
                    <button
                      key={amenity.key}
                      type="button"
                      onClick={() =>
                        setFilters((prev) => ({
                          ...prev,
                          [amenity.key]: !prev[amenity.key],
                        }))
                      }
                      className={`rounded-lg px-3.5 py-2 text-xs font-medium transition-all ${
                        filters[amenity.key]
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                      }`}
                    >
                      {amenity.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{filteredHostels.length}</span> hostel
            {filteredHostels.length !== 1 ? 's' : ''} found
          </p>
          {nearbyMode && (
            <p className="mt-1 text-xs font-medium text-primary">
              Nearby mode is active{filters.maxDistance ? ` within ${filters.maxDistance} km` : ''}.
            </p>
          )}
        </div>

        {activeFilterChips.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {activeFilterChips.map((chip) => (
              <span
                key={chip.label}
                className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
              >
                {chip.label}
                <button type="button" onClick={chip.clear}>
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <div className="py-16 text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
        </div>
      ) : filteredHostels.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card py-16 text-center shadow-card">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
            <Building2 size={30} className="text-muted-foreground" />
          </div>
          <p className="text-foreground">No hostels found matching your criteria</p>
          <button
            type="button"
            onClick={resetFilters}
            className="mt-4 font-medium text-primary hover:underline"
          >
            Clear filters
          </button>
        </div>
      ) : viewMode === 'map' ? (
        <HostelMapView
          hostels={filteredHostels}
          userLocation={userLocation}
          selectedHostelId={selectedMapHostelId}
          onSelectHostel={setSelectedMapHostelId}
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredHostels.map((hostel, index) => {
            const occupancy =
              hostel.totalRooms > 0
                ? Math.round(((hostel.totalRooms - hostel.availableRooms) / hostel.totalRooms) * 100)
                : 0;
            const coordinates = getHostelCoordinates(hostel);
            const distanceKm =
              userLocation && coordinates ? getDistanceKm(userLocation, coordinates) : null;
            const isFavorite = favoriteIds.has(hostel._id);

            return (
              <motion.div
                key={hostel._id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
              >
                <Link
                  to={`/student/hostel/${hostel._id}`}
                  className="group block overflow-hidden rounded-2xl border border-border bg-card shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover"
                >
                  <div className="relative h-52 overflow-hidden bg-gradient-to-br from-blue-500 to-indigo-600">
                    {hostel.images?.[0] ? (
                      <img
                        src={toMediaUrl(hostel.images[0])}
                        alt={hostel.name}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                          <span className="font-heading text-xl font-bold text-white">
                            {hostel.name.charAt(0)}
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="absolute inset-0 bg-black/10" />
                    <div className="absolute left-3 right-3 top-3 flex items-center justify-between gap-2">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize text-white backdrop-blur-sm ${
                          hostel.hostelType === 'male'
                            ? 'bg-sky-500/80'
                            : hostel.hostelType === 'female'
                            ? 'bg-pink-500/80'
                            : 'bg-emerald-500/80'
                        }`}
                      >
                        {hostel.hostelType}
                      </span>
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            void toggleFavorite(hostel._id);
                          }}
                          disabled={favoriteBusyId === hostel._id}
                          className={`inline-flex h-9 w-9 items-center justify-center rounded-full backdrop-blur-sm transition-colors ${
                            isFavorite
                              ? 'bg-red-500/90 text-white'
                              : 'bg-white/85 text-slate-700 hover:bg-white'
                          } disabled:cursor-not-allowed disabled:opacity-60`}
                          aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                        >
                          <Heart size={16} fill={isFavorite ? 'currentColor' : 'none'} />
                        </button>
                        {distanceKm !== null && (
                          <span className="rounded-full bg-slate-900/65 px-2.5 py-1 text-xs font-semibold text-white">
                            {distanceKm.toFixed(1)} km away
                          </span>
                        )}
                        {hostel.availableRooms > 0 && hostel.availableRooms <= 5 && (
                          <span className="rounded-full bg-red-500/90 px-2.5 py-1 text-xs font-semibold text-white">
                            Only {hostel.availableRooms} left
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="absolute bottom-3 left-3 rounded-full bg-black/50 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm">
                      {hostel.averageRating > 0
                        ? `${hostel.averageRating.toFixed(1)} rating`
                        : 'New listing'}
                    </div>
                  </div>

                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-heading text-lg font-bold text-card-foreground transition-colors group-hover:text-primary">
                        {hostel.name}
                      </h3>
                      <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
                        {sortBy === 'available' ? `${hostel.availableRooms} free` : 'Hostel'}
                      </span>
                    </div>

                    <div className="mt-1.5 flex items-center gap-3 text-muted-foreground">
                      <div className="flex min-w-0 items-center gap-1">
                        <MapPin size={14} className="shrink-0" />
                        <span className="truncate text-sm">
                          {hostel.location?.address ?? hostel.location?.city ?? 'Location not set'}
                        </span>
                      </div>
                    </div>

                    {hostel.location?.nearbyUniversity && (
                      <p className="mt-2 text-xs font-medium text-primary">
                        Near {hostel.location.nearbyUniversity}
                      </p>
                    )}

                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {amenityOptions
                        .filter((amenity) => hostel.amenities?.[amenity.key])
                        .slice(0, 4)
                        .map((amenity) => (
                          <span
                            key={amenity.key}
                            className="rounded-md bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground"
                          >
                            {amenity.label}
                          </span>
                        ))}
                    </div>

                    <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
                      <div>
                        <span className="font-heading text-2xl font-bold text-primary">
                          KES {hostel.pricePerMonth.toLocaleString()}
                        </span>
                        <span className="text-sm text-muted-foreground">/mo</span>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Users size={14} />
                        <span>{occupancy}% occupied</span>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {hostel.availableRooms} rooms available
                      </span>
                      <span className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400">
                        <Star size={14} fill="currentColor" />
                        {hostel.averageRating > 0 ? hostel.averageRating.toFixed(1) : 'New'}
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}
