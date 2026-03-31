import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../components/layouts/DashboardLayout';
import { api, ApiError } from '../../lib/api';
import { CreditCard, Smartphone, Check, RefreshCw } from 'lucide-react';

const PAYMENT_REQUEST_TIMEOUT_MS = 30000;

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

const isBookingConfirmed = (booking: BookingDoc | null | undefined) => (
  booking?.status === 'confirmed' && booking.payment?.status === 'paid'
);

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
      if (isBookingConfirmed(data)) {
        navigate(`/student/payment-success/${bookingId}`, { replace: true });
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load booking.');
    } finally {
      setLoading(false);
    }
  };

  const startMpesaPolling = (message?: string) => {
    if (pollTimerRef.current) {
      clearTimeout(pollTimerRef.current);
    }

    setProcessing(false);
    setStkPending(true);
    setStkMessage(message || 'Check your phone for the M-Pesa prompt.');
    setPollCount(0);
    pollTimerRef.current = setTimeout(() => pollMpesaStatus(0), 3000);
  };

  const reconcileBookingState = async () => {
    if (!bookingId) {
      return { state: 'unknown' as const, booking: null };
    }

    try {
      const latestBooking = await api.get<BookingDoc>(`/bookings/${bookingId}`, {
        timeoutMs: PAYMENT_REQUEST_TIMEOUT_MS,
      });

      setBooking(latestBooking);

      if (isBookingConfirmed(latestBooking)) {
        navigate(`/student/payment-success/${bookingId}`, { replace: true });
        return { state: 'confirmed' as const, booking: latestBooking };
      }

      if (latestBooking.payment?.status === 'failed') {
        return { state: 'failed' as const, booking: latestBooking };
      }

      if (latestBooking.payment?.method === 'mpesa' && latestBooking.payment?.status === 'pending') {
        return { state: 'pending' as const, booking: latestBooking };
      }

      return { state: 'unknown' as const, booking: latestBooking };
    } catch {
      return { state: 'unknown' as const, booking: null };
    }
  };

  // Clean up polling timer on unmount
  useEffect(() => () => { if (pollTimerRef.current) clearTimeout(pollTimerRef.current); }, []);

  const pollMpesaStatus = async (count: number) => {
    if (count > 40) {
      const reconciled = await reconcileBookingState();
      if (reconciled.state !== 'confirmed') {
        setStkPending(false);
        setProcessing(false);
        setError('Payment confirmation is taking longer than expected. Refresh My Bookings in a moment before retrying.');
      }
      return;
    }
    try {
      const result = await api.post<{
        confirmed?: boolean;
        pending?: boolean;
        failed?: boolean;
        message?: string;
      }>(`/bookings/${bookingId}/verify-mpesa`, {}, { timeoutMs: PAYMENT_REQUEST_TIMEOUT_MS });

      if (result.confirmed) {
        navigate(`/student/payment-success/${bookingId}`);
        return;
      }
      if (result.failed) {
        const reconciled = await reconcileBookingState();
        if (reconciled.state !== 'confirmed') {
          setStkPending(false);
          setProcessing(false);
          setError(result.message || 'Payment failed. Please try again.');
        }
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
        }>(`/bookings/${bookingId}/confirm-payment`, { phone: mpesaPhone }, { timeoutMs: PAYMENT_REQUEST_TIMEOUT_MS });

        if (result.stkPending) {
          startMpesaPolling(result.message);
          return;
        }
        // Immediately confirmed (shouldn't happen for mpesa but handle gracefully)
        navigate(`/student/payment-success/${bookingId}`);
      } else {
        await api.post(`/bookings/${bookingId}/confirm-payment`, {
          paymentReference: `CARD-${Date.now()}`,
        }, { timeoutMs: PAYMENT_REQUEST_TIMEOUT_MS });
        navigate(`/student/payment-success/${bookingId}`);
      }
    } catch (err) {
      const apiError = err instanceof ApiError ? err : null;

      if (booking.payment.method === 'mpesa') {
        const reconciled = await reconcileBookingState();
        if (reconciled.state === 'confirmed') {
          return;
        }

        if (reconciled.state === 'pending') {
          startMpesaPolling('M-Pesa prompt may already have been sent. Complete the payment on your phone.');
          return;
        }
      }

      setError(apiError ? apiError.message : 'Payment failed. Please try again.');
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
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
            <RefreshCw className="text-green-600 animate-spin" size={40} />
          </div>
          <div>
            <h2 className="mb-2 text-2xl font-bold text-foreground">Waiting for Payment</h2>
            <p className="text-muted-foreground">{stkMessage}</p>
          </div>
          <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 text-sm text-primary text-left space-y-1">
            <p className="font-semibold">What to do:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Check your phone for the M-Pesa pop-up prompt</li>
              <li>Enter your M-Pesa PIN to confirm payment of <strong>KSh {booking?.amount.toLocaleString()}</strong></li>
              <li>Wait for confirmation — this page updates automatically</li>
            </ol>
          </div>
          <p className="text-xs text-muted-foreground">
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
          <h1 className="text-3xl font-bold text-foreground">Complete Payment</h1>
          <p className="mt-1 text-muted-foreground">Secure your booking with payment</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
        )}

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-bold text-foreground">Booking Summary</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Hostel:</span>
              <span className="font-semibold text-foreground">{booking.hostel.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Rooms:</span>
              <span className="font-semibold text-foreground">{booking.roomsBooked}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Check-in:</span>
              <span className="font-semibold text-foreground">
                {new Date(booking.startDate).toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Check-out:</span>
              <span className="font-semibold text-foreground">
                {new Date(booking.endDate).toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between border-t border-border pt-3">
              <span className="text-lg font-bold text-foreground">Total Amount:</span>
              <span className="text-lg font-bold text-green-600">
                KSh {booking.amount.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-bold text-foreground">Payment Method</h2>
          <div className="space-y-3 mb-6">
            <div className={`w-full flex items-center gap-4 p-4 border-2 rounded-lg ${
              booking.payment.method === 'mpesa' ? 'border-primary bg-primary/10' : 'border-border bg-background'
            }`}>
              <Smartphone className={booking.payment.method === 'mpesa' ? 'text-primary' : 'text-muted-foreground'} />
              <div className="flex-1 text-left">
                <div className="font-semibold text-foreground">M-Pesa</div>
                <div className="text-sm text-muted-foreground">Pay with your mobile money</div>
              </div>
              {booking.payment.method === 'mpesa' && <Check className="text-primary" />}
            </div>
            <div className={`w-full flex items-center gap-4 p-4 border-2 rounded-lg ${
              booking.payment.method === 'card' ? 'border-primary bg-primary/10' : 'border-border bg-background'
            }`}>
              <CreditCard className={booking.payment.method === 'card' ? 'text-primary' : 'text-muted-foreground'} />
              <div className="flex-1 text-left">
                <div className="font-semibold text-foreground">Credit/Debit Card</div>
                <div className="text-sm text-muted-foreground">Pay with Visa or Mastercard</div>
              </div>
              {booking.payment.method === 'card' && <Check className="text-primary" />}
            </div>
          </div>

          {booking.payment.method === 'mpesa' && (
            <div className="mb-6">
              <label className="mb-2 block text-sm font-medium text-foreground">
                M-Pesa Phone Number
              </label>
              <input
                type="tel"
                placeholder="07XXXXXXXX"
                value={mpesaPhone}
                onChange={(e) => setMpesaPhone(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
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

          <p className="mt-4 text-center text-xs text-muted-foreground">
            Your payment information is secure and encrypted
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
