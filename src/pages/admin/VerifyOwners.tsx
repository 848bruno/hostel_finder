import { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layouts/DashboardLayout';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { OwnerVerification, Profile } from '../../types/database';
import { CheckCircle, XCircle, Clock, Eye } from 'lucide-react';

type VerificationWithProfile = OwnerVerification & { owner: Profile };

export function VerifyOwners() {
  const { profile } = useAuth();
  const [verifications, setVerifications] = useState<VerificationWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVerification, setSelectedVerification] = useState<VerificationWithProfile | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadVerifications();
  }, []);

  const loadVerifications = async () => {
    try {
      const { data } = await supabase
        .from('owner_verifications')
        .select(`
          *,
          owner:profiles(*)
        `)
        .order('submitted_at', { ascending: false });

      if (data) {
        setVerifications(data as VerificationWithProfile[]);
      }
    } catch (error) {
      console.error('Error loading verifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (verification: VerificationWithProfile) => {
    setProcessing(true);
    try {
      const { error } = await supabase
        .from('owner_verifications')
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString(),
          reviewed_by: profile?.id,
        })
        .eq('id', verification.id);

      if (error) throw error;

      alert('Owner verified successfully!');
      loadVerifications();
      setSelectedVerification(null);
    } catch (error) {
      console.error('Error approving verification:', error);
      alert('Failed to approve verification');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (verification: VerificationWithProfile) => {
    if (!rejectionReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    setProcessing(true);
    try {
      const { error } = await supabase
        .from('owner_verifications')
        .update({
          status: 'rejected',
          rejection_reason: rejectionReason,
          reviewed_at: new Date().toISOString(),
          reviewed_by: profile?.id,
        })
        .eq('id', verification.id);

      if (error) throw error;

      alert('Verification rejected');
      loadVerifications();
      setSelectedVerification(null);
      setRejectionReason('');
    } catch (error) {
      console.error('Error rejecting verification:', error);
      alert('Failed to reject verification');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle size={20} className="text-green-600" />;
      case 'rejected': return <XCircle size={20} className="text-red-600" />;
      case 'pending': return <Clock size={20} className="text-yellow-600" />;
      default: return null;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Verify Owners</h1>
          <p className="text-gray-600 mt-1">Review and approve owner verification requests</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : verifications.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <CheckCircle size={48} className="mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">No verification requests</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Owner
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Business Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Submitted
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {verifications.map((verification) => (
                    <tr key={verification.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-gray-900">{verification.owner.full_name}</div>
                          <div className="text-sm text-gray-500">{verification.owner.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-gray-900">{verification.business_name}</div>
                        {verification.business_registration_number && (
                          <div className="text-sm text-gray-500">{verification.business_registration_number}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(verification.submitted_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(verification.status)}`}>
                          {getStatusIcon(verification.status)}
                          {verification.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => setSelectedVerification(verification)}
                          className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                        >
                          <Eye size={16} />
                          Review
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

      {selectedVerification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Review Verification</h2>

            <div className="space-y-4 mb-6">
              <div>
                <label className="text-sm font-medium text-gray-700">Owner Name</label>
                <p className="text-gray-900 mt-1">{selectedVerification.owner.full_name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Email</label>
                <p className="text-gray-900 mt-1">{selectedVerification.owner.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Business Name</label>
                <p className="text-gray-900 mt-1">{selectedVerification.business_name}</p>
              </div>
              {selectedVerification.business_registration_number && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Registration Number</label>
                  <p className="text-gray-900 mt-1">{selectedVerification.business_registration_number}</p>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-gray-700">Submitted Date</label>
                <p className="text-gray-900 mt-1">
                  {new Date(selectedVerification.submitted_at).toLocaleString()}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Current Status</label>
                <p className="mt-1">
                  <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedVerification.status)}`}>
                    {getStatusIcon(selectedVerification.status)}
                    {selectedVerification.status}
                  </span>
                </p>
              </div>
            </div>

            {selectedVerification.status === 'pending' && (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rejection Reason (if rejecting)
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Provide a reason if rejecting..."
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setSelectedVerification(null);
                      setRejectionReason('');
                    }}
                    className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleReject(selectedVerification)}
                    disabled={processing}
                    className="flex-1 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <XCircle size={20} />
                    Reject
                  </button>
                  <button
                    onClick={() => handleApprove(selectedVerification)}
                    disabled={processing}
                    className="flex-1 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <CheckCircle size={20} />
                    Approve
                  </button>
                </div>
              </>
            )}

            {selectedVerification.status !== 'pending' && (
              <button
                onClick={() => {
                  setSelectedVerification(null);
                  setRejectionReason('');
                }}
                className="w-full py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium transition-colors"
              >
                Close
              </button>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
