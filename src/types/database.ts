export type UserRole = 'student' | 'owner' | 'admin';
export type VerificationStatus = 'pending' | 'approved' | 'rejected';
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';
export type PaymentMethod = 'mpesa' | 'card';
export type GenderType = 'male' | 'female' | 'mixed';
export type InquiryStatus = 'pending' | 'responded';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  role: UserRole;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface OwnerVerification {
  id: string;
  owner_id: string;
  business_name: string;
  business_registration_number: string | null;
  id_document_url: string;
  business_license_url: string | null;
  status: VerificationStatus;
  rejection_reason: string | null;
  submitted_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
}

export interface Hostel {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  address: string;
  latitude: number | null;
  longitude: number | null;
  gender_type: GenderType;
  total_rooms: number;
  available_rooms: number;
  price_per_month: number;
  images: string[];
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface Amenity {
  id: string;
  hostel_id: string;
  wifi: boolean;
  parking: boolean;
  laundry: boolean;
  kitchen: boolean;
  security: boolean;
  gym: boolean;
  study_room: boolean;
  cleaning_service: boolean;
}

export interface Booking {
  id: string;
  student_id: string;
  hostel_id: string;
  room_number: string | null;
  start_date: string;
  end_date: string;
  status: BookingStatus;
  total_amount: number;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  booking_id: string;
  student_id: string;
  amount: number;
  payment_method: PaymentMethod;
  transaction_id: string;
  status: PaymentStatus;
  paid_at: string;
  receipt_url: string | null;
}

export interface Inquiry {
  id: string;
  student_id: string;
  hostel_id: string;
  message: string;
  response: string | null;
  status: InquiryStatus;
  created_at: string;
  responded_at: string | null;
}

export interface Review {
  id: string;
  student_id: string;
  hostel_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>;
      };
      owner_verifications: {
        Row: OwnerVerification;
        Insert: Omit<OwnerVerification, 'id' | 'submitted_at'>;
        Update: Partial<Omit<OwnerVerification, 'id'>>;
      };
      hostels: {
        Row: Hostel;
        Insert: Omit<Hostel, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Hostel, 'id' | 'created_at'>>;
      };
      amenities: {
        Row: Amenity;
        Insert: Omit<Amenity, 'id'>;
        Update: Partial<Omit<Amenity, 'id' | 'hostel_id'>>;
      };
      bookings: {
        Row: Booking;
        Insert: Omit<Booking, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Booking, 'id' | 'created_at'>>;
      };
      payments: {
        Row: Payment;
        Insert: Omit<Payment, 'id'>;
        Update: Partial<Omit<Payment, 'id'>>;
      };
      inquiries: {
        Row: Inquiry;
        Insert: Omit<Inquiry, 'id' | 'created_at'>;
        Update: Partial<Omit<Inquiry, 'id' | 'created_at'>>;
      };
      reviews: {
        Row: Review;
        Insert: Omit<Review, 'id' | 'created_at'>;
        Update: Partial<Omit<Review, 'id' | 'created_at'>>;
      };
    };
  };
}
