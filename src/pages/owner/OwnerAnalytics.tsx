import { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layouts/DashboardLayout';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { TrendingUp, DollarSign, Building2, Users } from 'lucide-react';

export function OwnerAnalytics() {
  const { profile } = useAuth();
  const [analytics, setAnalytics] = useState({
    totalRevenue: 0,
    monthlyRevenue: 0,
    totalBookings: 0,
    activeBookings: 0,
    averageOccupancy: 0,
    topHostel: { name: '', bookings: 0 },
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const { data: hostels } = await supabase
        .from('hostels')
        .select('*')
        .eq('owner_id', profile?.id);

      if (!hostels || hostels.length === 0) {
        setLoading(false);
        return;
      }

      const hostelIds = hostels.map(h => h.id);

      const { data: bookings } = await supabase
        .from('bookings')
        .select('*')
        .in('hostel_id', hostelIds);

      if (bookings) {
        const totalRevenue = bookings.reduce((sum, b) => sum + Number(b.total_amount), 0);
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const monthlyBookings = bookings.filter(
          b => new Date(b.created_at) >= firstDayOfMonth
        );
        const monthlyRevenue = monthlyBookings.reduce((sum, b) => sum + Number(b.total_amount), 0);

        const activeBookings = bookings.filter(
          b => b.status === 'confirmed' &&
               new Date(b.start_date) <= now &&
               new Date(b.end_date) >= now
        ).length;

        const totalRooms = hostels.reduce((sum, h) => sum + h.total_rooms, 0);
        const occupiedRooms = hostels.reduce((sum, h) => sum + (h.total_rooms - h.available_rooms), 0);
        const averageOccupancy = totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0;

        const hostelBookingCounts = hostelIds.map(id => ({
          id,
          name: hostels.find(h => h.id === id)?.name || '',
          count: bookings.filter(b => b.hostel_id === id).length,
        }));

        const topHostel = hostelBookingCounts.sort((a, b) => b.count - a.count)[0] || { name: 'N/A', count: 0 };

        setAnalytics({
          totalRevenue,
          monthlyRevenue,
          totalBookings: bookings.length,
          activeBookings,
          averageOccupancy,
          topHostel: { name: topHostel.name, bookings: topHostel.count },
        });
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600 mt-1">View detailed insights about your business</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-green-100 p-3 rounded-lg">
                    <DollarSign className="text-green-600" size={24} />
                  </div>
                </div>
                <h3 className="text-sm text-gray-600 mb-1">Total Revenue</h3>
                <p className="text-3xl font-bold text-gray-900">
                  KSh {analytics.totalRevenue.toLocaleString()}
                </p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <TrendingUp className="text-blue-600" size={24} />
                  </div>
                </div>
                <h3 className="text-sm text-gray-600 mb-1">Monthly Revenue</h3>
                <p className="text-3xl font-bold text-gray-900">
                  KSh {analytics.monthlyRevenue.toLocaleString()}
                </p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-yellow-100 p-3 rounded-lg">
                    <Users className="text-yellow-600" size={24} />
                  </div>
                </div>
                <h3 className="text-sm text-gray-600 mb-1">Total Bookings</h3>
                <p className="text-3xl font-bold text-gray-900">{analytics.totalBookings}</p>
                <p className="text-xs text-gray-500 mt-1">{analytics.activeBookings} active</p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-red-100 p-3 rounded-lg">
                    <Building2 className="text-red-600" size={24} />
                  </div>
                </div>
                <h3 className="text-sm text-gray-600 mb-1">Occupancy Rate</h3>
                <p className="text-3xl font-bold text-gray-900">{analytics.averageOccupancy.toFixed(0)}%</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Top Performing Hostel</h2>
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="bg-blue-600 p-4 rounded-full">
                      <Building2 className="text-white" size={32} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{analytics.topHostel.name}</h3>
                      <p className="text-gray-600">{analytics.topHostel.bookings} total bookings</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Revenue Breakdown</h2>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Average per booking</span>
                    <span className="font-semibold text-gray-900">
                      KSh {analytics.totalBookings > 0
                        ? Math.round(analytics.totalRevenue / analytics.totalBookings).toLocaleString()
                        : 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">This month</span>
                    <span className="font-semibold text-green-600">
                      KSh {analytics.monthlyRevenue.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">All time</span>
                    <span className="font-semibold text-blue-600">
                      KSh {analytics.totalRevenue.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="font-semibold text-blue-900 mb-2">Performance Insights</h3>
              <ul className="space-y-2 text-sm text-blue-800">
                <li>Your average occupancy rate is {analytics.averageOccupancy.toFixed(0)}%</li>
                <li>You have {analytics.activeBookings} active tenant{analytics.activeBookings !== 1 ? 's' : ''}</li>
                <li>Your hostels have received {analytics.totalBookings} total booking{analytics.totalBookings !== 1 ? 's' : ''}</li>
              </ul>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
