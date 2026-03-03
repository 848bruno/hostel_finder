import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../components/layouts/DashboardLayout';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Hostel, Amenity, Review } from '../../types/database';
import {
  MapPin, DollarSign, Users, Wifi, Car, Star,
  Shield, Dumbbell, Book, Sparkles, Calendar, ArrowLeft
} from 'lucide-react';

export function HostelDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [hostel, setHostel] = useState<Hostel | null>(null);
  const [amenities, setAmenities] = useState<Amenity | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingModal, setBookingModal] = useState(false);
  const [bookingData, setBookingData] = useState({
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    if (id) {
      loadHostelDetails();
      loadReviews();
    }
  }, [id]);

  const loadHostelDetails = async () => {
    try {
      const { data: hostelData } = await supabase
        .from('hostels')
        .select('*')
        .eq('id', id)
        .single();

      const { data: amenitiesData } = await supabase
        .from('amenities')
        .select('*')
        .eq('hostel_id', id)
        .maybeSingle();

      setHostel(hostelData);
      setAmenities(amenitiesData);
    } catch (error) {
      console.error('Error loading hostel:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadReviews = async () => {
    try {
      const { data } = await supabase
        .from('reviews')
        .select('*')
        .eq('hostel_id', id)
        .order('created_at', { ascending: false });

      if (data) setReviews(data);
    } catch (error) {
      console.error('Error loading reviews:', error);
    }
  };

  const handleBooking = async () => {
    if (!bookingData.startDate || !bookingData.endDate || !hostel) return;

    try {
      const start = new Date(bookingData.startDate);
      const end = new Date(bookingData.endDate);
      const months = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30));
      const totalAmount = months * Number(hostel.price_per_month);

      const { data, error } = await supabase
        .from('bookings')
        .insert({
          student_id: profile!.id,
          hostel_id: hostel.id,
          start_date: bookingData.startDate,
          end_date: bookingData.endDate,
          status: 'pending',
          total_amount: totalAmount,
          room_number: null,
        })
        .select()
        .single();

      if (error) throw error;

      navigate(`/student/payment/${data.id}`);
    } catch (error) {
      console.error('Error creating booking:', error);
      alert('Failed to create booking. Please try again.');
    }
  };

  const amenityIcons = {
    wifi: <Wifi size={20} />,
    parking: <Car size={20} />,
    security: <Shield size={20} />,
    gym: <Dumbbell size={20} />,
    study_room: <Book size={20} />,
    cleaning_service: <Sparkles size={20} />,
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

  if (!hostel) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-gray-600">Hostel not found</p>
        </div>
      </DashboardLayout>
    );
  }

  const avgRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft size={20} />
          Back to search
        </button>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="h-64 bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white">
            <div className="text-center">
              <svg className="w-24 h-24 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <p className="text-sm opacity-80">Hostel Image</p>
            </div>
          </div>

          <div className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{hostel.name}</h1>
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin size={20} />
                  <span>{hostel.address}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-yellow-50 px-4 py-2 rounded-lg">
                <Star size={20} className="text-yellow-600" fill="currentColor" />
                <span className="font-bold text-gray-900">{avgRating.toFixed(1)}</span>
                <span className="text-gray-600">({reviews.length})</span>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">Price per Month</div>
                <div className="flex items-center gap-1 text-green-600 font-bold text-xl">
                  <DollarSign size={20} />
                  KSh {Number(hostel.price_per_month).toLocaleString()}
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">Gender Type</div>
                <div className="flex items-center gap-2 font-semibold text-gray-900 capitalize">
                  <Users size={20} />
                  {hostel.gender_type}
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">Available Rooms</div>
                <div className="font-semibold text-gray-900 text-xl">{hostel.available_rooms}</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">Total Rooms</div>
                <div className="font-semibold text-gray-900 text-xl">{hostel.total_rooms}</div>
              </div>
            </div>

            {hostel.description && (
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-3">About this Hostel</h2>
                <p className="text-gray-700 leading-relaxed">{hostel.description}</p>
              </div>
            )}

            {amenities && (
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-3">Amenities</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {Object.entries(amenities).map(([key, value]) => {
                    if (key === 'id' || key === 'hostel_id' || !value) return null;
                    return (
                      <div key={key} className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg">
                        <div className="text-blue-600">
                          {amenityIcons[key as keyof typeof amenityIcons] || <Sparkles size={20} />}
                        </div>
                        <span className="capitalize text-gray-700">
                          {key.replace('_', ' ')}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {hostel.available_rooms > 0 && (
              <button
                onClick={() => setBookingModal(true)}
                className="w-full py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold text-lg transition-colors flex items-center justify-center gap-2"
              >
                <Calendar size={20} />
                Book Now
              </button>
            )}
          </div>
        </div>

        {reviews.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Student Reviews</h2>
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review.id} className="border-b border-gray-200 last:border-0 pb-4 last:pb-0">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={16}
                          className={i < review.rating ? 'text-yellow-500' : 'text-gray-300'}
                          fill={i < review.rating ? 'currentColor' : 'none'}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-500">
                      {new Date(review.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  {review.comment && <p className="text-gray-700">{review.comment}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {bookingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Book {hostel.name}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={bookingData.startDate}
                  onChange={(e) => setBookingData({ ...bookingData, startDate: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={bookingData.endDate}
                  onChange={(e) => setBookingData({ ...bookingData, endDate: e.target.value })}
                  min={bookingData.startDate || new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Price per month:</span>
                  <span className="font-semibold">KSh {Number(hostel.price_per_month).toLocaleString()}</span>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setBookingModal(false)}
                  className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBooking}
                  disabled={!bookingData.startDate || !bookingData.endDate}
                  className="flex-1 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Proceed to Payment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
