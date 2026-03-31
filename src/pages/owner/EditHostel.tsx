import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { DashboardLayout } from '../../components/layouts/DashboardLayout';
import { api, ApiError } from '../../lib/api';
import { toMediaUrl } from '../../lib/media';
import { Save, MapPin, CheckCircle, Loader, ArrowLeft, ImagePlus, X, Trash2 } from 'lucide-react';

async function geocodeAddress(address: string, city: string): Promise<[number, number] | null> {
  const q = [address, city, 'Kenya'].filter(Boolean).join(', ');
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1`,
      { headers: { 'Accept-Language': 'en' } }
    );
    const data = await res.json();
    if (data && data.length > 0) {
      return [parseFloat(data[0].lon), parseFloat(data[0].lat)];
    }
  } catch { /* silent */ }
  return null;
}

interface HostelData {
  _id: string;
  name: string;
  description: string;
  location: {
    address?: string;
    city?: string;
    nearbyUniversity?: string;
    coordinates?: [number, number];
  };
  hostelType: 'male' | 'female' | 'mixed';
  totalRooms: number;
  availableRooms: number;
  pricePerMonth: number;
  contactPhone?: string;
  images: string[];
  amenities: {
    wifi: boolean;
    water: boolean;
    electricity: boolean;
    security: boolean;
    parking: boolean;
    laundry: boolean;
    kitchen: boolean;
    airCondition: boolean;
  };
}

export function EditHostel() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [geoStatus, setGeoStatus] = useState<'idle' | 'detecting' | 'found' | 'not_found'>('idle');
  const [coords, setCoords] = useState<[number, number] | null>(null);
  const geoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstLoad = useRef(true);
  // Images
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [newPreviews, setNewPreviews] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [deletingImageUrl, setDeletingImageUrl] = useState<string | null>(null);
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
    wifi: false,
    water: false,
    electricity: false,
    security: false,
    parking: false,
    laundry: false,
    kitchen: false,
    airCondition: false,
  });

  useEffect(() => {
    if (id) loadHostel();
  }, [id]);

  const loadHostel = async () => {
    try {
      const data = await api.get<HostelData>(`/hostels/${id}`);
      setFormData({
        name: data.name ?? '',
        description: data.description ?? '',
        address: data.location?.address ?? '',
        city: data.location?.city ?? '',
        nearbyUniversity: data.location?.nearbyUniversity ?? '',
        contactPhone: data.contactPhone ?? '',
        hostelType: data.hostelType ?? 'mixed',
        totalRooms: data.totalRooms ?? 0,
        availableRooms: data.availableRooms ?? 0,
        pricePerMonth: data.pricePerMonth ?? 0,
        wifi: data.amenities?.wifi ?? false,
        water: data.amenities?.water ?? false,
        electricity: data.amenities?.electricity ?? false,
        security: data.amenities?.security ?? false,
        parking: data.amenities?.parking ?? false,
        laundry: data.amenities?.laundry ?? false,
        kitchen: data.amenities?.kitchen ?? false,
        airCondition: data.amenities?.airCondition ?? false,
      });
      setExistingImages(data.images ?? []);
      if (data.location?.coordinates) {
        setCoords(data.location.coordinates);
        setGeoStatus('found');
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load hostel data.');
    } finally {
      setLoading(false);
      isFirstLoad.current = false;
    }
  };

  // Re-geocode when address/city changes (skip on initial data load)
  useEffect(() => {
    if (isFirstLoad.current) return;
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await api.put(`/hostels/${id}`, {
        name: formData.name,
        description: formData.description,
        location: {
          address: formData.address,
          city: formData.city,
          nearbyUniversity: formData.nearbyUniversity || undefined,
          ...(coords ? { type: 'Point', coordinates: coords } : {}),
        },
        hostelType: formData.hostelType,
        totalRooms: formData.totalRooms,
        availableRooms: formData.availableRooms,
        pricePerMonth: formData.pricePerMonth,
        contactPhone: formData.contactPhone,
        amenities: {
          wifi: formData.wifi,
          water: formData.water,
          electricity: formData.electricity,
          security: formData.security,
          parking: formData.parking,
          laundry: formData.laundry,
          kitchen: formData.kitchen,
          airCondition: formData.airCondition,
        },
      });
      navigate('/owner/hostels');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to update hostel. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const field = (key: keyof typeof formData, value: string | number | boolean) =>
    setFormData(prev => ({ ...prev, [key]: value }));

  const handleNewImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    const combined = [...newImages, ...files].slice(0, 10 - existingImages.length);
    setNewImages(combined);
    setNewPreviews(combined.map(f => URL.createObjectURL(f)));
    e.target.value = '';
  };

  const removeNewImage = (idx: number) => {
    const updated = newImages.filter((_, i) => i !== idx);
    setNewImages(updated);
    setNewPreviews(updated.map(f => URL.createObjectURL(f)));
  };

  const handleUploadNewImages = async () => {
    if (newImages.length === 0 || !id) return;
    setUploadingImages(true);
    try {
      const fd = new FormData();
      for (const file of newImages) fd.append('images', file);
      const result = await api.postForm<{ images: string[] }>(`/hostels/${id}/images`, fd);
      setExistingImages(result.images);
      setNewImages([]);
      setNewPreviews([]);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to upload images.');
    } finally {
      setUploadingImages(false);
    }
  };

  const handleDeleteImage = async (imageUrl: string) => {
    if (!id) return;
    setDeletingImageUrl(imageUrl);
    try {
      const result = await api.delete<{ images: string[] }>(
        `/hostels/${id}/images?url=${encodeURIComponent(imageUrl)}`
      );
      setExistingImages(result.images);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to delete image.');
    } finally {
      setDeletingImageUrl(null);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate('/owner/hostels')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft size={20} />
            Back
          </button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Edit Hostel</h1>
            <p className="mt-1 text-muted-foreground">Update your hostel listing details</p>
          </div>
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

          {/* Location */}
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
                  <><MapPin size={14} className="text-muted-foreground" /><span className="text-muted-foreground">Address not found on map</span></>
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
            <p className="mb-4 text-sm text-muted-foreground">Manage hostel photos (max 10 total)</p>

            {/* Existing images */}
            {existingImages.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 mb-4">
                {existingImages.map((src) => (
                  <div key={src} className="relative group aspect-square">
                    <img src={toMediaUrl(src)} alt="hostel" className="w-full h-full object-cover rounded-lg border border-gray-200" />
                    <button
                      type="button"
                      onClick={() => handleDeleteImage(src)}
                      disabled={deletingImageUrl === src}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-60"
                    >
                      {deletingImageUrl === src
                        ? <Loader size={12} className="animate-spin" />
                        : <Trash2 size={12} />}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* New images to upload */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="hidden"
              onChange={handleNewImageSelect}
            />
            {newPreviews.length > 0 && (
              <div className="mb-3">
                <p className="mb-2 text-xs font-medium text-primary">Ready to upload:</p>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                  {newPreviews.map((src, idx) => (
                    <div key={idx} className="relative group aspect-square">
                      <img src={src} alt={`new-${idx}`} className="w-full h-full object-cover rounded-lg border-2 border-blue-300" />
                      <button
                        type="button"
                        onClick={() => removeNewImage(idx)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={handleUploadNewImages}
                  disabled={uploadingImages}
                  className="mt-3 flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 font-medium text-sm transition-colors disabled:opacity-50"
                >
                  {uploadingImages
                    ? <><Loader size={14} className="animate-spin" /> Uploading...</>
                    : <><ImagePlus size={14} /> Upload {newImages.length} photo{newImages.length !== 1 ? 's' : ''}</>}
                </button>
              </div>
            )}

            {existingImages.length + newImages.length < 10 && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 rounded-lg border-2 border-dashed border-border px-4 py-2 text-muted-foreground transition-colors hover:border-blue-400 hover:text-primary"
              >
                <ImagePlus size={18} />
                {existingImages.length === 0 && newImages.length === 0 ? 'Add Photos' : 'Add More'}
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
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
