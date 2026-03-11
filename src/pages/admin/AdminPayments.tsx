import { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layouts/DashboardLayout';
import { api } from '../../lib/api';
import { CreditCard, Calendar } from 'lucide-react';

interface BookingDoc {
  _id: string;
  student: { username: string; email: string };
  hostel: { name: string };
  amount: number;
  payment: { method: string; status: string; paidAt?: string; reference?: string };
  status: string;
  createdAt: string;
}

export function AdminPayments() {
  const [bookings, setBookings] = useState<BookingDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'paid' | 'pending' | 'failed'>('all');

  useEffect(() => { loadPayments(); }, []);

  const loadPayments = async () => {
    try {
      const data = await api.get<{ bookings: BookingDoc[] }>('/bookings/admin?limit=100');
      setBookings(data.bookings ?? []);
    } catch (error) {
      console.error('Error loading payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPayments = filter === 'all'
    ? bookings
    : bookings.filter(b => b.payment.status === filter);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const totalRevenue = bookings
    .filter(b => b.payment.status === 'paid')
    .reduce((sum, b) => sum + b.amount, 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payments</h1>
          <p className="text-gray-600 mt-1">View all transactions on the platform</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
            <p className="text-3xl font-bold text-green-600">
              KSh {totalRevenue.toLocaleString()}
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <p className="text-sm text-gray-600 mb-1">Total Bookings</p>
            <p className="text-3xl font-bold text-gray-900">{bookings.length}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <p className="text-sm text-gray-600 mb-1">Paid</p>
            <p className="text-3xl font-bold text-gray-900">
              {bookings.filter(b => b.payment.status === 'paid').length}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {['all', 'paid', 'pending', 'failed'].map((filterOption) => (
            <button
              key={filterOption}
              onClick={() => setFilter(filterOption as typeof filter)}
              className={`px-4 py-2 rounded-lg font-medium capitalize transition-colors ${
                filter === filterOption
                  ? 'bg-primary text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {filterOption}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <CreditCard size={48} className="mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">No payments found</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Transaction ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Hostel
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Method
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredPayments.map((booking) => (
                    <tr key={booking._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <span className="font-mono text-sm text-gray-900">
                          {booking.payment.reference || booking._id.slice(-8)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-gray-900">{booking.student?.username ?? '—'}</div>
                          <div className="text-sm text-gray-500">{booking.student?.email ?? '—'}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {booking.hostel?.name ?? '—'}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-green-600">
                          KSh {booking.amount.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 capitalize">
                        {booking.payment.method}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar size={16} />
                          {booking.payment.paidAt
                            ? new Date(booking.payment.paidAt).toLocaleDateString()
                            : new Date(booking.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(booking.payment.status)}`}>
                          {booking.payment.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
