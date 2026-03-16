import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { DashboardLayout } from '../../components/layouts/DashboardLayout';
import { api, ApiError } from '../../lib/api';
import { setBookings } from '../../store/bookingSlice';
import type { BookingItem } from '../../store/bookingSlice';
import type { RootState, AppDispatch } from '../../store';
import {
  CreditCard, Calendar, DollarSign, FileText,
  RefreshCw, TrendingUp, CheckCircle, Clock, Receipt,
} from 'lucide-react';

export function StudentPaymentReport() {
  const dispatch = useDispatch<AppDispatch>();
  const { list: cachedBookings, loaded } = useSelector((state: RootState) => state.bookings);
  const [bookings, setLocalBookings] = useState<BookingItem[]>(cachedBookings);
  const [loading, setLoading] = useState(!loaded);
  const [refreshing, setRefreshing] = useState(false);
  const [actionError, setActionError] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [cancellingBookingId, setCancellingBookingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'confirmed' | 'pending_payment' | 'cancelled'>('all');

  useEffect(() => {
    if (loaded) {
      setLocalBookings(cachedBookings);
      setLoading(false);
    } else {
      loadBookings();
    }
  }, []);

  const loadBookings = async (silent = false) => {
    if (!silent) setLoading(true); else setRefreshing(true);
    try {
      const data = await api.get<BookingItem[]>('/bookings/me');
      const list = Array.isArray(data) ? data : [];
      setLocalBookings(list);
      dispatch(setBookings(list));
    } catch (err) {
      console.error('Failed to load bookings:', err);
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

  const confirmed = bookings.filter(b => b.status === 'confirmed' && b.payment?.status === 'paid');
  const pending = bookings.filter(b => b.status === 'pending_payment');
  const totalSpent = confirmed.reduce((sum, b) => sum + Number(b.amount ?? 0), 0);

  const filteredBookings = filter === 'all' ? bookings : bookings.filter(b => b.status === filter);

  const statusColors: Record<string, string> = {
    confirmed: 'bg-green-100 text-green-800 border-green-200',
    pending_payment: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    cancelled: 'bg-red-100 text-red-800 border-red-200',
  };

  const statusLabel = (s: string) =>
    s === 'pending_payment' ? 'Pending Payment' : s.charAt(0).toUpperCase() + s.slice(1);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Payment Report</h1>
            <p className="text-gray-600 mt-1">Your full payment history and receipts</p>
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

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-100 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-9 h-9 bg-emerald-100 rounded-lg flex items-center justify-center">
                <TrendingUp size={18} className="text-emerald-600" />
              </div>
              <span className="text-sm font-medium text-gray-600">Total Spent</span>
            </div>
            <p className="text-2xl font-extrabold text-gray-900 mt-2">
              KSh {totalSpent.toLocaleString()}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">from confirmed bookings</p>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-sky-50 border border-blue-100 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-9 h-9 bg-primary/20 rounded-lg flex items-center justify-center">
                <CheckCircle size={18} className="text-primary" />
              </div>
              <span className="text-sm font-medium text-gray-600">Confirmed Bookings</span>
            </div>
            <p className="text-2xl font-extrabold text-gray-900 mt-2">{confirmed.length}</p>
            <p className="text-xs text-gray-400 mt-0.5">fully paid</p>
          </div>

          <div className="bg-gradient-to-br from-yellow-50 to-amber-50 border border-yellow-100 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-9 h-9 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock size={18} className="text-yellow-600" />
              </div>
              <span className="text-sm font-medium text-gray-600">Pending Payment</span>
            </div>
            <p className="text-2xl font-extrabold text-gray-900 mt-2">{pending.length}</p>
            <p className="text-xs text-gray-400 mt-0.5">awaiting payment</p>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex flex-wrap gap-2">
          {(['all', 'confirmed', 'pending_payment', 'cancelled'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                filter === s
                  ? 'bg-primary text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {statusLabel(s)}
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

        {/* Table / Cards */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <Receipt size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500 font-medium">No records found</p>
            <Link
              to="/student/search"
              className="inline-block mt-4 px-5 py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              Find a Hostel
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBookings.map((booking) => (
              <div key={booking._id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                {/* Top bar */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                  <div>
                    <h3 className="font-bold text-gray-900">{booking.hostel?.name ?? 'Hostel'}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {booking.hostel?.location?.city ?? booking.hostel?.location?.address ?? ''}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusColors[booking.status] ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                    {statusLabel(booking.status)}
                  </span>
                </div>

                {/* Details grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-0 divide-x divide-y sm:divide-y-0 divide-gray-100">
                  <div className="px-5 py-4">
                    <div className="flex items-center gap-1.5 text-gray-400 text-xs mb-1">
                      <Calendar size={12} /> Check-in
                    </div>
                    <p className="font-semibold text-gray-800 text-sm">
                      {new Date(booking.startDate).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="px-5 py-4">
                    <div className="flex items-center gap-1.5 text-gray-400 text-xs mb-1">
                      <Calendar size={12} /> Check-out
                    </div>
                    <p className="font-semibold text-gray-800 text-sm">
                      {new Date(booking.endDate).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="px-5 py-4">
                    <div className="flex items-center gap-1.5 text-gray-400 text-xs mb-1">
                      <DollarSign size={12} /> Amount
                    </div>
                    <p className="font-bold text-gray-900 text-sm">KSh {Number(booking.amount).toLocaleString()}</p>
                  </div>
                  <div className="px-5 py-4">
                    <div className="flex items-center gap-1.5 text-gray-400 text-xs mb-1">
                      <CreditCard size={12} /> Method
                    </div>
                    <p className="font-semibold text-gray-800 text-sm capitalize">
                      {booking.payment?.method ?? '—'}
                    </p>
                  </div>
                </div>

                {/* Receipt / Reference row */}
                {(booking.receipt?.receiptNumber || booking.payment?.reference || booking.payment?.paidAt) && (
                  <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-gray-500">
                    {booking.receipt?.receiptNumber && (
                      <span className="flex items-center gap-1.5">
                        <FileText size={12} className="text-gray-400" />
                        Receipt: <span className="font-mono font-semibold text-gray-700">{booking.receipt.receiptNumber}</span>
                      </span>
                    )}
                    {booking.payment?.reference && (
                      <span className="flex items-center gap-1.5">
                        <Receipt size={12} className="text-gray-400" />
                        Ref: <span className="font-mono font-semibold text-gray-700">{booking.payment.reference}</span>
                      </span>
                    )}
                    {booking.payment?.paidAt && (
                      <span>
                        Paid on:{' '}
                        <span className="font-semibold text-gray-700">
                          {new Date(booking.payment.paidAt).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </span>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="px-6 py-3 border-t border-gray-100 flex items-center gap-3">
                  {booking.hostel?._id && (
                    <Link
                      to={`/student/hostel/${booking.hostel._id}`}
                      className="text-sm text-primary hover:text-primary/90 font-medium"
                    >
                      View Hostel →
                    </Link>
                  )}
                  {booking.status === 'pending_payment' && booking._id && (
                    <Link
                      to={`/student/payment/${booking._id}`}
                      className="text-sm text-amber-600 hover:text-amber-700 font-medium"
                    >
                      Complete Payment →
                    </Link>
                  )}
                  {booking.status === 'pending_payment' && booking.payment?.status !== 'paid' && booking._id && (
                    <button
                      type="button"
                      onClick={() => handleCancelBooking(booking._id)}
                      disabled={cancellingBookingId === booking._id}
                      className="text-sm font-medium text-red-600 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {cancellingBookingId === booking._id ? 'Cancelling...' : 'Cancel Booking →'}
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
