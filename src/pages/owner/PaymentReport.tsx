import { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layouts/DashboardLayout';
import { api, ApiError } from '../../lib/api';
import {
  CreditCard, Calendar, DollarSign, FileText,
  RefreshCw, TrendingUp, CheckCircle, Clock,
  Receipt, Users, Building2, Unlock,
} from 'lucide-react';

interface OwnerBooking {
  _id: string;
  status: 'pending_payment' | 'confirmed' | 'cancelled';
  startDate: string;
  endDate: string;
  amount: number;
  currency?: string;
  roomsBooked?: number;
  hostel?: {
    _id: string;
    name: string;
    location?: { city?: string; address?: string };
  };
  student?: {
    _id: string;
    username: string;
    email?: string;
  };
  payment?: {
    method?: string;
    status?: string;
    reference?: string;
    paidAt?: string;
  };
  receipt?: {
    receiptNumber?: string;
  };
}

export function OwnerPaymentReport() {
  const [bookings, setBookings] = useState<OwnerBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionMessage, setActionMessage] = useState('');
  const [actionError, setActionError] = useState('');
  const [releasingBookingId, setReleasingBookingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'confirmed' | 'pending_payment' | 'cancelled'>('all');
  const [hostelFilter, setHostelFilter] = useState<string>('all');

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async (silent = false) => {
    if (!silent) setLoading(true); else setRefreshing(true);
    try {
      const data = await api.get<OwnerBooking[]>('/bookings/owner');
      setBookings(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load owner bookings:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Unique hostels for filter dropdown
  const hostels = Array.from(
    new Map(
      bookings
        .filter(b => b.hostel?._id)
        .map(b => [b.hostel!._id, b.hostel!])
    ).values()
  );

  const confirmed = bookings.filter(b => b.status === 'confirmed');
  const pending = bookings.filter(b => b.status === 'pending_payment');
  const totalRevenue = confirmed.reduce((sum, b) => sum + Number(b.amount ?? 0), 0);

  const filteredBookings = bookings.filter((b) => {
    const matchStatus = filter === 'all' || b.status === filter;
    const matchHostel = hostelFilter === 'all' || b.hostel?._id === hostelFilter;
    return matchStatus && matchHostel;
  });

  const statusColors: Record<string, string> = {
    confirmed: 'bg-green-100 text-green-800 border-green-200',
    pending_payment: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    cancelled: 'bg-red-100 text-red-800 border-red-200',
  };

  const statusLabel = (s: string) =>
    s === 'pending_payment' ? 'Pending Payment' : s.charAt(0).toUpperCase() + s.slice(1);

  const handleReleaseBooking = async (bookingId: string) => {
    const confirmed = window.confirm('Release this unpaid booking and return the reserved room(s) to availability?');
    if (!confirmed) {
      return;
    }

    setActionMessage('');
    setActionError('');
    setReleasingBookingId(bookingId);

    try {
      const response = await api.post<{ message?: string }>(`/bookings/${bookingId}/release`);
      setActionMessage(response.message || 'Booking released successfully.');
      await loadBookings(true);
    } catch (error) {
      setActionError(error instanceof ApiError ? error.message : 'Failed to release booking.');
    } finally {
      setReleasingBookingId(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Payment Report</h1>
            <p className="text-gray-600 mt-1">All tenant payments across your hostels</p>
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

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-100 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-9 h-9 bg-emerald-100 rounded-lg flex items-center justify-center">
                <TrendingUp size={18} className="text-emerald-600" />
              </div>
              <span className="text-sm font-medium text-gray-600">Total Revenue</span>
            </div>
            <p className="text-2xl font-extrabold text-gray-900 mt-2">
              KSh {totalRevenue.toLocaleString()}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">from confirmed payments</p>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-sky-50 border border-blue-100 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-9 h-9 bg-primary/20 rounded-lg flex items-center justify-center">
                <CheckCircle size={18} className="text-primary" />
              </div>
              <span className="text-sm font-medium text-gray-600">Confirmed</span>
            </div>
            <p className="text-2xl font-extrabold text-gray-900 mt-2">{confirmed.length}</p>
            <p className="text-xs text-gray-400 mt-0.5">paid bookings</p>
          </div>

          <div className="bg-gradient-to-br from-yellow-50 to-amber-50 border border-yellow-100 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-9 h-9 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock size={18} className="text-yellow-600" />
              </div>
              <span className="text-sm font-medium text-gray-600">Pending</span>
            </div>
            <p className="text-2xl font-extrabold text-gray-900 mt-2">{pending.length}</p>
            <p className="text-xs text-gray-400 mt-0.5">awaiting payment</p>
          </div>

          <div className="bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-100 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-9 h-9 bg-violet-100 rounded-lg flex items-center justify-center">
                <Building2 size={18} className="text-violet-600" />
              </div>
              <span className="text-sm font-medium text-gray-600">Hostels</span>
            </div>
            <p className="text-2xl font-extrabold text-gray-900 mt-2">{hostels.length}</p>
            <p className="text-xs text-gray-400 mt-0.5">with bookings</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center">
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
          {hostels.length > 1 && (
            <select
              value={hostelFilter}
              onChange={(e) => setHostelFilter(e.target.value)}
              className="ml-auto px-4 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Hostels</option>
              {hostels.map((h) => (
                <option key={h._id} value={h._id}>{h.name}</option>
              ))}
            </select>
          )}
        </div>

        {/* Booking list */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <Receipt size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500 font-medium">No payment records found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBookings.map((booking) => (
              <div key={booking._id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                {/* Top bar */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                  <div className="flex items-start gap-4">
                    {/* Student avatar */}
                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold flex-shrink-0">
                      {booking.student?.username?.[0]?.toUpperCase() ?? 'S'}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{booking.student?.username ?? 'Student'}</p>
                      {booking.student?.email && (
                        <p className="text-xs text-gray-400">{booking.student.email}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {booking.hostel?.name && (
                      <span className="hidden sm:flex items-center gap-1.5 text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                        <Building2 size={11} />{booking.hostel.name}
                      </span>
                    )}
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusColors[booking.status] ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                      {statusLabel(booking.status)}
                    </span>
                  </div>
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
                      <Users size={12} /> Rooms
                    </div>
                    <p className="font-semibold text-gray-800 text-sm">
                      {booking.roomsBooked ?? 1} room{(booking.roomsBooked ?? 1) > 1 ? 's' : ''}
                    </p>
                  </div>
                </div>

                {/* Payment details row */}
                <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-gray-500">
                  <span className="flex items-center gap-1.5">
                    <CreditCard size={12} className="text-gray-400" />
                    Method: <span className="font-semibold text-gray-700 capitalize">{booking.payment?.method ?? '—'}</span>
                  </span>
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
                      Paid:{' '}
                      <span className="font-semibold text-gray-700">
                        {new Date(booking.payment.paidAt).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </span>
                  )}
                  {booking.status === 'pending_payment' && booking.payment?.status !== 'paid' && (
                    <button
                      type="button"
                      onClick={() => handleReleaseBooking(booking._id)}
                      disabled={releasingBookingId === booking._id}
                      className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Unlock size={12} />
                      {releasingBookingId === booking._id ? 'Releasing...' : 'Release Room'}
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
