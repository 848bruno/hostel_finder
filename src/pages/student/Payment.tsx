import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../components/layouts/DashboardLayout';
import { api, ApiError } from '../../lib/api';
import { CreditCard, Smartphone, Check, RefreshCw } from 'lucide-react';

const PAYMENT_REQUEST_TIMEOUT_MS = 120000; // 120 seconds for payment ops

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

interface PaymentStatusResponse {
  booking: BookingDoc;
  latestTransaction: {
    status: 'initiated' | 'pending' | 'succeeded' | 'failed' | 'cancelled';
    failureReason?: string;
  } | null;
}

const isBookingConfirmed = (booking: BookingDoc | null | undefined) => (
  booking?.status === 'confirmed' && booking.payment?.status === 'paid'
);

/**
 * Helper to format phone number to 254XXXXXXXXX
 */
const formatPhoneNumber = (phone: string) => {
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '254' + cleaned.substring(1);
  } else if (cleaned.startsWith('7') || cleaned.startsWith('1')) {
    cleaned = '254' + cleaned;
  }
  return cleaned;
};

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

  useEffect(() => { 
    if (bookingId) loadBooking(); 
    return () => { if (pollTimerRef.current) clearTimeout(pollTimerRef.current); };
  }, [bookingId]);

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

  const pollMpesaStatus = async (count: number) => {
    // Stop polling after ~2 minutes (40 attempts * 3 seconds)
    if (count > 40) {
      setStkPending(false);
      setProcessing(false);
      setError('Payment confirmation is taking longer than expected. Please check "My Bookings" in a few minutes.');
      return;
    }

    try {
      const result = await api.get<PaymentStatusResponse>(`/payments/${bookingId}/status`);

      // If booking is marked paid/confirmed by the webhook
      if (isBookingConfirmed(result.booking)) {
        navigate(`/student/payment-success/${bookingId}`);
        return;
      }

      // If the transaction specifically failed
      if (result.latestTransaction?.status === 'failed') {
        setStkPending(false);
        setProcessing(false);
        setError(result.latestTransaction.failureReason || 'Payment failed or was cancelled.');
        return;
      }

      // Still pending — schedule next poll
      setPollCount(count + 1);
      pollTimerRef.current = setTimeout(() => pollMpesaStatus(count + 1), 3000);
    } catch (err) {
      // On network error, keep trying until timeout
      pollTimerRef.current = setTimeout(() => pollMpesaStatus(count + 1), 3000);
    }
  };

  const handlePayment = async () => {
    if (!booking || !bookingId) return;
    
    setProcessing(true);
    setError('');

    try {
      const formattedPhone = booking.payment.method === 'mpesa' 
        ? formatPhoneNumber(mpesaPhone) 
        : undefined;

      if (booking.payment.method === 'mpesa' && (!formattedPhone || formattedPhone.length !== 12)) {
        throw new Error('Please enter a valid M-Pesa phone number.');
      }

      // Initialize transaction on backend
      const result = await api.post<{
        message: string;
        transaction: { status: string; providerCheckoutId?: string };
      }>('/payments/initialize', {
        bookingId,
        provider: booking.payment.method,
        phoneNumber: formattedPhone,
        idempotencyKey: `pay_${bookingId}_${Date.now()}`
      });

      if (booking.payment.method === 'mpesa') {
        startMpesaPolling('STK Push sent. Check your phone to enter your PIN.');
      } else {
        // Handle Credit Card success/redirect if applicable
        navigate(`/student/payment-success/${bookingId}`);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : (err as Error).message || 'Payment initialization failed.');
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
          <p className="text-red-600 font-medium">Booking not found or has been removed.</p>
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
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
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
            
            <div className={`w-full flex items-center gap-4 p-4 border-2 rounded-lg opacity-60 ${
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
                placeholder="07XXXXXXXX or 2547XXXXXXXX"
                value={mpesaPhone}
                onChange={(e) => setMpesaPhone(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              />
            </div>
          )}

          <button
            onClick={handlePayment}
            disabled={processing || (booking.payment.method === 'mpesa' && !mpesaPhone)}
            className="w-full py-4 bg-primary text-white rounded-lg hover:bg-primary/90 font-semibold text-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
          >
            {processing ? (
              <span className="flex items-center justify-center gap-2">
                <RefreshCw className="animate-spin" size={20} />
                Processing...
              </span>
            ) : (
              `Pay KSh ${booking.amount.toLocaleString()}`
            )}
          </button>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            Your payment information is secure and encrypted via SSL.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}