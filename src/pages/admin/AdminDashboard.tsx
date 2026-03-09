import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '../../components/layouts/DashboardLayout';
import { api } from '../../lib/api';
import { Users, Building2, TrendingUp, AlertCircle } from 'lucide-react';

interface AdminStats {
  totalStudents: number;
  totalOwners: number;
  approvedOwners: number;
  pendingOwners: number;
  totalHostels: number;
  approvedHostels: number;
  pendingHostels: number;
}

export function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats>({
    totalStudents: 0,
    totalOwners: 0,
    approvedOwners: 0,
    pendingOwners: 0,
    totalHostels: 0,
    approvedHostels: 0,
    pendingHostels: 0,
  });
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const data = await api.get<AdminStats>('/admin/stats');
      setStats(data);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">System overview and management</p>
        </div>

        {stats.pendingOwners > 0 && (
          <Link to="/admin/verifications" className="block">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3 hover:bg-yellow-100 transition-colors">
              <AlertCircle className="text-yellow-600 flex-shrink-0" size={20} />
              <div>
                <h3 className="font-semibold text-yellow-900">Pending Owner Approvals</h3>
                <p className="text-sm text-yellow-800 mt-1">
                  {stats.pendingOwners} owner{stats.pendingOwners !== 1 ? 's' : ''} waiting for approval
                </p>
              </div>
            </div>
          </Link>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Students</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalStudents}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <Users className="text-blue-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Owners</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalOwners}</p>
                <p className="text-xs text-gray-500 mt-1">{stats.approvedOwners} approved</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <Users className="text-purple-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Hostels</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalHostels}</p>
                <p className="text-xs text-gray-500 mt-1">{stats.approvedHostels} approved</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <Building2 className="text-green-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Pending Hostels</p>
                <p className="text-3xl font-bold text-gray-900">{stats.pendingHostels}</p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-lg">
                <TrendingUp className="text-yellow-600" size={24} />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <Link
                to="/admin/verifications"
                className="block p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">Verify Owners</h3>
                    <p className="text-sm text-gray-600 mt-1">Review pending owner approvals</p>
                  </div>
                  {stats.pendingOwners > 0 && (
                    <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                      {stats.pendingOwners}
                    </span>
                  )}
                </div>
              </Link>
              <Link
                to="/admin/users"
                className="block p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
              >
                <h3 className="font-semibold text-gray-900">Manage Users</h3>
                <p className="text-sm text-gray-600 mt-1">View and manage all platform users</p>
              </Link>
              <Link
                to="/admin/hostels"
                className="block p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
              >
                <h3 className="font-semibold text-gray-900">Manage Hostels</h3>
                <p className="text-sm text-gray-600 mt-1">Oversee all hostel listings</p>
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">System Health</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <span className="text-sm font-medium text-green-900">Database Status</span>
                <span className="px-2 py-1 bg-green-200 text-green-800 rounded text-xs font-semibold">
                  Healthy
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <span className="text-sm font-medium text-blue-900">Total Students</span>
                <span className="text-blue-900 font-semibold">{stats.totalStudents}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <span className="text-sm font-medium text-yellow-900">Pending Owner Approvals</span>
                <span className="text-yellow-900 font-semibold">{stats.pendingOwners}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
