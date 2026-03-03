import { ReactNode } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  Home, Search, Building2, CreditCard, Settings,
  LogOut, BarChart, Users, FileCheck, Menu, X
} from 'lucide-react';
import { useState } from 'react';

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const getNavItems = () => {
    if (profile?.role === 'student') {
      return [
        { icon: Home, label: 'Dashboard', path: '/student/dashboard' },
        { icon: Search, label: 'Search Hostels', path: '/student/search' },
        { icon: Building2, label: 'My Bookings', path: '/student/bookings' },
        { icon: Settings, label: 'Settings', path: '/student/settings' },
      ];
    } else if (profile?.role === 'owner') {
      return [
        { icon: Home, label: 'Dashboard', path: '/owner/dashboard' },
        { icon: Building2, label: 'My Hostels', path: '/owner/hostels' },
        { icon: Users, label: 'Tenant List', path: '/owner/tenants' },
        { icon: BarChart, label: 'Analytics', path: '/owner/analytics' },
        { icon: Settings, label: 'Settings', path: '/owner/settings' },
      ];
    } else if (profile?.role === 'admin') {
      return [
        { icon: Home, label: 'Dashboard', path: '/admin/dashboard' },
        { icon: FileCheck, label: 'Verify Owners', path: '/admin/verifications' },
        { icon: Users, label: 'Manage Users', path: '/admin/users' },
        { icon: Building2, label: 'Manage Hostels', path: '/admin/hostels' },
        { icon: CreditCard, label: 'Payments', path: '/admin/payments' },
        { icon: BarChart, label: 'Analytics', path: '/admin/analytics' },
      ];
    }
    return [];
  };

  const navItems = getNavItems();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white shadow-md z-50 px-4 py-3 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Smart hostel finder</h1>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-lg hover:bg-gray-100"
        >
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <div className={`fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="h-full flex flex-col">
          <div className="p-6 border-b">
            <h1 className="text-2xl font-bold text-gray-900">Smart hostel finder</h1>
            <p className="text-sm text-gray-600 mt-1 capitalize">{profile?.role}</p>
          </div>

          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon size={20} />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t">
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-900">{profile?.full_name}</p>
              <p className="text-xs text-gray-600">{profile?.email}</p>
            </div>
            <button
              onClick={handleSignOut}
              className="w-full flex items-center space-x-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut size={20} />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </div>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      <div className="lg:ml-64 min-h-screen">
        <div className="pt-20 lg:pt-0 p-4 lg:p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
