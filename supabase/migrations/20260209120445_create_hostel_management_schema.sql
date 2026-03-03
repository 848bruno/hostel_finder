/*
  # Hostel Management System Database Schema

  ## Overview
  Complete database schema for a hostel management system with three user roles:
  Student, Owner, and Admin.

  ## New Tables

  ### 1. profiles
  - `id` (uuid, primary key) - References auth.users
  - `email` (text) - User email
  - `full_name` (text) - User's full name
  - `phone` (text) - Contact number
  - `role` (text) - User role: 'student', 'owner', 'admin'
  - `avatar_url` (text) - Profile picture URL
  - `created_at` (timestamptz) - Account creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 2. owner_verifications
  - `id` (uuid, primary key)
  - `owner_id` (uuid) - References profiles
  - `business_name` (text) - Business name
  - `business_registration_number` (text) - Registration number
  - `id_document_url` (text) - ID document URL
  - `business_license_url` (text) - Business license URL
  - `status` (text) - 'pending', 'approved', 'rejected'
  - `rejection_reason` (text) - Reason for rejection
  - `submitted_at` (timestamptz) - Submission timestamp
  - `reviewed_at` (timestamptz) - Review timestamp
  - `reviewed_by` (uuid) - Admin who reviewed

  ### 3. hostels
  - `id` (uuid, primary key)
  - `owner_id` (uuid) - References profiles
  - `name` (text) - Hostel name
  - `description` (text) - Hostel description
  - `address` (text) - Physical address
  - `latitude` (decimal) - GPS latitude
  - `longitude` (decimal) - GPS longitude
  - `gender_type` (text) - 'male', 'female', 'mixed'
  - `total_rooms` (integer) - Total number of rooms
  - `available_rooms` (integer) - Currently available rooms
  - `price_per_month` (decimal) - Monthly rent
  - `images` (jsonb) - Array of image URLs
  - `is_published` (boolean) - Published status
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 4. amenities
  - `id` (uuid, primary key)
  - `hostel_id` (uuid) - References hostels
  - `wifi` (boolean)
  - `parking` (boolean)
  - `laundry` (boolean)
  - `kitchen` (boolean)
  - `security` (boolean)
  - `gym` (boolean)
  - `study_room` (boolean)
  - `cleaning_service` (boolean)

  ### 5. bookings
  - `id` (uuid, primary key)
  - `student_id` (uuid) - References profiles
  - `hostel_id` (uuid) - References hostels
  - `room_number` (text) - Assigned room number
  - `start_date` (date) - Booking start date
  - `end_date` (date) - Booking end date
  - `status` (text) - 'pending', 'confirmed', 'cancelled', 'completed'
  - `total_amount` (decimal) - Total booking amount
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 6. payments
  - `id` (uuid, primary key)
  - `booking_id` (uuid) - References bookings
  - `student_id` (uuid) - References profiles
  - `amount` (decimal) - Payment amount
  - `payment_method` (text) - 'mpesa', 'card'
  - `transaction_id` (text) - Transaction reference
  - `status` (text) - 'pending', 'completed', 'failed', 'refunded'
  - `paid_at` (timestamptz) - Payment timestamp
  - `receipt_url` (text) - Receipt document URL

  ### 7. inquiries
  - `id` (uuid, primary key)
  - `student_id` (uuid) - References profiles
  - `hostel_id` (uuid) - References hostels
  - `message` (text) - Inquiry message
  - `response` (text) - Owner's response
  - `status` (text) - 'pending', 'responded'
  - `created_at` (timestamptz)
  - `responded_at` (timestamptz)

  ### 8. reviews
  - `id` (uuid, primary key)
  - `student_id` (uuid) - References profiles
  - `hostel_id` (uuid) - References hostels
  - `rating` (integer) - Rating 1-5
  - `comment` (text) - Review comment
  - `created_at` (timestamptz)

  ## Security
  - Enable RLS on all tables
  - Policies for role-based access control
  - Students can only access their own data
  - Owners can manage their hostels and view their bookings
  - Admins have full access
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  phone text,
  role text NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'owner', 'admin')),
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create owner_verifications table
CREATE TABLE IF NOT EXISTS owner_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  business_name text NOT NULL,
  business_registration_number text,
  id_document_url text NOT NULL,
  business_license_url text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason text,
  submitted_at timestamptz DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES profiles(id)
);

-- Create hostels table
CREATE TABLE IF NOT EXISTS hostels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  address text NOT NULL,
  latitude decimal(10, 8),
  longitude decimal(11, 8),
  gender_type text NOT NULL CHECK (gender_type IN ('male', 'female', 'mixed')),
  total_rooms integer NOT NULL DEFAULT 0,
  available_rooms integer NOT NULL DEFAULT 0,
  price_per_month decimal(10, 2) NOT NULL,
  images jsonb DEFAULT '[]'::jsonb,
  is_published boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create amenities table
CREATE TABLE IF NOT EXISTS amenities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hostel_id uuid REFERENCES hostels(id) ON DELETE CASCADE NOT NULL UNIQUE,
  wifi boolean DEFAULT false,
  parking boolean DEFAULT false,
  laundry boolean DEFAULT false,
  kitchen boolean DEFAULT false,
  security boolean DEFAULT false,
  gym boolean DEFAULT false,
  study_room boolean DEFAULT false,
  cleaning_service boolean DEFAULT false
);

-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  hostel_id uuid REFERENCES hostels(id) ON DELETE CASCADE NOT NULL,
  room_number text,
  start_date date NOT NULL,
  end_date date NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  total_amount decimal(10, 2) NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES bookings(id) ON DELETE CASCADE NOT NULL,
  student_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  amount decimal(10, 2) NOT NULL,
  payment_method text NOT NULL CHECK (payment_method IN ('mpesa', 'card')),
  transaction_id text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  paid_at timestamptz DEFAULT now(),
  receipt_url text
);

-- Create inquiries table
CREATE TABLE IF NOT EXISTS inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  hostel_id uuid REFERENCES hostels(id) ON DELETE CASCADE NOT NULL,
  message text NOT NULL,
  response text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'responded')),
  created_at timestamptz DEFAULT now(),
  responded_at timestamptz
);

-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  hostel_id uuid REFERENCES hostels(id) ON DELETE CASCADE NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(student_id, hostel_id)
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE owner_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE hostels ENABLE ROW LEVEL SECURITY;
ALTER TABLE amenities ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Users can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Owner Verifications Policies
CREATE POLICY "Owners can view own verifications"
  ON owner_verifications FOR SELECT
  TO authenticated
  USING (
    owner_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Owners can submit verifications"
  ON owner_verifications FOR INSERT
  TO authenticated
  WITH CHECK (
    owner_id = auth.uid() AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'owner')
  );

CREATE POLICY "Owners can update pending verifications"
  ON owner_verifications FOR UPDATE
  TO authenticated
  USING (
    (owner_id = auth.uid() AND status = 'pending') OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    (owner_id = auth.uid() AND status = 'pending') OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Hostels Policies
CREATE POLICY "Anyone can view published hostels"
  ON hostels FOR SELECT
  TO authenticated
  USING (
    is_published = true OR
    owner_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Approved owners can create hostels"
  ON hostels FOR INSERT
  TO authenticated
  WITH CHECK (
    owner_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM owner_verifications 
      WHERE owner_id = auth.uid() AND status = 'approved'
    )
  );

CREATE POLICY "Owners can update own hostels"
  ON hostels FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners can delete own hostels"
  ON hostels FOR DELETE
  TO authenticated
  USING (owner_id = auth.uid());

-- Amenities Policies
CREATE POLICY "Anyone can view amenities"
  ON amenities FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Hostel owners can manage amenities"
  ON amenities FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM hostels WHERE id = hostel_id AND owner_id = auth.uid())
  );

CREATE POLICY "Hostel owners can update amenities"
  ON amenities FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM hostels WHERE id = hostel_id AND owner_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM hostels WHERE id = hostel_id AND owner_id = auth.uid())
  );

-- Bookings Policies
CREATE POLICY "Students can view own bookings"
  ON bookings FOR SELECT
  TO authenticated
  USING (
    student_id = auth.uid() OR
    EXISTS (SELECT 1 FROM hostels WHERE id = hostel_id AND owner_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Students can create bookings"
  ON bookings FOR INSERT
  TO authenticated
  WITH CHECK (
    student_id = auth.uid() AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'student')
  );

CREATE POLICY "Students and owners can update bookings"
  ON bookings FOR UPDATE
  TO authenticated
  USING (
    student_id = auth.uid() OR
    EXISTS (SELECT 1 FROM hostels WHERE id = hostel_id AND owner_id = auth.uid())
  )
  WITH CHECK (
    student_id = auth.uid() OR
    EXISTS (SELECT 1 FROM hostels WHERE id = hostel_id AND owner_id = auth.uid())
  );

-- Payments Policies
CREATE POLICY "Users can view relevant payments"
  ON payments FOR SELECT
  TO authenticated
  USING (
    student_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM bookings b
      JOIN hostels h ON b.hostel_id = h.id
      WHERE b.id = booking_id AND h.owner_id = auth.uid()
    ) OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Students can create payments"
  ON payments FOR INSERT
  TO authenticated
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "System can update payments"
  ON payments FOR UPDATE
  TO authenticated
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

-- Inquiries Policies
CREATE POLICY "Users can view relevant inquiries"
  ON inquiries FOR SELECT
  TO authenticated
  USING (
    student_id = auth.uid() OR
    EXISTS (SELECT 1 FROM hostels WHERE id = hostel_id AND owner_id = auth.uid())
  );

CREATE POLICY "Students can create inquiries"
  ON inquiries FOR INSERT
  TO authenticated
  WITH CHECK (
    student_id = auth.uid() AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'student')
  );

CREATE POLICY "Owners can respond to inquiries"
  ON inquiries FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM hostels WHERE id = hostel_id AND owner_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM hostels WHERE id = hostel_id AND owner_id = auth.uid())
  );

-- Reviews Policies
CREATE POLICY "Anyone can view reviews"
  ON reviews FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Students can create reviews"
  ON reviews FOR INSERT
  TO authenticated
  WITH CHECK (
    student_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM bookings
      WHERE student_id = auth.uid() AND hostel_id = reviews.hostel_id AND status = 'completed'
    )
  );

CREATE POLICY "Students can update own reviews"
  ON reviews FOR UPDATE
  TO authenticated
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "Students can delete own reviews"
  ON reviews FOR DELETE
  TO authenticated
  USING (student_id = auth.uid());

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_hostels_owner ON hostels(owner_id);
CREATE INDEX IF NOT EXISTS idx_hostels_published ON hostels(is_published);
CREATE INDEX IF NOT EXISTS idx_bookings_student ON bookings(student_id);
CREATE INDEX IF NOT EXISTS idx_bookings_hostel ON bookings(hostel_id);
CREATE INDEX IF NOT EXISTS idx_payments_booking ON payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_hostel ON inquiries(hostel_id);
CREATE INDEX IF NOT EXISTS idx_reviews_hostel ON reviews(hostel_id);