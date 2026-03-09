import { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layouts/DashboardLayout';
import { api, ApiError } from '../../lib/api';
import { CheckCircle, XCircle, Clock, Eye, FileText, ExternalLink } from 'lucide-react';

interface Owner {
  _id: string;
  username: string;
  email: string;
  isApproved: boolean;
  isEmailVerified: boolean;
  businessLicense?: string;
  createdAt: string;
}

export function VerifyOwners() {
  const [owners, setOwners] = useState<Owner[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'pending' | 'all'>('pending');
  const [selected, setSelected] = useState<Owner | null>(null);
  const [processing, setProcessing] = useState(false);
  const [actionError, setActionError] = useState('');

  useEffect(() => { loadOwners(); }, []);

  const loadOwners = async () => {
    try {
      const data = await api.get<Owner[]>('/admin/owners');
      setOwners(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading owners:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (owner: Owner) => {
    setProcessing(true);
    setActionError('');
    try {
      await api.put(`/admin/owners/${owner._id}/approve`);
      setOwners(prev => prev.map(o => o._id === owner._id ? { ...o, isApproved: true } : o));
      setSelected(null);
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Failed to approve owner.');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (owner: Owner) => {
    if (!confirm(`Reject and delete owner "${owner.username}"? This cannot be undone.`)) return;
    setProcessing(true);
    setActionError('');
    try {
      await api.delete(`/admin/owners/${owner._id}/reject`);
      setOwners(prev => prev.filter(o => o._id !== owner._id));
      setSelected(null);
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Failed to reject owner.');
    } finally {
      setProcessing(false);
    }
  };

  const displayed = tab === 'pending' ? owners.filter(o => !o.isApproved) : owners;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Owner Approvals</h1>
            <p className="text-gray-600 mt-1">Review and approve owner registration requests</p>
          </div>
          <div className="flex gap-2">
            {(['pending', 'all'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-4 py-2 rounded-lg font-medium capitalize transition-colors ${
                  tab === t ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}>
                {t === 'pending' ? `Pending (${owners.filter(o => !o.isApproved).length})` : 'All Owners'}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
          </div>
        ) : displayed.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <CheckCircle size={48} className="mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">{tab === 'pending' ? 'No pending approvals' : 'No owners registered yet'}</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Owner</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">License</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Registered</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {displayed.map(owner => (
                    <tr key={owner._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{owner.username}</div>
                        <div className="text-sm text-gray-500">{owner.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        {owner.businessLicense ? (
                          <a
                            href={owner.businessLicense}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
                          >
                            <FileText size={14} /> View
                          </a>
                        ) : <span className="text-gray-400 text-sm">—</span>}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(owner.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        {owner.isApproved ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle size={12} /> Approved
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            <Clock size={12} /> Pending
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <button onClick={() => { setSelected(owner); setActionError(''); }}
                          className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 text-sm">
                          <Eye size={14} /> Review
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Review Owner</h2>

            {actionError && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{actionError}</div>
            )}

            <div className="space-y-3 mb-6">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Username</span>
                <span className="font-medium text-gray-900">{selected.username}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Email</span>
                <span className="font-medium text-gray-900">{selected.email}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Email Verified</span>
                <span className={`font-medium ${selected.isEmailVerified ? 'text-green-600' : 'text-red-600'}`}>
                  {selected.isEmailVerified ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Registered</span>
                <span className="font-medium text-gray-900">{new Date(selected.createdAt).toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Business License</span>
                {selected.businessLicense ? (
                  <a
                    href={selected.businessLicense}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800"
                  >
                    <ExternalLink size={13} /> Open Document
                  </a>
                ) : (
                  <span className="text-sm text-gray-400">— Not uploaded</span>
                )}
              </div>
              <div className="flex justify-between py-2">
                <span className="text-sm text-gray-600">Status</span>
                {selected.isApproved ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-800">
                    <CheckCircle size={12} /> Approved
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-yellow-100 text-yellow-800">
                    <Clock size={12} /> Pending
                  </span>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setSelected(null)}
                className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors">
                Close
              </button>
              {!selected.isApproved && (
                <>
                  <button onClick={() => handleReject(selected)} disabled={processing}
                    className="flex-1 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                    <XCircle size={16} /> {processing ? '...' : 'Reject'}
                  </button>
                  <button onClick={() => handleApprove(selected)} disabled={processing}
                    className="flex-1 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                    <CheckCircle size={16} /> {processing ? '...' : 'Approve'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
