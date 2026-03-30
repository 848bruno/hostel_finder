import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { DashboardLayout, useDashboardRefreshVersion } from '../../components/layouts/DashboardLayout';
import { api, ApiError } from '../../lib/api';
import { setBookings } from '../../store/bookingSlice';
import type { BookingItem } from '../../store/bookingSlice';
import type { RootState, AppDispatch } from '../../store';
import { Calendar, MapPin, DollarSign, FileText, RefreshCw } from 'lucide-react';

export function MyBookings() {
  const refreshVersion = useDashboardRefreshVersion();
  const dispatch = useDispatch<AppDispatch>();
  const { list: cachedBookings, loaded } = useSelector((state: RootState) => state.bookings);
  const [bookings, setLocalBookings] = useState<BookingItem[]>(cachedBookings);
  const [loading, setLoading] = useState(!loaded);
  const [refreshing, setRefreshing] = useState(false);
  const [actionError, setActionError] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [cancellingBookingId, setCancellingBookingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending_payment' | 'confirmed' | 'cancelled'>('all');

  useEffect(() => {
    if (refreshVersion > 0) {
      loadBookings(true);
    } else if (loaded) {
      setLocalBookings(cachedBookings);
      setLoading(false);
    } else {
      loadBookings();
    }
  }, [loaded, cachedBookings, refreshVersion]);

  const loadBookings = async (silent = false) => {
    if (!silent) setLoading(true); else setRefreshing(true);
    try {
      const data = await api.get<BookingItem[]>('/bookings/me');
      const list = Array.isArray(data) ? data : [];
      setLocalBookings(list);
      dispatch(setBookings(list));
    } catch (error) {
      console.error('Error loading bookings:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    const confirmed = window.confirm('Cancel this unpaid booking and release the reserved room?');
    if (!confirmed) {
      return;
    }

    setActionError('');
    setActionMessage('');
    setCancellingBookingId(bookingId);

    try {
      const response = await api.post<{ message?: string }>(`/bookings/${bookingId}/cancel`);
      setActionMessage(response.message || 'Booking cancelled successfully.');
      await loadBookings(true);
    } catch (error) {
      setActionError(error instanceof ApiError ? error.message : 'Failed to cancel booking.');
    } finally {
      setCancellingBookingId(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending_payment': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    if (status === 'pending_payment') return 'Pending Payment';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const filteredBookings = filter === 'all'
    ? bookings
    : bookings.filter(b => b.status === filter);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Bookings</h1>
            <p className="text-gray-600 mt-1">View and manage your hostel bookings</p>
          </div>
          <button
            onClick={() => loadBookings(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {(['all', 'pending_payment', 'confirmed', 'cancelled'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg font-medium capitalize transition-colors ${
                filter === status
                  ? 'bg-primary text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {status === 'pending_payment' ? 'Pending Payment' : status}
            </button>
          ))}
        </div>

        {actionMessage && (
          <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {actionMessage}
          </div>
        )}

        {actionError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {actionError}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <Calendar size={48} className="mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600 mb-4">No bookings found</p>
            <Link
              to="/student/search"
              className="inline-block px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 font-medium transition-colors"
            >
              Search Hostels
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBookings.map((booking) => (
              <div key={booking._id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{booking.hostel?.name ?? 'Hostel'}</h3>
                    <div className="flex items-center gap-2 text-gray-600 mb-2">
                      <MapPin size={16} />
                      <span className="text-sm">
                        {booking.hostel?.location?.address ?? booking.hostel?.location?.city ?? ''}
                      </span>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(booking.status)}`}>
                    {getStatusLabel(booking.status)}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 text-gray-600 mb-1">
                      <Calendar size={16} />
                      <span className="text-sm">Check-in</span>
                    </div>
                    <div className="font-semibold text-gray-900">
                      {new Date(booking.startDate).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 text-gray-600 mb-1">
                      <Calendar size={16} />
                      <span className="text-sm">Check-out</span>
                    </div>
                    <div className="font-semibold text-gray-900">
                      {new Date(booking.endDate).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 text-gray-600 mb-1">
                      <DollarSign size={16} />
                      <span className="text-sm">Total Amount</span>
                    </div>
                    <div className="font-semibold text-gray-900">
                      KSh {Number(booking.amount).toLocaleString()}
                    </div>
                  </div>
                </div>

                {booking.payment?.method && (
                  <div className="mb-4">
                    <span className="text-sm text-gray-600">Payment: </span>
                    <span className="font-semibold text-gray-900 capitalize">{booking.payment.method}</span>
                    {' '}
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      booking.payment.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>{booking.payment.status}</span>
                  </div>
                )}

                <div className="flex gap-3">
                  {booking.hostel?._id && (
                    <Link
                      to={`/student/hostel/${booking.hostel._id}`}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors flex items-center gap-2"
                    >
                      <FileText size={16} />
                      View Details
                    </Link>
                  )}
                  {booking.status === 'pending_payment' && booking.payment?.status !== 'paid' && (
                    <button
                      type="button"
                      onClick={() => handleCancelBooking(booking._id)}
                      disabled={cancellingBookingId === booking._id}
                      className="px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {cancellingBookingId === booking._id ? 'Cancelling...' : 'Cancel Booking'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
