import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../components/layouts/DashboardLayout';
import { api, ApiError } from '../../lib/api';
import { Save, MapPin, CheckCircle, Loader, ImagePlus, X } from 'lucide-react';

// Geocode an address using Nominatim (OpenStreetMap) — free, no key required
async function geocodeAddress(address: string, city: string): Promise<[number, number] | null> {
  const q = [address, city, 'Kenya'].filter(Boolean).join(', ');
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1`,
      { headers: { 'Accept-Language': 'en' } }
    );
    const data = await res.json();
    if (data && data.length > 0) {
      return [parseFloat(data[0].lon), parseFloat(data[0].lat)]; // [lng, lat] — GeoJSON order
    }
  } catch { /* silent */ }
  return null;
}

export function AddHostel() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [geoStatus, setGeoStatus] = useState<'idle' | 'detecting' | 'found' | 'not_found'>('idle');
  const [coords, setCoords] = useState<[number, number] | null>(null);
  const geoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    city: '',
    nearbyUniversity: 'Kirinyaga University',
    contactPhone: '',
    hostelType: 'mixed' as 'male' | 'female' | 'mixed',
    totalRooms: 0,
    availableRooms: 0,
    pricePerMonth: 0,
    // amenities
    wifi: false,
    water: false,
    electricity: false,
    security: false,
    parking: false,
    laundry: false,
    kitchen: false,
    airCondition: false,
  });

  // Auto-geocode whenever address or city changes (debounced 800ms)
  useEffect(() => {
    if (!formData.address && !formData.city) {
      setGeoStatus('idle');
      setCoords(null);
      return;
    }
    setGeoStatus('detecting');
    if (geoTimer.current) clearTimeout(geoTimer.current);
    geoTimer.current = setTimeout(async () => {
      const result = await geocodeAddress(formData.address, formData.city);
      if (result) {
        setCoords(result);
        setGeoStatus('found');
      } else {
        setCoords(null);
        setGeoStatus('not_found');
      }
    }, 800);
    return () => { if (geoTimer.current) clearTimeout(geoTimer.current); };
  }, [formData.address, formData.city]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    const combined = [...selectedImages, ...files].slice(0, 10);
    setSelectedImages(combined);
    const previews = combined.map(f => URL.createObjectURL(f));
    setImagePreviews(previews);
    // Reset input so the same file can be re-selected
    e.target.value = '';
  };

  const removeImage = (idx: number) => {
    const updated = selectedImages.filter((_, i) => i !== idx);
    setSelectedImages(updated);
    setImagePreviews(updated.map(f => URL.createObjectURL(f)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('name', formData.name);
      fd.append('description', formData.description);
      fd.append('hostelType', formData.hostelType);
      fd.append('totalRooms', String(formData.totalRooms));
      fd.append('availableRooms', String(formData.availableRooms));
      fd.append('pricePerMonth', String(formData.pricePerMonth));
      fd.append('contactPhone', formData.contactPhone);
      fd.append('location', JSON.stringify({
        address: formData.address,
        city: formData.city,
        ...(formData.nearbyUniversity ? { nearbyUniversity: formData.nearbyUniversity } : {}),
        ...(coords ? { type: 'Point', coordinates: coords } : {}),
      }));
      fd.append('amenities', JSON.stringify({
        wifi: formData.wifi,
        water: formData.water,
        electricity: formData.electricity,
        security: formData.security,
        parking: formData.parking,
        laundry: formData.laundry,
        kitchen: formData.kitchen,
        airCondition: formData.airCondition,
      }));
      for (const file of selectedImages) {
        fd.append('images', file);
      }
      await api.postForm('/hostels', fd);
      navigate('/owner/hostels');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to add hostel. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const field = (key: keyof typeof formData, value: string | number | boolean) =>
    setFormData(prev => ({ ...prev, [key]: value }));

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Add New Hostel</h1>
          <p className="mt-1 text-muted-foreground">Fill in the details to list your hostel</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-bold text-foreground">Basic Information</h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">Hostel Name <span className="text-red-500">*</span></label>
                <input type="text" required value={formData.name}
                  onChange={(e) => field('name', e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-4 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Enter hostel name" />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">Description <span className="text-red-500">*</span></label>
                <textarea rows={3} required value={formData.description}
                  onChange={(e) => field('description', e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-4 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Describe your hostel..." />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">Contact Phone <span className="text-red-500">*</span></label>
                <input type="tel" required value={formData.contactPhone}
                  onChange={(e) => field('contactPhone', e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-4 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="e.g. +254 700 000000" />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">Hostel Type <span className="text-red-500">*</span></label>
                <select required value={formData.hostelType}
                  onChange={(e) => field('hostelType', e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
                  <option value="male">Male Only</option>
                  <option value="female">Female Only</option>
                  <option value="mixed">Mixed</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">Total Rooms <span className="text-red-500">*</span></label>
                  <input type="number" required min="1" value={formData.totalRooms || ''}
                    onChange={(e) => field('totalRooms', parseInt(e.target.value) || 0)}
                    className="w-full rounded-lg border border-input bg-background px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">Available Rooms <span className="text-red-500">*</span></label>
                  <input type="number" required min="0" value={formData.availableRooms || ''}
                    onChange={(e) => field('availableRooms', parseInt(e.target.value) || 0)}
                    className="w-full rounded-lg border border-input bg-background px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">Price / Month (KSh) <span className="text-red-500">*</span></label>
                  <input type="number" required min="1" value={formData.pricePerMonth || ''}
                    onChange={(e) => field('pricePerMonth', parseInt(e.target.value) || 0)}
                    className="w-full rounded-lg border border-input bg-background px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
              </div>
            </div>
          </div>

          {/* Location — coordinates auto-detected */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-foreground">Location</h2>
              <div className="flex items-center gap-2 text-sm">
                {geoStatus === 'detecting' && (
                  <><Loader size={14} className="animate-spin text-blue-500" /><span className="text-primary">Detecting coordinates...</span></>
                )}
                {geoStatus === 'found' && (
                  <><CheckCircle size={14} className="text-green-500" /><span className="text-green-600">Coordinates detected</span></>
                )}
                {geoStatus === 'not_found' && (
                  <><MapPin size={14} className="text-muted-foreground" /><span className="text-muted-foreground">Address not found on map (will save without coordinates)</span></>
                )}
              </div>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">Street Address <span className="text-red-500">*</span></label>
                  <input type="text" required value={formData.address}
                    onChange={(e) => field('address', e.target.value)}
                    className="w-full rounded-lg border border-input bg-background px-4 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="e.g. Kimathi Street, Nairobi" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">City <span className="text-red-500">*</span></label>
                  <input type="text" required value={formData.city}
                    onChange={(e) => field('city', e.target.value)}
                    className="w-full rounded-lg border border-input bg-background px-4 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="e.g. Nairobi" />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">Nearby University / Campus</label>
                <input type="text" value={formData.nearbyUniversity}
                  onChange={(e) => field('nearbyUniversity', e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-4 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="e.g. Kirinyaga University" />
              </div>
            </div>
          </div>

          {/* Images */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <h2 className="mb-1 text-xl font-bold text-foreground">Photos</h2>
            <p className="mb-4 text-sm text-muted-foreground">Upload up to 10 photos of your hostel (JPEG, PNG, WebP · max 5 MB each)</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="hidden"
              onChange={handleImageSelect}
            />
            {imagePreviews.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 mb-4">
                {imagePreviews.map((src, idx) => (
                  <div key={idx} className="relative group aspect-square">
                    <img src={src} alt={`preview-${idx}`} className="h-full w-full rounded-lg border border-border object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {selectedImages.length < 10 && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 rounded-lg border-2 border-dashed border-border px-4 py-2 text-muted-foreground transition-colors hover:border-blue-400 hover:text-primary"
              >
                <ImagePlus size={18} />
                {selectedImages.length === 0 ? 'Add Photos' : `Add More (${selectedImages.length}/10)`}
              </button>
            )}
          </div>

          {/* Amenities */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-bold text-foreground">Amenities</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {([
                { key: 'wifi', label: 'WiFi' },
                { key: 'water', label: 'Water' },
                { key: 'electricity', label: 'Electricity' },
                { key: 'security', label: 'Security' },
                { key: 'parking', label: 'Parking' },
                { key: 'laundry', label: 'Laundry' },
                { key: 'kitchen', label: 'Kitchen' },
                { key: 'airCondition', label: 'Air Conditioning' },
              ] as const).map(({ key, label }) => (
                <label key={key} className="flex cursor-pointer items-center gap-2 rounded-lg border border-border p-3 hover:bg-accent/40">
                  <input type="checkbox"
                    checked={formData[key]}
                    onChange={(e) => field(key, e.target.checked)}
                    className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary" />
                  <span className="text-sm text-foreground">{label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-4">
            <button type="button" onClick={() => navigate('/owner/hostels')}
              className="flex-1 rounded-lg border border-input py-3 font-medium text-foreground transition-colors hover:bg-accent/40">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              <Save size={20} />
              {saving ? 'Saving...' : 'Save Hostel'}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
