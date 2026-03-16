import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Building2,
  Calendar,
  Clock,
  CreditCard,
  MapPin,
  Megaphone,
  Search,
  TrendingUp,
  Users,
} from 'lucide-react';
import { DashboardLayout } from '../../components/layouts/DashboardLayout';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../lib/api';
import { setBookings, type BookingItem } from '../../store/bookingSlice';
import { setHostelList, type BackendHostel } from '../../store/hostelSlice';
import type { AppDispatch, RootState } from '../../store';

interface ActivityItem {
  icon: typeof CreditCard;
  text: string;
  time: string;
  color: string;
}

interface AnnouncementItem {
  _id: string;
  title: string;
  message: string;
  audience: 'all' | 'students' | 'owners';
  publishedAt?: string;
  createdAt: string;
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function formatRelativeTime(value?: string) {
  if (!value) return 'Recently';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Recently';

  const diffMs = Date.now() - date.getTime();
  const diffHours = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60)));
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;

  const diffWeeks = Math.floor(diffDays / 7);
  return `${diffWeeks} week${diffWeeks === 1 ? '' : 's'} ago`;
}

function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  variant = 'default',
}: {
  title: string;
  value: string | number;
  icon: typeof Building2;
  trend?: string;
  variant?: 'default' | 'primary' | 'accent' | 'warning';
}) {
  const variantStyles = {
    default: 'bg-card shadow-card border border-border',
    primary: 'gradient-hero text-primary-foreground',
    accent: 'gradient-accent text-accent-foreground',
    warning: 'gradient-warm text-warning-foreground',
  };

  const iconStyles = {
    default: 'bg-primary/10 text-primary',
    primary: 'bg-primary-foreground/20 text-primary-foreground',
    accent: 'bg-accent-foreground/20 text-accent-foreground',
    warning: 'bg-warning-foreground/20 text-warning-foreground',
  };

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className={`rounded-2xl p-6 transition-shadow hover:shadow-card-hover ${variantStyles[variant]}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className={`text-sm font-medium ${variant === 'default' ? 'text-muted-foreground' : 'opacity-80'}`}>
            {title}
          </p>
          <p className="mt-2 font-heading text-3xl font-bold">{value}</p>
          {trend && (
            <p className={`mt-2 text-xs font-medium ${variant === 'default' ? 'text-green-600 dark:text-green-400' : 'opacity-80'}`}>
              {trend}
            </p>
          )}
        </div>
        <div className={`rounded-xl p-3 ${iconStyles[variant]}`}>
          <Icon size={22} />
        </div>
      </div>
    </motion.div>
  );
}

function RecommendedHostelCard({ hostel }: { hostel: BackendHostel }) {
  const occupancy = hostel.totalRooms > 0
    ? Math.round(((hostel.totalRooms - hostel.availableRooms) / hostel.totalRooms) * 100)
    : 0;
  const amenityLabels = [
    hostel.amenities?.wifi ? 'WiFi' : null,
    hostel.amenities?.security ? 'Security' : null,
    hostel.amenities?.parking ? 'Parking' : null,
    hostel.amenities?.laundry ? 'Laundry' : null,
    hostel.amenities?.kitchen ? 'Kitchen' : null,
  ].filter((amenity): amenity is string => Boolean(amenity));

  return (
    <Link
      to={`/student/hostel/${hostel._id}`}
      className="group block overflow-hidden rounded-2xl border border-border bg-card shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover"
    >
      <div className="relative h-52 overflow-hidden bg-gradient-to-br from-blue-500 to-indigo-600">
        {hostel.images?.[0] ? (
          <img
            src={hostel.images[0]}
            alt={hostel.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
              <span className="font-heading text-xl font-bold text-white">
                {hostel.name.charAt(0)}
              </span>
            </div>
          </div>
        )}

        <div className="absolute inset-0 bg-black/10" />
        <div className="absolute left-3 right-3 top-3 flex items-center justify-between">
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-semibold backdrop-blur-sm ${
              hostel.hostelType === 'male'
                ? 'bg-sky-500/80 text-white'
                : hostel.hostelType === 'female'
                ? 'bg-pink-500/80 text-white'
                : 'bg-emerald-500/80 text-white'
            }`}
          >
            {hostel.hostelType.charAt(0).toUpperCase() + hostel.hostelType.slice(1)}
          </span>
          {hostel.availableRooms > 0 && hostel.availableRooms <= 5 && (
            <span className="rounded-full bg-red-500/90 px-2.5 py-1 text-xs font-semibold text-white">
              Only {hostel.availableRooms} left
            </span>
          )}
        </div>
        <div className="absolute bottom-3 left-3 rounded-full bg-black/50 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm">
          {hostel.averageRating > 0 ? `${hostel.averageRating.toFixed(1)} rating` : 'New listing'}
        </div>
      </div>

      <div className="p-5">
        <h3 className="font-heading text-lg font-bold text-card-foreground transition-colors group-hover:text-primary">
          {hostel.name}
        </h3>
        <div className="mt-1.5 flex items-center gap-3 text-muted-foreground">
          <div className="flex min-w-0 items-center gap-1">
            <MapPin size={14} className="shrink-0" />
            <span className="truncate text-sm">
              {hostel.location?.address ?? hostel.location?.city ?? 'Location not set'}
            </span>
          </div>
          {hostel.location?.nearbyUniversity && (
            <div className="shrink-0 rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
              {hostel.location.nearbyUniversity}
            </div>
          )}
        </div>

        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
          {hostel.description || 'Comfortable student accommodation with verified amenities.'}
        </p>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {amenityLabels.slice(0, 4).map((amenity) => (
            <span
              key={amenity}
              className="rounded-md bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground"
            >
              {amenity}
            </span>
          ))}
        </div>

        <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
          <div>
            <span className="font-heading text-2xl font-bold text-primary">
              KES {hostel.pricePerMonth.toLocaleString()}
            </span>
            <span className="text-sm text-muted-foreground">/mo</span>
          </div>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Users size={14} />
            <span>{occupancy}% occupied</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export function StudentDashboard() {
  const { profile } = useAuth();
  const dispatch = useDispatch<AppDispatch>();
  const cachedHostels = useSelector((state: RootState) => state.hostels.list);
  const [bookings, setLocalBookings] = useState<BookingItem[]>([]);
  const [recommendedHostels, setRecommendedHostels] = useState<BackendHostel[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [bookingsData, hostelsData, announcementsData] = await Promise.all([
        api.get<BookingItem[]>('/bookings/me'),
        cachedHostels.length > 0
          ? Promise.resolve({ hostels: cachedHostels })
          : api.get<{ hostels: BackendHostel[] }>('/hostels?limit=12'),
        api.get<{ announcements: AnnouncementItem[] }>('/students/announcements'),
      ]);

      const bookingList = Array.isArray(bookingsData) ? bookingsData : [];
      const hostelList = hostelsData.hostels ?? [];

      setLocalBookings(bookingList);
      setRecommendedHostels(
        hostelList.filter((hostel) => hostel.availableRooms > 0).slice(0, 3)
      );
      setAnnouncements(announcementsData.announcements ?? []);

      dispatch(setBookings(bookingList));
      if (hostelList.length > 0) {
        dispatch(setHostelList(hostelList));
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const activeBookings = useMemo(
    () => bookings.filter((booking) => booking.status === 'confirmed' && booking.payment?.status === 'paid').length,
    [bookings]
  );

  const pendingBookings = useMemo(
    () => bookings.filter((booking) => ['pending', 'pending_payment'].includes(booking.status)).length,
    [bookings]
  );

  const totalSpent = useMemo(
    () => bookings
      .filter((booking) => booking.status === 'confirmed' && booking.payment?.status === 'paid')
      .reduce((sum, booking) => sum + Number(booking.amount || 0), 0),
    [bookings]
  );

  const recentActivity: ActivityItem[] = useMemo(() => {
    return bookings.slice(0, 4).map((booking) => {
      const isPending = ['pending', 'pending_payment'].includes(booking.status);
      const isConfirmed = booking.status === 'confirmed';
      const icon = isPending ? CreditCard : isConfirmed ? Building2 : Clock;
      const color = isPending
        ? 'text-yellow-600 dark:text-yellow-400'
        : isConfirmed
        ? 'text-primary dark:text-blue-400'
        : 'text-muted-foreground';

      return {
        icon,
        color,
        text: isPending
          ? `Payment pending for ${booking.hostel?.name ?? 'your booking'}`
          : isConfirmed
          ? `Booking at ${booking.hostel?.name ?? 'your hostel'} confirmed`
          : `${booking.status.charAt(0).toUpperCase() + booking.status.slice(1)} booking updated`,
        time: formatRelativeTime((booking as BookingItem & { createdAt?: string }).createdAt ?? booking.startDate),
      };
    });
  }, [bookings]);

  const recentBookings = bookings.slice(0, 3);

  const getBookingBadge = (status: string) => {
    if (status === 'confirmed') return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
    if (status === 'pending' || status === 'pending_payment') {
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
    }
    if (status === 'completed') return 'bg-primary/20 text-primary dark:bg-blue-900/30 dark:text-blue-300';
    return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
  };

  return (
    <DashboardLayout>
      <div className="mb-8">
        <motion.h1
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="font-heading text-3xl font-bold text-foreground md:text-4xl"
        >
          {getGreeting()}, {profile?.username?.split(' ')[0] ?? 'Student'}!
        </motion.h1>
        <p className="mt-1 text-muted-foreground">
          Here&apos;s what&apos;s happening with your bookings
        </p>
      </div>

      {announcements.length > 0 && (
        <div className="mb-8 rounded-2xl border border-border bg-card shadow-card">
          <div className="flex items-center gap-3 border-b border-border p-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Megaphone size={18} />
            </div>
            <div>
              <h2 className="font-heading text-lg font-bold text-foreground">Announcements</h2>
              <p className="text-xs text-muted-foreground">Published platform updates from admin</p>
            </div>
          </div>
          <div className="divide-y divide-border">
            {announcements.slice(0, 3).map((announcement) => (
              <div key={announcement._id} className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-foreground">{announcement.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{announcement.message}</p>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {new Date(announcement.publishedAt || announcement.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mb-8 grid grid-cols-1 gap-4 md:gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Active Bookings"
          value={activeBookings}
          icon={Building2}
          variant="primary"
          trend={activeBookings > 0 ? `${activeBookings} currently secured` : undefined}
        />
        <StatCard
          title="Pending"
          value={pendingBookings}
          icon={Calendar}
          variant="warning"
        />
        <StatCard
          title="Total Spent"
          value={`KES ${totalSpent.toLocaleString()}`}
          icon={TrendingUp}
        />
        <StatCard
          title="Available Hostels"
          value={recommendedHostels.length || cachedHostels.length}
          icon={Search}
          variant="accent"
          trend="Ready to explore"
        />
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-1">
          <h2 className="font-heading text-lg font-bold text-foreground">Quick Actions</h2>

          <Link
            to="/student/search"
            className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-card transition-all hover:shadow-card-hover"
          >
            <div className="gradient-hero flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-110">
              <Search size={22} className="text-primary-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-heading font-bold text-foreground">Search Hostels</h3>
              <p className="text-xs text-muted-foreground">Find your perfect room</p>
            </div>
            <ArrowRight size={18} className="text-muted-foreground transition-colors group-hover:text-primary" />
          </Link>

          <Link
            to="/student/bookings"
            className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-card transition-all hover:shadow-card-hover"
          >
            <div className="gradient-accent flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-110">
              <Calendar size={22} className="text-accent-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-heading font-bold text-foreground">My Bookings</h3>
              <p className="text-xs text-muted-foreground">View and manage bookings</p>
            </div>
            <ArrowRight size={18} className="text-muted-foreground transition-colors group-hover:text-accent" />
          </Link>

          <Link
            to="/student/favorites"
            className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-card transition-all hover:shadow-card-hover"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform group-hover:scale-110">
              <Building2 size={22} />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-heading font-bold text-foreground">Favorites</h3>
              <p className="text-xs text-muted-foreground">Keep track of saved hostels</p>
            </div>
            <ArrowRight size={18} className="text-muted-foreground transition-colors group-hover:text-primary" />
          </Link>

          {pendingBookings > 0 && (
            <Link
              to="/student/bookings"
              className="flex items-center gap-4 rounded-2xl border border-yellow-200 bg-yellow-50 p-5 transition-colors hover:bg-yellow-100 dark:border-yellow-800/40 dark:bg-yellow-900/20 dark:hover:bg-yellow-900/30"
            >
              <div className="gradient-warm flex h-12 w-12 shrink-0 items-center justify-center rounded-xl">
                <CreditCard size={22} className="text-warning-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-heading font-bold text-foreground">
                  {pendingBookings} Pending Payment
                </h3>
                <p className="text-xs text-muted-foreground">Complete to secure your room</p>
              </div>
            </Link>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card shadow-card lg:col-span-2">
          <div className="flex items-center justify-between border-b border-border p-6">
            <h2 className="font-heading text-lg font-bold text-foreground">Recent Activity</h2>
            <span className="text-xs text-muted-foreground">Latest updates</span>
          </div>
          <div className="divide-y divide-border">
            {(recentActivity.length > 0 ? recentActivity : [
              {
                icon: Search,
                text: 'Search for hostels and your activity will appear here',
                time: 'No recent activity',
                color: 'text-muted-foreground',
              },
            ]).map((activity, index) => (
              <motion.div
                key={`${activity.text}-${index}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.08 }}
                className="flex items-center gap-4 p-4 sm:p-5"
              >
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary ${activity.color}`}>
                  <activity.icon size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">{activity.text}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{activity.time}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <div className="mb-8 rounded-2xl border border-border bg-card shadow-card">
        <div className="flex items-center justify-between border-b border-border p-6">
          <h2 className="font-heading text-lg font-bold text-foreground">My Bookings</h2>
          <Link
            to="/student/bookings"
            className="flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
          >
            View all <ArrowRight size={14} />
          </Link>
        </div>
        <div className="divide-y divide-border">
          {loading ? (
            <div className="p-6 text-sm text-muted-foreground">Loading dashboard data...</div>
          ) : recentBookings.length === 0 ? (
            <div className="p-8 text-center">
              <Building2 size={44} className="mx-auto mb-4 text-muted-foreground" />
              <p className="text-foreground">No bookings yet</p>
              <Link to="/student/search" className="mt-3 inline-flex text-sm font-semibold text-primary hover:underline">
                Find a hostel
              </Link>
            </div>
          ) : (
            recentBookings.map((booking, index) => (
              <motion.div
                key={booking._id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.1 }}
                className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                    <Building2 size={20} className="text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">{booking.hostel?.name ?? 'Hostel'}</h3>
                    <p className="text-sm text-muted-foreground">
                      {new Date(booking.startDate).toLocaleDateString()} to{' '}
                      {new Date(booking.endDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 sm:text-right">
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getBookingBadge(booking.status)}`}>
                    {booking.status === 'pending_payment'
                      ? 'Pending Payment'
                      : booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                  </span>
                  <p className="text-sm font-bold text-foreground">
                    KES {Number(booking.amount).toLocaleString()}
                  </p>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      <div>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="font-heading text-xl font-bold text-foreground">Recommended for You</h2>
            <p className="mt-1 text-sm text-muted-foreground">Available hostels worth checking next</p>
          </div>
          <Link
            to="/student/search"
            className="flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
          >
            View all <ArrowRight size={14} />
          </Link>
        </div>

        {recommendedHostels.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-card">
            <Search size={42} className="mx-auto mb-4 text-muted-foreground" />
            <p className="text-foreground">No recommendations yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Browse hostels and we&apos;ll surface the best options here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {recommendedHostels.map((hostel) => (
              <RecommendedHostelCard key={hostel._id} hostel={hostel} />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
