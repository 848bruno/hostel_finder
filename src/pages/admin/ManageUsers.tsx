import { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layouts/DashboardLayout';
import { api, ApiError } from '../../lib/api';
import { Users, Search, CheckCircle, XCircle, ShieldCheck, ShieldOff, Trash2 } from 'lucide-react';

interface UserRow {
  _id: string;
  username: string;
  email: string;
  role: 'student' | 'owner';
  isEmailVerified: boolean;
  isApproved?: boolean; // owners only
  createdAt: string;
}

export function ManageUsers() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'student' | 'owner'>('all');
  const [processing, setProcessing] = useState<string | null>(null);
  const [actionError, setActionError] = useState('');

  useEffect(() => { loadUsers(); }, []);

  const loadUsers = async () => {
    try {
      const [students, owners] = await Promise.all([
        api.get<UserRow[]>('/admin/students'),
        api.get<UserRow[]>('/admin/owners'),
      ]);
      const combined = [
        ...(Array.isArray(students) ? students.map(s => ({ ...s, role: 'student' as const })) : []),
        ...(Array.isArray(owners) ? owners.map(o => ({ ...o, role: 'owner' as const })) : []),
      ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setUsers(combined);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const filtered = users.filter(u => {
    if (roleFilter !== 'all' && u.role !== roleFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return u.username.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    }
    return true;
  });

  const handleOwnerAction = async (user: UserRow, action: 'approve' | 'suspend') => {
    setProcessing(user._id);
    setActionError('');
    try {
      await api.put(`/admin/owners/${user._id}/${action}`);
      setUsers(prev => prev.map(u =>
        u._id === user._id ? { ...u, isApproved: action === 'approve' } : u
      ));
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : `Failed to ${action} owner.`);
    } finally {
      setProcessing(null);
    }
  };

  const handleDelete = async (user: UserRow) => {
    const warn = user.role === 'owner'
      ? `Delete owner "${user.username}" and ALL their hostels? This cannot be undone.`
      : `Delete student "${user.username}"? This cannot be undone.`;
    if (!confirm(warn)) return;
    setProcessing(user._id);
    setActionError('');
    try {
      const endpoint = user.role === 'owner'
        ? `/admin/owners/${user._id}`
        : `/admin/students/${user._id}`;
      await api.delete(endpoint);
      setUsers(prev => prev.filter(u => u._id !== user._id));
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Failed to delete user.');
    } finally {
      setProcessing(null);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner': return 'bg-blue-100 text-blue-800';
      case 'student': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manage Users</h1>
          <p className="text-gray-600 mt-1">View and manage all platform users</p>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as typeof roleFilter)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All ({users.length})</option>
              <option value="student">Students ({users.filter(u => u.role === 'student').length})</option>
              <option value="owner">Owners ({users.filter(u => u.role === 'owner').length})</option>
            </select>
          </div>
        </div>

        {actionError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{actionError}</div>
        )}

        <div className="text-sm text-gray-600">Found {filtered.length} user{filtered.length !== 1 ? 's' : ''}</div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <Users size={48} className="mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">No users found</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email Verified</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Owner Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filtered.map(user => (
                    <tr key={user._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{user.username}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getRoleBadgeColor(user.role)}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {user.isEmailVerified
                          ? <CheckCircle size={16} className="text-green-500" />
                          : <XCircle size={16} className="text-red-400" />}
                      </td>
                      <td className="px-6 py-4">
                        {user.role === 'owner' ? (
                          user.isApproved
                            ? <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">Approved</span>
                            : <span className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full">Pending</span>
                        ) : <span className="text-gray-400 text-sm">—</span>}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {user.role === 'owner' && (
                            user.isApproved ? (
                              <button
                                onClick={() => handleOwnerAction(user, 'suspend')}
                                disabled={processing === user._id}
                                className="flex items-center gap-1 px-3 py-1.5 bg-orange-50 text-orange-600 border border-orange-200 rounded-lg hover:bg-orange-100 text-xs font-medium transition-colors disabled:opacity-50"
                              >
                                <ShieldOff size={13} />
                                {processing === user._id ? '...' : 'Suspend'}
                              </button>
                            ) : (
                              <button
                                onClick={() => handleOwnerAction(user, 'approve')}
                                disabled={processing === user._id}
                                className="flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 text-xs font-medium transition-colors disabled:opacity-50"
                              >
                                <ShieldCheck size={13} />
                                {processing === user._id ? '...' : 'Approve'}
                              </button>
                            )
                          )}
                          <button
                            onClick={() => handleDelete(user)}
                            disabled={processing === user._id}
                            className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 text-xs font-medium transition-colors disabled:opacity-50"
                          >
                            <Trash2 size={13} />
                            {processing === user._id ? '...' : 'Delete'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
