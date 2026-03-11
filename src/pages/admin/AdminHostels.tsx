import { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layouts/DashboardLayout';
import { api, ApiError } from '../../lib/api';
import { Building2, MapPin, DollarSign, CheckCircle, XCircle, ShieldOff, Trash2 } from 'lucide-react';

interface AdminHostel {
  _id: string;
  name: string;
  location?: { address?: string; city?: string };
  pricePerMonth: number;
  totalRooms: number;
  availableRooms: number;
  isApproved: boolean;
  isActive: boolean;
  hostelType: string;
  images?: string[];
  owner?: { username: string; email: string };
  createdAt: string;
}

export function AdminHostels() {
  const [pendingHostels, setPendingHostels] = useState<AdminHostel[]>([]);
  const [approvedHostels, setApprovedHostels] = useState<AdminHostel[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'pending' | 'approved'>('pending');
  const [processing, setProcessing] = useState<string | null>(null);
  const [actionError, setActionError] = useState('');

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [pendingData, approvedData] = await Promise.all([
        api.get<{ hostels: AdminHostel[] }>('/admin/hostels/pending'),
        api.get<{ hostels: AdminHostel[] }>('/hostels?limit=100'),
      ]);
      setPendingHostels(pendingData.hostels ?? []);
      setApprovedHostels(approvedData.hostels ?? []);
    } catch (error) {
      console.error('Error loading hostels:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (hostel: AdminHostel) => {
    setProcessing(hostel._id);
    setActionError('');
    try {
      await api.put(`/admin/hostels/${hostel._id}/approve`);
      setPendingHostels(prev => prev.filter(h => h._id !== hostel._id));
      setApprovedHostels(prev => [{ ...hostel, isApproved: true }, ...prev]);
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Failed to approve hostel.');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (hostel: AdminHostel) => {
    if (!confirm(`Reject and delete "${hostel.name}"? This cannot be undone.`)) return;
    setProcessing(hostel._id);
    setActionError('');
    try {
      await api.delete(`/admin/hostels/${hostel._id}/reject`);
      setPendingHostels(prev => prev.filter(h => h._id !== hostel._id));
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Failed to reject hostel.');
    } finally {
      setProcessing(null);
    }
  };

  const handleUnapprove = async (hostel: AdminHostel) => {
    setProcessing(hostel._id);
    setActionError('');
    try {
      await api.put(`/admin/hostels/${hostel._id}/unapprove`);
      setApprovedHostels(prev => prev.filter(h => h._id !== hostel._id));
      setPendingHostels(prev => [{ ...hostel, isApproved: false }, ...prev]);
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Failed to revoke approval.');
    } finally {
      setProcessing(null);
    }
  };

  const handleDeleteApproved = async (hostel: AdminHostel) => {
    if (!confirm(`Permanently delete "${hostel.name}"? This cannot be undone.`)) return;
    setProcessing(hostel._id);
    setActionError('');
    try {
      await api.delete(`/admin/hostels/${hostel._id}/reject`);
      setApprovedHostels(prev => prev.filter(h => h._id !== hostel._id));
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Failed to delete hostel.');
    } finally {
      setProcessing(null);
    }
  };

  const displayed = tab === 'pending' ? pendingHostels : approvedHostels;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Manage Hostels</h1>
            <p className="text-gray-600 mt-1">Review and approve hostel listings</p>
          </div>
          <div className="flex gap-2">
            {(['pending', 'approved'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-4 py-2 rounded-lg font-medium capitalize transition-colors ${
                  tab === t ? 'bg-primary text-white' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}>
                {t === 'pending' ? `Pending (${pendingHostels.length})` : `Approved (${approvedHostels.length})`}
              </button>
            ))}
          </div>
        </div>

        {actionError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{actionError}</div>
        )}

        <div className="text-sm text-gray-600">
          {displayed.length} hostel{displayed.length !== 1 ? 's' : ''}
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
          </div>
        ) : displayed.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <Building2 size={48} className="mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">{tab === 'pending' ? 'No pending hostels' : 'No approved hostels yet'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayed.map(hostel => (
              <div key={hostel._id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="h-40 bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white overflow-hidden">
                  {hostel.images && hostel.images.length > 0
                    ? <img src={hostel.images[0]} alt={hostel.name} className="w-full h-full object-cover" />
                    : <Building2 size={56} />}
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-base font-bold text-gray-900 leading-tight">{hostel.name}</h3>
                    <span className={`ml-2 shrink-0 px-2 py-0.5 text-xs font-medium rounded-full ${
                      hostel.isApproved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {hostel.isApproved ? 'Approved' : 'Pending'}
                    </span>
                  </div>

                  {hostel.owner && (
                    <div className="mb-2">
                      <p className="text-sm text-gray-600">Owner: <span className="font-medium">{hostel.owner.username}</span></p>
                      <p className="text-xs text-gray-500">{hostel.owner.email}</p>
                    </div>
                  )}

                  <div className="flex items-start gap-1 text-sm text-gray-600 mb-2">
                    <MapPin size={14} className="mt-0.5 shrink-0" />
                    <span className="line-clamp-1">
                      {hostel.location?.address ?? hostel.location?.city ?? 'No address'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="bg-gray-50 p-2 rounded">
                      <p className="text-xs text-gray-500">Total Rooms</p>
                      <p className="font-semibold text-gray-900 text-sm">{hostel.totalRooms}</p>
                    </div>
                    <div className="bg-gray-50 p-2 rounded">
                      <p className="text-xs text-gray-500">Available</p>
                      <p className="font-semibold text-gray-900 text-sm">{hostel.availableRooms}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-green-600 font-bold text-sm mb-3">
                    <DollarSign size={14} />
                    KSh {hostel.pricePerMonth.toLocaleString()}/mo
                  </div>

                  {tab === 'pending' && (
                    <div className="flex gap-2 pt-2 border-t border-gray-100">
                      <button onClick={() => handleReject(hostel)} disabled={processing === hostel._id}
                        className="flex-1 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 font-medium text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-1">
                        <XCircle size={14} /> {processing === hostel._id ? '...' : 'Reject'}
                      </button>
                      <button onClick={() => handleApprove(hostel)} disabled={processing === hostel._id}
                        className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-1">
                        <CheckCircle size={14} /> {processing === hostel._id ? '...' : 'Approve'}
                      </button>
                    </div>
                  )}

                  {tab === 'approved' && (
                    <div className="pt-2 border-t border-gray-100 space-y-2">
                      <p className="text-xs text-gray-400">Added: {new Date(hostel.createdAt).toLocaleDateString()}</p>
                      <div className="flex gap-2">
                        <button onClick={() => handleUnapprove(hostel)} disabled={processing === hostel._id}
                          className="flex-1 py-2 bg-orange-50 text-orange-600 border border-orange-200 rounded-lg hover:bg-orange-100 font-medium text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-1">
                          <ShieldOff size={13} /> {processing === hostel._id ? '...' : 'Revoke'}
                        </button>
                        <button onClick={() => handleDeleteApproved(hostel)} disabled={processing === hostel._id}
                          className="flex-1 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 font-medium text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-1">
                          <Trash2 size={13} /> {processing === hostel._id ? '...' : 'Delete'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
