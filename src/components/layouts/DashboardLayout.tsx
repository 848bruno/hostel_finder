import { ReactNode, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import { useAuth } from '../../contexts/AuthContext';
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

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { profile, signOut, updateProfile } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const { theme, setTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [refreshing, setRefreshing] = useState(false);

  const role = (profile?.role as UserRole) || 'student';
  const userName = profile?.username || 'User';
  const navItems = navMap[role] || studentNav;

  // Build breadcrumb from path
  const pathSegments = location.pathname.split('/').filter(Boolean);
  const breadcrumbs = pathSegments.map((seg, i) => ({
    label: seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, ' '),
    path: '/' + pathSegments.slice(0, i + 1).join('/'),
  }));

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Pending-approval gate for owners
  if (profile?.role === 'owner' && profile.isApproved === false) {
    const handleRefresh = async () => {
      setRefreshing(true);
      try { await updateProfile({}); } finally { setRefreshing(false); }
    };
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="bg-card rounded-2xl shadow-card border border-border p-8 max-w-md w-full text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-warning/10 rounded-full mb-4">
            <Clock size={32} className="text-warning" />
          </div>
          <h1 className="text-2xl font-heading font-bold text-foreground mb-2">Awaiting Admin Approval</h1>
          <p className="text-muted-foreground mb-2">
            Your owner account is under review. You'll receive an email once it's approved.
          </p>
          <p className="text-sm text-muted-foreground/60 mb-6">
            Logged in as <span className="font-medium text-foreground">{profile.username}</span>
          </p>
          <div className="flex flex-col gap-3">
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
                <button className="p-2.5 rounded-xl hover:bg-secondary transition-colors relative">
                  <Bell size={20} className="text-muted-foreground" />
                </button>
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
    </div>
  );
}
