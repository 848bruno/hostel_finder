import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '../../components/layouts/DashboardLayout';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../lib/api';
import { Building2, Calendar, TrendingUp, Search } from 'lucide-react';

interface BookingItem {
  _id: string;
  status: string;
  startDate: string;
  endDate: string;
  amount: number;
  hostel?: { _id: string; name: string; location?: { address?: string; city?: string } };
}

export function StudentDashboard() {
  const { profile } = useAuth();
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [stats, setStats] = useState({
    activeBookings: 0,
    upcomingBookings: 0,
    totalSpent: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const bookingsData = await api.get<BookingItem[]>('/bookings/me');
      const recent = bookingsData.slice(0, 5);
      setBookings(recent);

      const active = bookingsData.filter((b) => b.status === 'confirmed').length;
      const upcoming = bookingsData.filter(
        (b) =>
          b.status === 'pending_payment' ||
          (b.status === 'confirmed' && new Date(b.startDate) > new Date())
      ).length;
      const total = bookingsData.reduce((sum, b) => sum + Number(b.amount), 0);

      setStats({ activeBookings: active, upcomingBookings: upcoming, totalSpent: total });
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending_payment': return 'bg-yellow-100 text-yellow-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Welcome back, {profile?.username}!</h1>
          <p className="text-gray-600 mt-1">Here's your hostel booking overview</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Active Bookings</p>
                <p className="text-3xl font-bold text-gray-900">{stats.activeBookings}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <Building2 className="text-blue-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Upcoming</p>
                <p className="text-3xl font-bold text-gray-900">{stats.upcomingBookings}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <Calendar className="text-green-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Spent</p>
                <p className="text-3xl font-bold text-gray-900">KSh {stats.totalSpent.toLocaleString()}</p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-lg">
                <TrendingUp className="text-yellow-600" size={24} />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-8 rounded-xl shadow-lg text-white">
          <h2 className="text-2xl font-bold mb-2">Looking for a new hostel?</h2>
          <p className="mb-4 text-blue-100">Explore verified hostels near your campus</p>
          <Link
            to="/student/search"
            className="inline-flex items-center px-6 py-3 bg-white text-blue-600 rounded-lg hover:bg-blue-50 font-semibold transition-colors"
          >
            <Search size={20} className="mr-2" />
            Search Hostels
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Recent Bookings</h2>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="text-center py-8 text-gray-500">Loading...</div>
            ) : bookings.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Building2 size={48} className="mx-auto mb-4 text-gray-400" />
                <p>No bookings yet</p>
                <Link to="/student/search" className="text-blue-600 hover:underline mt-2 inline-block">
                  Find a hostel
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {bookings.map((booking) => (
              <div key={booking._id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{booking.hostel?.name ?? 'Hostel'}</h3>
                      <p className="text-sm text-gray-600 mt-1">{booking.hostel?.location?.address ?? booking.hostel?.location?.city ?? ''}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                        <span>{new Date(booking.startDate).toLocaleDateString()} - {new Date(booking.endDate).toLocaleDateString()}</span>
                        <span>KSh {Number(booking.amount).toLocaleString()}</span>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(booking.status)}`}>
                      {booking.status}
                    </span>
                  </div>
                ))}
                <Link
                  to="/student/bookings"
                  className="block text-center text-blue-600 hover:text-blue-700 font-medium mt-4"
                >
                  View all bookings
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
