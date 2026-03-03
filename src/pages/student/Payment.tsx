import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../components/layouts/DashboardLayout';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Booking, Hostel } from '../../types/database';
import { CreditCard, Smartphone, Check } from 'lucide-react';

export function Payment() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [booking, setBooking] = useState<Booking & { hostel: Hostel } | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'mpesa' | 'card'>('mpesa');
  const [mpesaPhone, setMpesaPhone] = useState('');

  useEffect(() => {
    if (bookingId) {
      loadBooking();
    }
  }, [bookingId]);

  const loadBooking = async () => {
    try {
      const { data } = await supabase
        .from('bookings')
        .select(`
          *,
          hostel:hostels(*)
        `)
        .eq('id', bookingId)
        .single();

      if (data) {
        setBooking(data as Booking & { hostel: Hostel });
      }
    } catch (error) {
      console.error('Error loading booking:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!booking || !profile) return;

    setProcessing(true);
    try {
      const transactionId = `TXN${Date.now()}`;

      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          booking_id: booking.id,
          student_id: profile.id,
          amount: booking.total_amount,
          payment_method: paymentMethod,
          transaction_id: transactionId,
          status: 'completed',
          paid_at: new Date().toISOString(),
          receipt_url: null,
        });

      if (paymentError) throw paymentError;

      const { error: bookingError } = await supabase
        .from('bookings')
        .update({ status: 'confirmed' })
        .eq('id', booking.id);

      if (bookingError) throw bookingError;

      const { error: hostelError } = await supabase
        .from('hostels')
        .update({
          available_rooms: booking.hostel.available_rooms - 1
        })
        .eq('id', booking.hostel_id);

      if (hostelError) throw hostelError;

      navigate(`/student/payment-success/${booking.id}`);
    } catch (error) {
      console.error('Error processing payment:', error);
      alert('Payment failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!booking) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-gray-600">Booking not found</p>
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

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Booking Summary</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Hostel:</span>
              <span className="font-semibold text-gray-900">{booking.hostel.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Check-in:</span>
              <span className="font-semibold text-gray-900">
                {new Date(booking.start_date).toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Check-out:</span>
              <span className="font-semibold text-gray-900">
                {new Date(booking.end_date).toLocaleDateString()}
              </span>
            </div>
            <div className="pt-3 border-t border-gray-200 flex justify-between">
              <span className="text-lg font-bold text-gray-900">Total Amount:</span>
              <span className="text-lg font-bold text-green-600">
                KSh {Number(booking.total_amount).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Payment Method</h2>
          <div className="space-y-3 mb-6">
            <button
              onClick={() => setPaymentMethod('mpesa')}
              className={`w-full flex items-center gap-4 p-4 border-2 rounded-lg transition-colors ${
                paymentMethod === 'mpesa'
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Smartphone className={paymentMethod === 'mpesa' ? 'text-blue-600' : 'text-gray-400'} />
              <div className="flex-1 text-left">
                <div className="font-semibold text-gray-900">M-Pesa</div>
                <div className="text-sm text-gray-600">Pay with your mobile money</div>
              </div>
              {paymentMethod === 'mpesa' && <Check className="text-blue-600" />}
            </button>

            <button
              onClick={() => setPaymentMethod('card')}
              className={`w-full flex items-center gap-4 p-4 border-2 rounded-lg transition-colors ${
                paymentMethod === 'card'
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <CreditCard className={paymentMethod === 'card' ? 'text-blue-600' : 'text-gray-400'} />
              <div className="flex-1 text-left">
                <div className="font-semibold text-gray-900">Credit/Debit Card</div>
                <div className="text-sm text-gray-600">Pay with Visa or Mastercard</div>
              </div>
              {paymentMethod === 'card' && <Check className="text-blue-600" />}
            </button>
          </div>

          {paymentMethod === 'mpesa' && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                M-Pesa Phone Number
              </label>
              <input
                type="tel"
                placeholder="07XXXXXXXX"
                value={mpesaPhone}
                onChange={(e) => setMpesaPhone(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          <button
            onClick={handlePayment}
            disabled={processing || (paymentMethod === 'mpesa' && !mpesaPhone)}
            className="w-full py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold text-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {processing ? 'Processing...' : `Pay KSh ${Number(booking.total_amount).toLocaleString()}`}
          </button>

          <p className="text-xs text-gray-500 text-center mt-4">
            Your payment information is secure and encrypted
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
