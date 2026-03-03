import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../components/layouts/DashboardLayout';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { GenderType } from '../../types/database';
import { Save } from 'lucide-react';

export function AddHostel() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    genderType: 'mixed' as GenderType,
    totalRooms: 0,
    availableRooms: 0,
    pricePerMonth: 0,
    wifi: false,
    parking: false,
    laundry: false,
    kitchen: false,
    security: false,
    gym: false,
    studyRoom: false,
    cleaningService: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const { data: hostel, error: hostelError } = await supabase
        .from('hostels')
        .insert({
          owner_id: profile!.id,
          name: formData.name,
          description: formData.description,
          address: formData.address,
          gender_type: formData.genderType,
          total_rooms: formData.totalRooms,
          available_rooms: formData.availableRooms,
          price_per_month: formData.pricePerMonth,
          latitude: null,
          longitude: null,
          images: [],
          is_published: false,
        })
        .select()
        .single();

      if (hostelError) throw hostelError;

      const { error: amenitiesError } = await supabase
        .from('amenities')
        .insert({
          hostel_id: hostel.id,
          wifi: formData.wifi,
          parking: formData.parking,
          laundry: formData.laundry,
          kitchen: formData.kitchen,
          security: formData.security,
          gym: formData.gym,
          study_room: formData.studyRoom,
          cleaning_service: formData.cleaningService,
        });

      if (amenitiesError) throw amenitiesError;

      alert('Hostel added successfully!');
      navigate('/owner/hostels');
    } catch (error) {
      console.error('Error adding hostel:', error);
      alert('Failed to add hostel. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Add New Hostel</h1>
          <p className="text-gray-600 mt-1">Fill in the details to list your hostel</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Basic Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hostel Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter hostel name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe your hostel..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter full address"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Gender Type <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.genderType}
                  onChange={(e) => setFormData({ ...formData, genderType: e.target.value as GenderType })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="male">Male Only</option>
                  <option value="female">Female Only</option>
                  <option value="mixed">Mixed</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Total Rooms <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.totalRooms || ''}
                    onChange={(e) => setFormData({ ...formData, totalRooms: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Available Rooms <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.availableRooms || ''}
                    onChange={(e) => setFormData({ ...formData, availableRooms: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price per Month (KSh) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.pricePerMonth || ''}
                    onChange={(e) => setFormData({ ...formData, pricePerMonth: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Amenities</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { key: 'wifi', label: 'WiFi' },
                { key: 'parking', label: 'Parking' },
                { key: 'laundry', label: 'Laundry' },
                { key: 'kitchen', label: 'Kitchen' },
                { key: 'security', label: 'Security' },
                { key: 'gym', label: 'Gym' },
                { key: 'studyRoom', label: 'Study Room' },
                { key: 'cleaningService', label: 'Cleaning Service' },
              ].map((amenity) => (
                <label key={amenity.key} className="flex items-center gap-2 cursor-pointer p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={formData[amenity.key as keyof typeof formData] as boolean}
                    onChange={(e) => setFormData({ ...formData, [amenity.key]: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{amenity.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => navigate('/owner/hostels')}
              className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Save size={20} />
              {saving ? 'Saving...' : 'Save Hostel'}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
