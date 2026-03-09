import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '../../components/layouts/DashboardLayout';
import { api } from '../../lib/api';
import { Building2, Plus, Edit, Eye, EyeOff, MapPin, Clock, CheckCircle } from 'lucide-react';

interface OwnerHostel {
  _id: string;
  name: string;
  location: { address?: string; city?: string };
  totalRooms: number;
  availableRooms: number;
  pricePerMonth: number;
  isApproved: boolean;
  isActive: boolean;
  hostelType: string;
}

export function ManageHostels() {
  const [hostels, setHostels] = useState<OwnerHostel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadHostels(); }, []);

  const loadHostels = async () => {
    try {
      const data = await api.get<{ hostels: OwnerHostel[] }>('/owners/hostels');
      setHostels(data.hostels ?? []);
    } catch (error) {
      console.error('Error loading hostels:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (hostel: OwnerHostel) => {
    try {
      await api.put(`/hostels/${hostel._id}`, { isActive: !hostel.isActive });
      setHostels(prev => prev.map(h => h._id === hostel._id ? { ...h, isActive: !h.isActive } : h));
    } catch (error) {
      console.error('Error toggling active status:', error);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Manage Hostels</h1>
            <p className="text-gray-600 mt-1">View and manage your hostel listings</p>
          </div>
          <Link
            to="/owner/hostels/new"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-colors flex items-center gap-2"
          >
            <Plus size={20} />
            Add Hostel
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : hostels.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <Building2 size={48} className="mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600 mb-4">No hostels added yet</p>
            <Link
              to="/owner/hostels/new"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
            >
              Add Your First Hostel
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {hostels.map((hostel) => (
              <div key={hostel._id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="h-48 bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white">
                  <Building2 size={64} />
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-bold text-gray-900">{hostel.name}</h3>
                    <div className="flex flex-col items-end gap-1">
                      {hostel.isApproved ? (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                          <CheckCircle size={10} /> Approved
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                          <Clock size={10} /> Pending
                        </span>
                      )}
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                        hostel.isActive ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {hostel.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 text-sm text-gray-600 mb-3">
                    <MapPin size={16} className="mt-0.5 flex-shrink-0" />
                    <span className="line-clamp-2">
                      {hostel.location?.address ?? hostel.location?.city ?? 'No address'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-gray-50 p-2 rounded">
                      <p className="text-xs text-gray-600">Total Rooms</p>
                      <p className="font-semibold text-gray-900">{hostel.totalRooms}</p>
                    </div>
                    <div className="bg-gray-50 p-2 rounded">
                      <p className="text-xs text-gray-600">Available</p>
                      <p className="font-semibold text-gray-900">{hostel.availableRooms}</p>
                    </div>
                  </div>
                  <div className="mb-4">
                    <p className="text-sm text-gray-600">Price per month</p>
                    <p className="text-xl font-bold text-green-600">
                      KSh {hostel.pricePerMonth.toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      to={`/owner/hostels/edit/${hostel._id}`}
                      className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <Edit size={16} />
                      Edit
                    </Link>
                    <button
                      onClick={() => toggleActive(hostel)}
                      className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      {hostel.isActive ? (
                        <><EyeOff size={16} /> Deactivate</>
                      ) : (
                        <><Eye size={16} /> Activate</>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
