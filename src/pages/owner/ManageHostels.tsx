import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '../../components/layouts/DashboardLayout';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Hostel } from '../../types/database';
import { Building2, Plus, Edit, Eye, EyeOff, MapPin } from 'lucide-react';

export function ManageHostels() {
  const { profile } = useAuth();
  const [hostels, setHostels] = useState<Hostel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHostels();
  }, []);

  const loadHostels = async () => {
    try {
      const { data } = await supabase
        .from('hostels')
        .select('*')
        .eq('owner_id', profile?.id)
        .order('created_at', { ascending: false });

      if (data) setHostels(data);
    } catch (error) {
      console.error('Error loading hostels:', error);
    } finally {
      setLoading(false);
    }
  };

  const togglePublish = async (hostel: Hostel) => {
    try {
      const { error } = await supabase
        .from('hostels')
        .update({ is_published: !hostel.is_published })
        .eq('id', hostel.id);

      if (error) throw error;
      loadHostels();
    } catch (error) {
      console.error('Error toggling publish status:', error);
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
              <div key={hostel.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="h-48 bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white">
                  <Building2 size={64} />
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-bold text-gray-900">{hostel.name}</h3>
                    {hostel.is_published ? (
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                        Published
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded-full">
                        Draft
                      </span>
                    )}
                  </div>
                  <div className="flex items-start gap-2 text-sm text-gray-600 mb-3">
                    <MapPin size={16} className="mt-0.5 flex-shrink-0" />
                    <span className="line-clamp-2">{hostel.address}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-gray-50 p-2 rounded">
                      <p className="text-xs text-gray-600">Total Rooms</p>
                      <p className="font-semibold text-gray-900">{hostel.total_rooms}</p>
                    </div>
                    <div className="bg-gray-50 p-2 rounded">
                      <p className="text-xs text-gray-600">Available</p>
                      <p className="font-semibold text-gray-900">{hostel.available_rooms}</p>
                    </div>
                  </div>
                  <div className="mb-4">
                    <p className="text-sm text-gray-600">Price per month</p>
                    <p className="text-xl font-bold text-green-600">
                      KSh {Number(hostel.price_per_month).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      to={`/owner/hostels/edit/${hostel.id}`}
                      className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <Edit size={16} />
                      Edit
                    </Link>
                    <button
                      onClick={() => togglePublish(hostel)}
                      className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      {hostel.is_published ? (
                        <>
                          <EyeOff size={16} />
                          Unpublish
                        </>
                      ) : (
                        <>
                          <Eye size={16} />
                          Publish
                        </>
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
