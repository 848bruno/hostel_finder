import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { DashboardLayout } from '../../components/layouts/DashboardLayout';
import { api } from '../../lib/api';
import { getToken } from '../../lib/api';
import { CheckCircle, Download, Home } from 'lucide-react';

interface BookingDoc {
  _id: string;
  hostel: { name: string; location?: { address?: string; city?: string } };
  student: { username: string; email: string };
  roomsBooked: number;
  startDate: string;
  endDate: string;
  amount: number;
  currency: string;
  status: string;
  payment: { method: string; status: string; reference?: string; paidAt?: string };
  receipt?: { receiptNumber?: string; issuedAt?: string };
}

export function PaymentSuccess() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const [booking, setBooking] = useState<BookingDoc | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (bookingId) loadBooking(); }, [bookingId]);

  const loadBooking = async () => {
    try {
      const data = await api.get<BookingDoc>(`/bookings/${bookingId}`);
      setBooking(data);
    } catch (error) {
      console.error('Error loading booking:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadReceipt = () => {
    const token = getToken();
    const url = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5100/api'}/bookings/${bookingId}/receipt`;
    const a = document.createElement('a');
    a.href = url;
    a.setAttribute('target', '_blank');
    // Attach auth header isn't possible via anchor — open in new tab; backend handles PDF
    if (token) {
      fetch(url, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.blob())
        .then(blob => {
          const objUrl = URL.createObjectURL(blob);
          a.href = objUrl;
          a.download = `receipt-${bookingId}.pdf`;
          a.click();
          URL.revokeObjectURL(objUrl);
        });
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
            <CheckCircle className="text-green-600" size={48} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
          <p className="text-gray-600">Your booking has been confirmed</p>
        </div>

        {booking && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Booking Details</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Booking ID:</span>
                <span className="font-mono text-sm text-gray-900">{booking._id.slice(-8)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Hostel:</span>
                <span className="font-semibold text-gray-900">{booking.hostel.name}</span>
              </div>
              {booking.hostel.location?.address && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Address:</span>
                  <span className="text-gray-900">{booking.hostel.location.address}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Rooms:</span>
                <span className="font-semibold text-gray-900">{booking.roomsBooked}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Check-in:</span>
                <span className="font-semibold text-gray-900">{new Date(booking.startDate).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Check-out:</span>
                <span className="font-semibold text-gray-900">{new Date(booking.endDate).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        )}

        {booking?.payment && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Payment Information</h2>
            <div className="space-y-3">
              {booking.receipt?.receiptNumber && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Receipt No:</span>
                  <span className="font-mono text-sm text-gray-900">{booking.receipt.receiptNumber}</span>
                </div>
              )}
              {booking.payment.reference && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Reference:</span>
                  <span className="font-mono text-sm text-gray-900">{booking.payment.reference}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Payment Method:</span>
                <span className="text-gray-900 capitalize">{booking.payment.method}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Amount Paid:</span>
                <span className="font-semibold text-green-600">KSh {booking.amount.toLocaleString()}</span>
              </div>
              {booking.payment.paidAt && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Date:</span>
                  <span className="text-gray-900">{new Date(booking.payment.paidAt).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="bg-primary/10 border border-primary/30 rounded-lg p-4">
          <p className="text-sm text-primary">
            A confirmation email has been sent to your registered email address with all the booking details.
          </p>
        </div>

        <div className="flex gap-4">
          <button
            onClick={downloadReceipt}
            className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors flex items-center justify-center gap-2">
            <Download size={20} />
            Download Receipt
          </button>
          <Link
            to="/student/dashboard"
            className="flex-1 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 font-medium transition-colors flex items-center justify-center gap-2"
          >
            <Home size={20} />
            Go to Dashboard
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}
