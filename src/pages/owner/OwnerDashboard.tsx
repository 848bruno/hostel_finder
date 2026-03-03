import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '../../components/layouts/DashboardLayout';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Building2, Users, DollarSign, TrendingUp, AlertCircle } from 'lucide-react';

export function OwnerDashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState({
    totalHostels: 0,
    publishedHostels: 0,
    totalBookings: 0,
    totalRevenue: 0,
    occupancyRate: 0,
  });
  const [verificationStatus, setVerificationStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
    checkVerification();
  }, []);

  const checkVerification = async () => {
    const { data } = await supabase
      .from('owner_verifications')
      .select('status')
      .eq('owner_id', profile?.id)
      .order('submitted_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    setVerificationStatus(data?.status || null);
  };

  const loadDashboardData = async () => {
    try {
      const { data: hostels } = await supabase
        .from('hostels')
        .select('*')
        .eq('owner_id', profile?.id);

      const { data: bookings } = await supabase
        .from('bookings')
        .select(`
          *,
          hostel:hostels!inner(owner_id)
        `)
        .eq('hostel.owner_id', profile?.id);

      const totalHostels = hostels?.length || 0;
      const publishedHostels = hostels?.filter(h => h.is_published).length || 0;
      const totalBookings = bookings?.length || 0;
      const totalRevenue = bookings?.reduce((sum, b) => sum + Number(b.total_amount), 0) || 0;

      const totalRooms = hostels?.reduce((sum, h) => sum + h.total_rooms, 0) || 0;
      const occupiedRooms = hostels?.reduce((sum, h) => sum + (h.total_rooms - h.available_rooms), 0) || 0;
      const occupancyRate = totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0;

      setStats({
        totalHostels,
        publishedHostels,
        totalBookings,
        totalRevenue,
        occupancyRate,
      });
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Welcome back, {profile?.full_name}!</h1>
          <p className="text-gray-600 mt-1">Here's your business overview</p>
        </div>

        {verificationStatus === 'pending' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="text-yellow-600 flex-shrink-0" size={20} />
            <div>
              <h3 className="font-semibold text-yellow-900">Verification Pending</h3>
              <p className="text-sm text-yellow-800 mt-1">
                Your documents are under review. You'll be notified once verified.
              </p>
            </div>
          </div>
        )}

        {verificationStatus === 'rejected' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
            <div>
              <h3 className="font-semibold text-red-900">Verification Rejected</h3>
              <p className="text-sm text-red-800 mt-1">
                Your verification was rejected. Please resubmit your documents.
              </p>
              <Link to="/owner/verification" className="text-sm text-red-700 underline mt-2 inline-block">
                Resubmit Documents
              </Link>
            </div>
          </div>
        )}

        {!verificationStatus && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="text-blue-600 flex-shrink-0" size={20} />
            <div>
              <h3 className="font-semibold text-blue-900">Complete Your Verification</h3>
              <p className="text-sm text-blue-800 mt-1">
                Submit your documents to start listing hostels on our platform.
              </p>
              <Link to="/owner/verification" className="text-sm text-blue-700 underline mt-2 inline-block">
                Start Verification
              </Link>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Hostels</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalHostels}</p>
                <p className="text-xs text-gray-500 mt-1">{stats.publishedHostels} published</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <Building2 className="text-blue-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Bookings</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalBookings}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <Users className="text-green-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
                <p className="text-3xl font-bold text-gray-900">
                  KSh {stats.totalRevenue.toLocaleString()}
                </p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-lg">
                <DollarSign className="text-yellow-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Occupancy Rate</p>
                <p className="text-3xl font-bold text-gray-900">{stats.occupancyRate.toFixed(0)}%</p>
              </div>
              <div className="bg-red-100 p-3 rounded-lg">
                <TrendingUp className="text-red-600" size={24} />
              </div>
            </div>
          </div>
        </div>

        {verificationStatus === 'approved' && (
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-8 rounded-xl shadow-lg text-white">
            <h2 className="text-2xl font-bold mb-2">Ready to list a new hostel?</h2>
            <p className="mb-4 text-blue-100">Add your properties and start accepting bookings</p>
            <Link
              to="/owner/hostels/new"
              className="inline-block px-6 py-3 bg-white text-blue-600 rounded-lg hover:bg-blue-50 font-semibold transition-colors"
            >
              Add New Hostel
            </Link>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <Link
                to="/owner/hostels"
                className="block p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
              >
                <h3 className="font-semibold text-gray-900">Manage Hostels</h3>
                <p className="text-sm text-gray-600 mt-1">View and edit your hostel listings</p>
              </Link>
              <Link
                to="/owner/tenants"
                className="block p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
              >
                <h3 className="font-semibold text-gray-900">View Tenants</h3>
                <p className="text-sm text-gray-600 mt-1">See all current and past tenants</p>
              </Link>
              <Link
                to="/owner/analytics"
                className="block p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
              >
                <h3 className="font-semibold text-gray-900">Analytics</h3>
                <p className="text-sm text-gray-600 mt-1">View detailed business insights</p>
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h2>
            <div className="text-center py-8 text-gray-500">
              <p>No recent activity</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
