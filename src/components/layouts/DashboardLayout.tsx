import { ReactNode, createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../lib/api';
import {
  LayoutDashboard, Search, BookOpen, Settings, LogOut, Building2,
  Users, BarChart3, ShieldCheck, Menu, X, ChevronRight,
  Home, Bell, FileCheck, PlusCircle, Heart, Scale,
  Sun, Moon, Wrench, FileText, DollarSign, UserCheck, Megaphone,
  MessageCircle, ClipboardCheck, Receipt,
  Shield, Award, Headphones, Database, Activity, Percent,
  Clock, RefreshCw, CreditCard
} from 'lucide-react';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

const studentNav: NavItem[] = [
  { label: 'Dashboard', path: '/student/dashboard', icon: <LayoutDashboard size={20} /> },
  { label: 'Search Hostels', path: '/student/search', icon: <Search size={20} /> },
  { label: 'Compare', path: '/student/compare', icon: <Scale size={20} /> },
  { label: 'Favorites', path: '/student/favorites', icon: <Heart size={20} /> },
  { label: 'My Bookings', path: '/student/bookings', icon: <BookOpen size={20} /> },
  { label: 'Payments', path: '/student/payments', icon: <Receipt size={20} /> },
  { label: 'Settings', path: '/student/settings', icon: <Settings size={20} /> },
];

const ownerNav: NavItem[] = [
  { label: 'Dashboard', path: '/owner/dashboard', icon: <LayoutDashboard size={20} /> },
  { label: 'My Hostels', path: '/owner/hostels', icon: <Building2 size={20} /> },
  { label: 'Add Hostel', path: '/owner/hostels/new', icon: <PlusCircle size={20} /> },
  { label: 'Tenants', path: '/owner/tenants', icon: <Users size={20} /> },
  { label: 'Maintenance', path: '/owner/maintenance', icon: <Wrench size={20} /> },
  { label: 'Leases', path: '/owner/leases', icon: <FileText size={20} /> },
  { label: 'Expenses', path: '/owner/expenses', icon: <DollarSign size={20} /> },
  { label: 'Caretakers', path: '/owner/caretakers', icon: <UserCheck size={20} /> },
  { label: 'Marketing', path: '/owner/vacancy-marketing', icon: <Megaphone size={20} /> },
  { label: 'Messages', path: '/owner/communication', icon: <MessageCircle size={20} /> },
  { label: 'Checklists', path: '/owner/checklists', icon: <ClipboardCheck size={20} /> },
  { label: 'Reports', path: '/owner/reports', icon: <Receipt size={20} /> },
  { label: 'Payments', path: '/owner/payments', icon: <CreditCard size={20} /> },
  { label: 'Analytics', path: '/owner/analytics', icon: <BarChart3 size={20} /> },
  { label: 'Verification', path: '/owner/verification', icon: <FileCheck size={20} /> },
  { label: 'Settings', path: '/owner/settings', icon: <Settings size={20} /> },
];

const adminNav: NavItem[] = [
  { label: 'Dashboard', path: '/admin/dashboard', icon: <LayoutDashboard size={20} /> },
  { label: 'Verify Owners', path: '/admin/verifications', icon: <ShieldCheck size={20} /> },
  { label: 'Manage Users', path: '/admin/users', icon: <Users size={20} /> },
  { label: 'All Hostels', path: '/admin/hostels', icon: <Building2 size={20} /> },
  { label: 'Moderation', path: '/admin/moderation', icon: <Shield size={20} /> },
  { label: 'Quality Scores', path: '/admin/quality', icon: <Award size={20} /> },
  { label: 'Commissions', path: '/admin/commissions', icon: <Percent size={20} /> },
  { label: 'Analytics', path: '/admin/analytics', icon: <BarChart3 size={20} /> },
  { label: 'Payments', path: '/admin/payments', icon: <DollarSign size={20} /> },
  { label: 'Complaints', path: '/admin/complaints', icon: <MessageCircle size={20} /> },
  { label: 'Support', path: '/admin/support', icon: <Headphones size={20} /> },
  { label: 'Announcements', path: '/admin/announcements', icon: <Megaphone size={20} /> },
  { label: 'Bulk Data', path: '/admin/bulk-data', icon: <Database size={20} /> },
  { label: 'Audit Logs', path: '/admin/audit-logs', icon: <FileText size={20} /> },
  { label: 'System Health', path: '/admin/system-health', icon: <Activity size={20} /> },
  { label: 'Settings', path: '/admin/settings', icon: <Settings size={20} /> },
];

type UserRole = 'student' | 'owner' | 'admin';
const navMap: Record<UserRole, NavItem[]> = { student: studentNav, owner: ownerNav, admin: adminNav };
const roleLabels: Record<UserRole, string> = { student: 'Student', owner: 'Hostel Owner', admin: 'Administrator' };
const roleColors: Record<UserRole, string> = { student: 'gradient-hero', owner: 'gradient-accent', admin: 'gradient-warm' };

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardRefreshContext = createContext(0);

export function useDashboardRefreshVersion() {
  return useContext(DashboardRefreshContext);
}

interface AnnouncementNotification {
  _id: string;
  title: string;
  message: string;
  audience?: 'all' | 'students' | 'owners';
  status?: 'draft' | 'sent';
  publishedAt?: string;
  createdAt?: string;
  isRead?: boolean;
  readAt?: string | null;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { profile, signOut, updateProfile } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const { theme, setTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [refreshing, setRefreshing] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState<AnnouncementNotification[]>([]);
  const [selectedNotification, setSelectedNotification] = useState<AnnouncementNotification | null>(null);
  const [refreshVersion, setRefreshVersion] = useState(0);

  const role = (profile?.role as UserRole) || 'student';
  const userName = profile?.username || 'User';
  const navItems = navMap[role] || studentNav;
  const ownerNeedsVerification = profile?.role === 'owner' && profile.isApproved === false;
  const isOwnerVerificationRoute = location.pathname === '/owner/verification';

  // Build breadcrumb from path
  const pathSegments = location.pathname.split('/').filter(Boolean);
  const breadcrumbs = pathSegments.map((seg, i) => ({
    label: seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, ' '),
    path: '/' + pathSegments.slice(0, i + 1).join('/'),
  }));

  useEffect(() => {
    if (!profile) {
      setNotifications([]);
      return;
    }

    const loadNotifications = async () => {
      try {
        if (profile.role === 'student') {
          const data = await api.get<{ announcements: AnnouncementNotification[] }>('/students/announcements');
          setNotifications((data.announcements ?? []).slice(0, 5));
          return;
        }

        if (profile.role === 'owner') {
          const data = await api.get<{ announcements: AnnouncementNotification[] }>('/owners/announcements');
          setNotifications((data.announcements ?? []).slice(0, 5));
          return;
        }

        if (profile.role === 'admin') {
          const data = await api.get<{ announcements: AnnouncementNotification[] }>('/admin/announcements');
          const published = (data.announcements ?? []).filter((announcement) => announcement.status === 'sent');
          setNotifications(published.slice(0, 5));
          return;
        }
      } catch (error) {
        console.error('Error loading notifications:', error);
        setNotifications([]);
      }
    };

    void loadNotifications();
  }, [profile, refreshVersion]);

  useEffect(() => {
    let lastHiddenAt = Date.now();

    const triggerRefresh = () => {
      setRefreshVersion((current) => current + 1);
    };

    const handleFocus = () => {
      triggerRefresh();
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        lastHiddenAt = Date.now();
        return;
      }

      if (Date.now() - lastHiddenAt > 3000) {
        triggerRefresh();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  const refreshContextValue = useMemo(() => refreshVersion, [refreshVersion]);

  const unreadCount = notifications.filter((notification) => !notification.isRead).length;

  const truncateNotificationMessage = (message: string) => (
    message.length > 88 ? `${message.slice(0, 88)}...` : message
  );

  const markNotificationRead = async (notification: AnnouncementNotification) => {
    if (!profile || profile.role === 'admin' || notification.isRead) {
      return;
    }

    try {
      const basePath = profile.role === 'student' ? '/students/announcements' : '/owners/announcements';
      await api.post(`${basePath}/${notification._id}/read`);
      setNotifications((current) => current.map((item) => (
        item._id === notification._id
          ? { ...item, isRead: true, readAt: new Date().toISOString() }
          : item
      )));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const openNotification = async (notification: AnnouncementNotification) => {
    setNotificationOpen(false);
    setSelectedNotification(notification);
    await markNotificationRead(notification);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Pending-approval gate for owners
  if (ownerNeedsVerification && !isOwnerVerificationRoute) {
    const handleRefresh = async () => {
      setRefreshing(true);
      try { await updateProfile({}); } finally { setRefreshing(false); }
    };

    const statusLabel = profile.verificationStatus === 'submitted'
      ? 'Verification submitted'
      : profile.verificationStatus === 'rejected'
      ? 'Verification rejected'
      : 'Verification required';
    const statusMessage = profile.verificationStatus === 'submitted'
      ? 'Your verification is under review. You can reopen the verification page to check the submitted details.'
      : profile.verificationStatus === 'rejected'
      ? 'Your verification was rejected. Open the verification page, review the rejection reason, and resubmit.'
      : 'Complete owner verification before you can use the rest of the owner portal.';

    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="bg-card rounded-2xl shadow-card border border-border p-8 max-w-md w-full text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-warning/10 rounded-full mb-4">
            <Clock size={32} className="text-warning" />
          </div>
          <h1 className="text-2xl font-heading font-bold text-foreground mb-2">{statusLabel}</h1>
          <p className="text-muted-foreground mb-2">
            {statusMessage}
          </p>
          <p className="text-sm text-muted-foreground/60 mb-6">
            Logged in as <span className="font-medium text-foreground">{profile.username}</span>
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => navigate('/owner/verification')}
              className="w-full flex items-center justify-center gap-2 py-2.5 gradient-hero text-primary-foreground rounded-xl font-semibold transition-opacity hover:opacity-90"
            >
              <FileCheck size={16} /> Open Verification
            </button>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="w-full flex items-center justify-center gap-2 py-2.5 gradient-hero text-primary-foreground rounded-xl font-semibold transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
              {refreshing ? 'Checking...' : 'Check Approval Status'}
            </button>
            <button
              onClick={() => { signOut(); navigate('/login'); }}
              className="w-full flex items-center justify-center gap-2 py-2.5 border border-border text-foreground rounded-xl font-semibold hover:bg-secondary transition-colors"
            >
              <LogOut size={16} /> Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <DashboardRefreshContext.Provider value={refreshContextValue}>
    <div className="min-h-screen flex bg-background">
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-foreground/30 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`
        fixed lg:sticky top-0 left-0 z-50 h-screen ${collapsed ? 'w-[72px]' : 'w-[280px]'} gradient-sidebar flex flex-col
        transform transition-all duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className={`p-6 flex items-center ${collapsed ? 'justify-center' : 'justify-between'}`}>
          {!collapsed && (
            <Link to="/" className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${roleColors[role]} flex items-center justify-center`}>
                <Home size={20} className="text-primary-foreground" />
              </div>
              <span className="text-lg font-heading font-bold text-sidebar-foreground">
                Smart Hostel
              </span>
            </Link>
          )}
          {collapsed && (
            <Link to="/">
              <div className={`w-10 h-10 rounded-xl ${roleColors[role]} flex items-center justify-center`}>
                <Home size={20} className="text-primary-foreground" />
              </div>
            </Link>
          )}
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-sidebar-foreground/70 hover:text-sidebar-foreground">
            <X size={20} />
          </button>
        </div>

        {/* Role badge */}
        {!collapsed && (
          <div className="px-6 mb-6">
            <div className="px-3 py-1.5 rounded-lg bg-sidebar-accent text-sidebar-accent-foreground text-xs font-semibold tracking-wide uppercase">
              {roleLabels[role]}
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className={`flex-1 ${collapsed ? 'px-2' : 'px-4'} space-y-1 overflow-y-auto`}>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                title={collapsed ? item.label : undefined}
                className={`
                  flex items-center ${collapsed ? 'justify-center' : ''} gap-3 ${collapsed ? 'px-2' : 'px-4'} py-3 rounded-xl text-sm font-medium transition-all duration-200 relative
                  ${isActive
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-lg'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
                  }
                `}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute inset-0 bg-sidebar-primary rounded-xl"
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  />
                )}
                <span className={`relative z-10 flex items-center ${collapsed ? '' : 'gap-3'}`}>
                  {item.icon}
                  {!collapsed && <span>{item.label}</span>}
                </span>
                {isActive && !collapsed && <ChevronRight size={16} className="ml-auto relative z-10" />}
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className={`p-4 border-t border-sidebar-border ${collapsed ? 'flex flex-col items-center' : ''}`}>
          {!collapsed && (
            <div className="flex items-center gap-3 px-4 py-3">
              <div className={`w-9 h-9 rounded-full ${roleColors[role]} flex items-center justify-center text-primary-foreground text-sm font-bold`}>
                {userName.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">{userName}</p>
                <p className="text-xs text-sidebar-foreground/50">{profile?.email}</p>
              </div>
            </div>
          )}
          {collapsed && (
            <div className={`w-9 h-9 rounded-full ${roleColors[role]} flex items-center justify-center text-primary-foreground text-sm font-bold mb-2`}>
              {userName.charAt(0)}
            </div>
          )}
          <button
            onClick={handleSignOut}
            title={collapsed ? 'Log out' : undefined}
            className={`flex items-center ${collapsed ? 'justify-center' : ''} gap-3 ${collapsed ? 'px-2' : 'px-4'} py-2.5 w-full rounded-xl text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors`}
          >
            <LogOut size={18} />
            {!collapsed && <span>Log out</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-card/80 backdrop-blur-xl border-b border-border px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  if (window.innerWidth >= 1024) {
                    setCollapsed(!collapsed);
                  } else {
                    setSidebarOpen(true);
                  }
                }}
                className="p-2 rounded-lg hover:bg-secondary transition-colors"
              >
                <Menu size={20} />
              </button>
              {/* Breadcrumb */}
              <nav className="hidden sm:flex items-center gap-1.5 text-sm">
                {breadcrumbs.map((crumb, i) => (
                  <span key={crumb.path} className="flex items-center gap-1.5">
                    {i > 0 && <ChevronRight size={14} className="text-muted-foreground/50" />}
                    <span className={i === breadcrumbs.length - 1 ? 'font-medium text-foreground' : 'text-muted-foreground hover:text-foreground cursor-pointer'}>
                      {crumb.label}
                    </span>
                  </span>
                ))}
              </nav>
            </div>
            <div className="flex items-center gap-2">
              {/* Theme toggle */}
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="p-2.5 rounded-xl hover:bg-secondary transition-colors"
                title="Toggle theme"
              >
                {theme === 'dark' ? <Sun size={20} className="text-muted-foreground" /> : <Moon size={20} className="text-muted-foreground" />}
              </button>

              {/* Notification bell */}
              <div className="relative">
                <button
                  onClick={() => setNotificationOpen((current) => !current)}
                  className="p-2.5 rounded-xl hover:bg-secondary transition-colors relative"
                >
                  <Bell size={20} className="text-muted-foreground" />
                  {unreadCount > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 inline-flex min-h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                <AnimatePresence>
                  {notificationOpen && (
                    <>
                      <div className="fixed inset-0 z-30" onClick={() => setNotificationOpen(false)} />
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="absolute right-0 top-full z-40 mt-2 w-[320px] overflow-hidden rounded-2xl border border-border bg-card shadow-card"
                      >
                        <div className="border-b border-border px-4 py-3">
                          <h3 className="font-heading text-sm font-bold text-foreground">Notifications</h3>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {notifications.length > 0 ? `${unreadCount} unread announcement${unreadCount === 1 ? '' : 's'}` : 'No new notifications'}
                          </p>
                        </div>
                        {notifications.length === 0 ? (
                          <div className="px-4 py-6 text-sm text-muted-foreground">
                            No announcements available right now.
                          </div>
                        ) : (
                          <div className="max-h-[360px] overflow-y-auto">
                            {notifications.map((notification) => (
                              <div key={notification._id} className="border-b border-border px-4 py-3 last:border-b-0">
                                <div className="flex items-start gap-3">
                                  <button
                                    type="button"
                                    onClick={() => void openNotification(notification)}
                                    className="min-w-0 flex-1 text-left"
                                  >
                                    <div className="flex items-center gap-2">
                                      <p className={`text-sm font-semibold ${notification.isRead ? 'text-foreground' : 'text-primary'}`}>
                                        {notification.title}
                                      </p>
                                      {!notification.isRead && (
                                        <span className="inline-block h-2.5 w-2.5 rounded-full bg-red-500" />
                                      )}
                                    </div>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                      {truncateNotificationMessage(notification.message)}
                                    </p>
                                    <p className="mt-2 text-[11px] text-muted-foreground/80">
                                      {new Date(notification.publishedAt || notification.createdAt || Date.now()).toLocaleDateString()}
                                    </p>
                                  </button>
                                  {!notification.isRead && profile?.role !== 'admin' && (
                                    <button
                                      type="button"
                                      onClick={() => void markNotificationRead(notification)}
                                      className="shrink-0 rounded-lg border border-border px-2.5 py-1.5 text-[11px] font-semibold text-foreground hover:bg-secondary"
                                    >
                                      Mark read
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>

              {/* User avatar - mobile */}
              <div className="lg:hidden">
                <div className={`w-9 h-9 rounded-full ${roleColors[role]} flex items-center justify-center text-primary-foreground text-sm font-bold`}>
                  {userName.charAt(0)}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            {children}
          </motion.div>
        </main>
      </div>

      <AnimatePresence>
        {selectedNotification && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
              onClick={() => setSelectedNotification(null)}
            />
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              className="fixed left-1/2 top-1/2 z-50 w-[92vw] max-w-xl -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border border-border bg-card shadow-card"
            >
              <div className="flex items-start justify-between gap-4 border-b border-border p-6">
                <div>
                  <h3 className="font-heading text-xl font-bold text-foreground">{selectedNotification.title}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {new Date(selectedNotification.publishedAt || selectedNotification.createdAt || Date.now()).toLocaleString()}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedNotification(null)}
                  className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="p-6">
                <p className="whitespace-pre-wrap text-sm leading-6 text-foreground">{selectedNotification.message}</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
    </DashboardRefreshContext.Provider>
  );
}
