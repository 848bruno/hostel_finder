import { useEffect, useState } from 'react';
import { DashboardLayout, useDashboardRefreshVersion } from '../../components/layouts/DashboardLayout';
import { api } from '../../lib/api';
import { TrendingUp, Users, Building2, DollarSign } from 'lucide-react';

interface BookingDoc {
  _id: string;
  amount: number;
  payment: { status: string };
  createdAt: string;
}

export function AdminAnalytics() {
  const refreshVersion = useDashboardRefreshVersion();
  const [analytics, setAnalytics] = useState({
    totalUsers: 0,
    totalHostels: 0,
    totalBookings: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    averageBookingValue: 0,
    pendingOwners: 0,
    pendingHostels: 0,
    platformGrowth: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadAnalytics(); }, [refreshVersion]);

  const loadAnalytics = async () => {
    try {
      const [adminStats, bookingsData] = await Promise.all([
        api.get<{ totalStudents: number; totalOwners: number; totalHostels: number; pendingOwners: number; pendingHostels: number }>('/admin/stats'),
        api.get<{ bookings: BookingDoc[]; total: number }>('/bookings/admin?limit=500'),
      ]);

      const bookings = bookingsData.bookings ?? [];
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const paidBookings = bookings.filter(b => b.payment.status === 'paid');
      const totalRevenue = paidBookings.reduce((sum, b) => sum + b.amount, 0);
      const monthlyRevenue = paidBookings
        .filter(b => new Date(b.createdAt) >= firstDayOfMonth)
        .reduce((sum, b) => sum + b.amount, 0);

      setAnalytics({
        totalUsers: adminStats.totalStudents + adminStats.totalOwners,
        totalHostels: adminStats.totalHostels,
        totalBookings: bookingsData.total,
        totalRevenue,
        monthlyRevenue,
        averageBookingValue: paidBookings.length > 0 ? totalRevenue / paidBookings.length : 0,
        pendingOwners: adminStats.pendingOwners,
        pendingHostels: adminStats.pendingHostels,
        platformGrowth: 0,
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
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-primary/20 p-3 rounded-lg">
                    <Users className="text-primary" size={24} />
                  </div>
                </div>
                <h3 className="text-sm text-gray-600 mb-1">Total Users</h3>
              <p className="text-3xl font-bold text-gray-900">{analytics.totalUsers}</p>
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
                    <span className="font-bold text-primary">
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
                    <p className="text-3xl font-bold text-primary">
                      {analytics.platformGrowth >= 0 ? '+' : ''}{analytics.platformGrowth.toFixed(1)}%
                    </p>
                  </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-2">Pending Owners</p>
                    <p className="text-2xl font-bold text-gray-900">{analytics.pendingOwners}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-2">Pending Hostels</p>
                    <p className="text-2xl font-bold text-gray-900">{analytics.pendingHostels}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-primary/10 border border-primary/30 rounded-lg p-6">
              <h3 className="font-semibold text-blue-900 mb-3">Key Metrics Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-primary mb-1"><strong>User Base:</strong> {analytics.totalUsers} users</p>
                  <p className="text-primary/90">{analytics.pendingOwners} owner{analytics.pendingOwners !== 1 ? 's' : ''} pending approval</p>
                </div>
                <div>
                  <p className="text-primary mb-1"><strong>Inventory:</strong> {analytics.totalHostels} hostels</p>
                  <p className="text-primary/90">Average {(analytics.totalBookings / analytics.totalHostels || 0).toFixed(1)} bookings each</p>
                </div>
                <div>
                  <p className="text-primary mb-1"><strong>Revenue:</strong> KSh {analytics.totalRevenue.toLocaleString()}</p>
                  <p className="text-primary/90">KSh {analytics.monthlyRevenue.toLocaleString()} this month</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
