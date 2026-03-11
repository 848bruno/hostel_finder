import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../components/layouts/DashboardLayout';
import { api, ApiError } from '../../lib/api';
import { CreditCard, Smartphone, Check, RefreshCw } from 'lucide-react';

interface BookingDoc {
  _id: string;
  hostel: { name: string; location?: { address?: string; city?: string } };
  roomsBooked: number;
  startDate: string;
  endDate: string;
  amount: number;
  payment: { method: 'mpesa' | 'card'; status: string };
  status: string;
}

export function Payment() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<BookingDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [mpesaPhone, setMpesaPhone] = useState('');
  // M-Pesa polling state
  const [stkPending, setStkPending] = useState(false);
  const [stkMessage, setStkMessage] = useState('');
  const [pollCount, setPollCount] = useState(0);
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { if (bookingId) loadBooking(); }, [bookingId]);

  const loadBooking = async () => {
    try {
      const data = await api.get<BookingDoc>(`/bookings/${bookingId}`);
      setBooking(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load booking.');
    } finally {
      setLoading(false);
    }
  };

  // Clean up polling timer on unmount
  useEffect(() => () => { if (pollTimerRef.current) clearTimeout(pollTimerRef.current); }, []);

  const pollMpesaStatus = async (count: number) => {
    if (count > 40) {
      // ~2 minutes of polling (40 × 3s)
      setStkPending(false);
      setProcessing(false);
      setError('Payment confirmation timed out. If you entered your PIN, please wait a moment and refresh your bookings page.');
      return;
    }
    try {
      const result = await api.post<{
        confirmed?: boolean;
        pending?: boolean;
        failed?: boolean;
        message?: string;
      }>(`/bookings/${bookingId}/verify-mpesa`, {});

      if (result.confirmed) {
        navigate(`/student/payment-success/${bookingId}`);
        return;
      }
      if (result.failed) {
        setStkPending(false);
        setProcessing(false);
        setError(result.message || 'Payment failed. Please try again.');
        return;
      }
      // Still pending — schedule next poll
      setPollCount(count + 1);
      pollTimerRef.current = setTimeout(() => pollMpesaStatus(count + 1), 3000);
    } catch {
      // Network error — retry
      pollTimerRef.current = setTimeout(() => pollMpesaStatus(count + 1), 3000);
    }
  };

  const handlePayment = async () => {
    if (!booking) return;
    setProcessing(true);
    setError('');
    try {
      if (booking.payment.method === 'mpesa') {
        const result = await api.post<{
          stkPending?: boolean;
          message?: string;
          confirmed?: boolean;
        }>(`/bookings/${bookingId}/confirm-payment`, { phone: mpesaPhone });

        if (result.stkPending) {
          setStkPending(true);
          setStkMessage(result.message || 'Check your phone for the M-Pesa prompt.');
          setPollCount(0);
          pollTimerRef.current = setTimeout(() => pollMpesaStatus(0), 3000);
          return;
        }
        // Immediately confirmed (shouldn't happen for mpesa but handle gracefully)
        navigate(`/student/payment-success/${bookingId}`);
      } else {
        await api.post(`/bookings/${bookingId}/confirm-payment`, {
          paymentReference: `CARD-${Date.now()}`,
        });
        navigate(`/student/payment-success/${bookingId}`);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Payment failed. Please try again.');
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </div>
      </DashboardLayout>
    );
  }

  // M-Pesa STK push sent — show waiting screen
  if (stkPending) {
    return (
      <DashboardLayout>
        <div className="max-w-md mx-auto mt-12 text-center space-y-6">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full">
            <RefreshCw className="text-green-600 animate-spin" size={40} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Waiting for Payment</h2>
            <p className="text-gray-600">{stkMessage}</p>
          </div>
          <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 text-sm text-primary text-left space-y-1">
            <p className="font-semibold">What to do:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Check your phone for the M-Pesa pop-up prompt</li>
              <li>Enter your M-Pesa PIN to confirm payment of <strong>KSh {booking?.amount.toLocaleString()}</strong></li>
              <li>Wait for confirmation — this page updates automatically</li>
            </ol>
          </div>
          <p className="text-xs text-gray-500">
            Checking status automatically… ({pollCount} check{pollCount !== 1 ? 's' : ''} so far)
          </p>
        </div>
      </DashboardLayout>
    );
  }

  if (!booking) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-red-600">Booking not found</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Complete Payment</h1>
          <p className="text-gray-600 mt-1">Secure your booking with payment</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Booking Summary</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Hostel:</span>
              <span className="font-semibold text-gray-900">{booking.hostel.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Rooms:</span>
              <span className="font-semibold text-gray-900">{booking.roomsBooked}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Check-in:</span>
              <span className="font-semibold text-gray-900">
                {new Date(booking.startDate).toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Check-out:</span>
              <span className="font-semibold text-gray-900">
                {new Date(booking.endDate).toLocaleDateString()}
              </span>
            </div>
            <div className="pt-3 border-t border-gray-200 flex justify-between">
              <span className="text-lg font-bold text-gray-900">Total Amount:</span>
              <span className="text-lg font-bold text-green-600">
                KSh {booking.amount.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Payment Method</h2>
          <div className="space-y-3 mb-6">
            <div className={`w-full flex items-center gap-4 p-4 border-2 rounded-lg ${
              booking.payment.method === 'mpesa' ? 'border-primary bg-primary/10' : 'border-gray-200'
            }`}>
              <Smartphone className={booking.payment.method === 'mpesa' ? 'text-primary' : 'text-gray-400'} />
              <div className="flex-1 text-left">
                <div className="font-semibold text-gray-900">M-Pesa</div>
                <div className="text-sm text-gray-600">Pay with your mobile money</div>
              </div>
              {booking.payment.method === 'mpesa' && <Check className="text-primary" />}
            </div>
            <div className={`w-full flex items-center gap-4 p-4 border-2 rounded-lg ${
              booking.payment.method === 'card' ? 'border-primary bg-primary/10' : 'border-gray-200'
            }`}>
              <CreditCard className={booking.payment.method === 'card' ? 'text-primary' : 'text-gray-400'} />
              <div className="flex-1 text-left">
                <div className="font-semibold text-gray-900">Credit/Debit Card</div>
                <div className="text-sm text-gray-600">Pay with Visa or Mastercard</div>
              </div>
              {booking.payment.method === 'card' && <Check className="text-primary" />}
            </div>
          </div>

          {booking.payment.method === 'mpesa' && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                M-Pesa Phone Number
              </label>
              <input
                type="tel"
                placeholder="07XXXXXXXX"
                value={mpesaPhone}
                onChange={(e) => setMpesaPhone(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          )}

          <button
            onClick={handlePayment}
            disabled={processing || (booking.payment.method === 'mpesa' && !mpesaPhone)}
            className="w-full py-4 bg-primary text-white rounded-lg hover:bg-primary/90 font-semibold text-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {processing ? 'Processing...' : `Pay KSh ${booking.amount.toLocaleString()}`}
          </button>

          <p className="text-xs text-gray-500 text-center mt-4">
            Your payment information is secure and encrypted
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
