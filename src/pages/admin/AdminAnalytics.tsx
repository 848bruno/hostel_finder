import { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layouts/DashboardLayout';
import { supabase } from '../../lib/supabase';
import { TrendingUp, Users, Building2, DollarSign } from 'lucide-react';

export function AdminAnalytics() {
  const [analytics, setAnalytics] = useState({
    totalUsers: 0,
    newUsersThisMonth: 0,
    totalHostels: 0,
    totalBookings: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    averageBookingValue: 0,
    platformGrowth: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

      const { data: users } = await supabase.from('profiles').select('created_at');
      const { data: hostels } = await supabase.from('hostels').select('id');
      const { data: bookings } = await supabase.from('bookings').select('total_amount, created_at');

      const totalUsers = users?.length || 0;
      const newUsersThisMonth = users?.filter(u => new Date(u.created_at) >= firstDayOfMonth).length || 0;
      const newUsersLastMonth = users?.filter(
        u => new Date(u.created_at) >= lastMonth && new Date(u.created_at) < firstDayOfMonth
      ).length || 0;

      const totalHostels = hostels?.length || 0;
      const totalBookings = bookings?.length || 0;
      const totalRevenue = bookings?.reduce((sum, b) => sum + Number(b.total_amount), 0) || 0;

      const monthlyBookings = bookings?.filter(b => new Date(b.created_at) >= firstDayOfMonth) || [];
      const monthlyRevenue = monthlyBookings.reduce((sum, b) => sum + Number(b.total_amount), 0);

      const averageBookingValue = totalBookings > 0 ? totalRevenue / totalBookings : 0;

      const platformGrowth = newUsersLastMonth > 0
        ? ((newUsersThisMonth - newUsersLastMonth) / newUsersLastMonth) * 100
        : newUsersThisMonth > 0 ? 100 : 0;

      setAnalytics({
        totalUsers,
        newUsersThisMonth,
        totalHostels,
        totalBookings,
        totalRevenue,
        monthlyRevenue,
        averageBookingValue,
        platformGrowth,
      });
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
          <h1 className="text-3xl font-bold text-gray-900">System Analytics</h1>
          <p className="text-gray-600 mt-1">Comprehensive platform insights and metrics</p>
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
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <Users className="text-blue-600" size={24} />
                  </div>
                </div>
                <h3 className="text-sm text-gray-600 mb-1">Total Users</h3>
                <p className="text-3xl font-bold text-gray-900">{analytics.totalUsers}</p>
                <p className="text-xs text-green-600 mt-1">+{analytics.newUsersThisMonth} this month</p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-green-100 p-3 rounded-lg">
                    <Building2 className="text-green-600" size={24} />
                  </div>
                </div>
                <h3 className="text-sm text-gray-600 mb-1">Total Hostels</h3>
                <p className="text-3xl font-bold text-gray-900">{analytics.totalHostels}</p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-yellow-100 p-3 rounded-lg">
                    <TrendingUp className="text-yellow-600" size={24} />
                  </div>
                </div>
                <h3 className="text-sm text-gray-600 mb-1">Total Bookings</h3>
                <p className="text-3xl font-bold text-gray-900">{analytics.totalBookings}</p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-red-100 p-3 rounded-lg">
                    <DollarSign className="text-red-600" size={24} />
                  </div>
                </div>
                <h3 className="text-sm text-gray-600 mb-1">Total Revenue</h3>
                <p className="text-3xl font-bold text-gray-900">
                  KSh {(analytics.totalRevenue / 1000).toFixed(0)}K
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Revenue Insights</h2>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                    <span className="text-gray-600">This Month</span>
                    <span className="font-bold text-green-600">
                      KSh {analytics.monthlyRevenue.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                    <span className="text-gray-600">All Time</span>
                    <span className="font-bold text-blue-600">
                      KSh {analytics.totalRevenue.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                    <span className="text-gray-600">Average Booking Value</span>
                    <span className="font-bold text-gray-900">
                      KSh {Math.round(analytics.averageBookingValue).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Platform Growth</h2>
                <div className="space-y-4">
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg">
                    <p className="text-sm text-blue-900 mb-2">Monthly User Growth</p>
                    <p className="text-3xl font-bold text-blue-600">
                      {analytics.platformGrowth >= 0 ? '+' : ''}{analytics.platformGrowth.toFixed(1)}%
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-2">New Users This Month</p>
                    <p className="text-2xl font-bold text-gray-900">{analytics.newUsersThisMonth}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-2">Bookings per Hostel</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {analytics.totalHostels > 0
                        ? (analytics.totalBookings / analytics.totalHostels).toFixed(1)
                        : 0}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="font-semibold text-blue-900 mb-3">Key Metrics Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-blue-800 mb-1"><strong>User Base:</strong> {analytics.totalUsers} users</p>
                  <p className="text-blue-700">Growing at {analytics.platformGrowth.toFixed(1)}% monthly</p>
                </div>
                <div>
                  <p className="text-blue-800 mb-1"><strong>Inventory:</strong> {analytics.totalHostels} hostels</p>
                  <p className="text-blue-700">Average {(analytics.totalBookings / analytics.totalHostels || 0).toFixed(1)} bookings each</p>
                </div>
                <div>
                  <p className="text-blue-800 mb-1"><strong>Revenue:</strong> KSh {analytics.totalRevenue.toLocaleString()}</p>
                  <p className="text-blue-700">KSh {analytics.monthlyRevenue.toLocaleString()} this month</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
