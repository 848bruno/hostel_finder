import { useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '../../components/layouts/DashboardLayout';
import { ApiError, api, getToken } from '../../lib/api';
import { AlertCircle, CheckCircle, Clock, Download, Eye, FileText, XCircle } from 'lucide-react';

type VerificationStatus = 'not_submitted' | 'submitted' | 'approved' | 'rejected';
type DocumentKey = 'idDocument' | 'businessCertificate' | 'taxComplianceCertificate' | 'propertyProof';

interface VerificationDetails {
  status: VerificationStatus;
  rejectionReason?: string;
  submittedAt?: string | null;
  reviewedAt?: string | null;
  personalInfo?: {
    fullName?: string;
    idNumber?: string;
    phone?: string;
  };
  businessInfo?: {
    name?: string;
    registrationNumber?: string;
    kraPin?: string;
  };
  documents?: Partial<Record<DocumentKey, string>>;
}

interface OwnerRecord {
  _id: string;
  username: string;
  email: string;
  phone?: string;
  isApproved: boolean;
  isEmailVerified: boolean;
  createdAt: string;
  verification?: VerificationDetails;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5100/api';

const documentLabels: Record<DocumentKey, string> = {
  idDocument: 'National ID',
  businessCertificate: 'Business certificate',
  taxComplianceCertificate: 'KRA tax compliance',
  propertyProof: 'Property proof',
};

async function downloadAdminDocument(ownerId: string, documentType: DocumentKey) {
  const token = getToken();
  const response = await fetch(`${API_BASE_URL}/admin/owners/${ownerId}/documents/${documentType}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!response.ok) {
    let message = 'Failed to download document.';
    try {
      const data = await response.json();
      message = data.message || message;
    } catch {
      // ignore invalid json error bodies
    }
    throw new ApiError(response.status, message);
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${documentType}-${ownerId}`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

function formatDate(value?: string | null) {
  if (!value) return 'Not yet';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Not yet' : date.toLocaleString();
}

export function VerifyOwners() {
  const [owners, setOwners] = useState<OwnerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'pending' | 'all'>('pending');
  const [selected, setSelected] = useState<OwnerRecord | null>(null);
  const [processing, setProcessing] = useState(false);
  const [actionError, setActionError] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  const loadOwners = async () => {
    setLoading(true);
    try {
      const data = await api.get<OwnerRecord[]>('/admin/owners');
      setOwners(Array.isArray(data) ? data : []);
    } catch (error) {
      setActionError(error instanceof ApiError ? error.message : 'Failed to load owners.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOwners();
  }, []);

  const pendingOwners = useMemo(
    () => owners.filter((owner) => owner.verification?.status === 'submitted'),
    [owners]
  );

  const displayed = tab === 'pending' ? pendingOwners : owners;

  const updateOwnerRecord = (updatedOwner: OwnerRecord) => {
    setOwners((current) => current.map((owner) => owner._id === updatedOwner._id ? updatedOwner : owner));
    setSelected(updatedOwner);
  };

  const handleReview = async (owner: OwnerRecord, action: 'approve' | 'reject') => {
    setProcessing(true);
    setActionError('');

    try {
      const payload = action === 'reject'
        ? { action, rejectionReason }
        : { action };
      const result = await api.put<{ owner: OwnerRecord }>(`/admin/owners/${owner._id}/verification`, payload);
      updateOwnerRecord(result.owner);
      if (action === 'approve') {
        setSelected(null);
      }
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Failed to review owner verification.');
    } finally {
      setProcessing(false);
    }
  };

  const handleDocumentDownload = async (ownerId: string, documentType: DocumentKey) => {
    setActionError('');
    try {
      await downloadAdminDocument(ownerId, documentType);
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Failed to download document.');
    }
  };

  const statusBadge = (status: VerificationStatus | undefined) => {
    if (status === 'approved') {
      return <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800"><CheckCircle size={12} /> Approved</span>;
    }
    if (status === 'rejected') {
      return <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-800"><XCircle size={12} /> Rejected</span>;
    }
    if (status === 'submitted') {
      return <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-800"><Clock size={12} /> Awaiting review</span>;
    }
    return <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700"><AlertCircle size={12} /> Not submitted</span>;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Owner Verifications</h1>
            <p className="mt-1 text-gray-600">Review submitted owner KYC documents and approve or reject them.</p>
          </div>
          <div className="flex gap-2">
            {(['pending', 'all'] as const).map((value) => (
              <button
                key={value}
                onClick={() => setTab(value)}
                className={`rounded-lg px-4 py-2 font-medium capitalize transition-colors ${
                  tab === value ? 'bg-primary text-white' : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                {value === 'pending' ? `Pending (${pendingOwners.length})` : 'All owners'}
              </button>
            ))}
          </div>
        </div>

        {actionError && !selected && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{actionError}</div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
          </div>
        ) : displayed.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white py-12 text-center">
            <CheckCircle size={48} className="mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">{tab === 'pending' ? 'No submitted owner verifications.' : 'No owners found.'}</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-gray-200 bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Owner</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Business</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Submitted</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {displayed.map((owner) => (
                    <tr key={owner._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{owner.username}</div>
                        <div className="text-sm text-gray-500">{owner.email}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {owner.verification?.businessInfo?.name || 'Not submitted'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {formatDate(owner.verification?.submittedAt)}
                      </td>
                      <td className="px-6 py-4">
                        {statusBadge(owner.verification?.status)}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => {
                            setSelected(owner);
                            setRejectionReason(owner.verification?.rejectionReason || '');
                            setActionError('');
                          }}
                          className="flex items-center gap-1 text-sm font-medium text-primary hover:text-primary"
                        >
                          <Eye size={14} />
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

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-white p-6">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Owner verification review</h2>
                <p className="mt-1 text-sm text-gray-600">Check submitted details and attached documents before taking action.</p>
              </div>
              {statusBadge(selected.verification?.status)}
            </div>

            {actionError && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{actionError}</div>
            )}

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="space-y-3 rounded-xl border border-gray-200 p-4">
                <h3 className="font-semibold text-gray-900">Owner account</h3>
                <div className="flex justify-between gap-4 text-sm">
                  <span className="text-gray-500">Username</span>
                  <span className="font-medium text-gray-900">{selected.username}</span>
                </div>
                <div className="flex justify-between gap-4 text-sm">
                  <span className="text-gray-500">Email</span>
                  <span className="font-medium text-gray-900">{selected.email}</span>
                </div>
                <div className="flex justify-between gap-4 text-sm">
                  <span className="text-gray-500">Phone</span>
                  <span className="font-medium text-gray-900">{selected.verification?.personalInfo?.phone || selected.phone || '—'}</span>
                </div>
                <div className="flex justify-between gap-4 text-sm">
                  <span className="text-gray-500">Email verified</span>
                  <span className={`font-medium ${selected.isEmailVerified ? 'text-green-600' : 'text-red-600'}`}>
                    {selected.isEmailVerified ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="flex justify-between gap-4 text-sm">
                  <span className="text-gray-500">Registered</span>
                  <span className="font-medium text-gray-900">{formatDate(selected.createdAt)}</span>
                </div>
              </div>

              <div className="space-y-3 rounded-xl border border-gray-200 p-4">
                <h3 className="font-semibold text-gray-900">Business details</h3>
                <div className="flex justify-between gap-4 text-sm">
                  <span className="text-gray-500">Business name</span>
                  <span className="font-medium text-gray-900">{selected.verification?.businessInfo?.name || '—'}</span>
                </div>
                <div className="flex justify-between gap-4 text-sm">
                  <span className="text-gray-500">Registration number</span>
                  <span className="font-medium text-gray-900">{selected.verification?.businessInfo?.registrationNumber || '—'}</span>
                </div>
                <div className="flex justify-between gap-4 text-sm">
                  <span className="text-gray-500">KRA PIN</span>
                  <span className="font-medium text-gray-900">{selected.verification?.businessInfo?.kraPin || '—'}</span>
                </div>
                <div className="flex justify-between gap-4 text-sm">
                  <span className="text-gray-500">ID number</span>
                  <span className="font-medium text-gray-900">{selected.verification?.personalInfo?.idNumber || '—'}</span>
                </div>
                <div className="flex justify-between gap-4 text-sm">
                  <span className="text-gray-500">Submitted</span>
                  <span className="font-medium text-gray-900">{formatDate(selected.verification?.submittedAt)}</span>
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-xl border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-900">Documents</h3>
              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                {(Object.keys(documentLabels) as DocumentKey[]).map((documentType) => {
                  const hasDocument = Boolean(selected.verification?.documents?.[documentType]);
                  return (
                    <div key={documentType} className="flex items-center justify-between rounded-xl border border-gray-200 p-3">
                      <div className="flex items-center gap-3">
                        <FileText size={18} className="text-gray-500" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{documentLabels[documentType]}</p>
                          <p className="text-xs text-gray-500">{hasDocument ? 'Document uploaded' : 'Not provided'}</p>
                        </div>
                      </div>
                      {hasDocument && (
                        <button
                          onClick={() => handleDocumentDownload(selected._id, documentType)}
                          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                          <Download size={14} />
                          Download
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {selected.verification?.status === 'rejected' && selected.verification?.rejectionReason && (
              <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                Previous rejection reason: {selected.verification.rejectionReason}
              </div>
            )}

            {(selected.verification?.status === 'submitted' || selected.verification?.status === 'rejected') && (
              <div className="mt-6 rounded-xl border border-gray-200 p-4">
                <label className="mb-2 block text-sm font-medium text-gray-700">Rejection reason</label>
                <textarea
                  value={rejectionReason}
                  onChange={(event) => setRejectionReason(event.target.value)}
                  rows={4}
                  placeholder="Required only when rejecting."
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            )}

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => setSelected(null)}
                className="flex-1 rounded-lg border border-gray-300 py-2.5 font-medium text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
              {selected.verification?.status === 'submitted' && (
                <>
                  <button
                    onClick={() => handleReview(selected, 'reject')}
                    disabled={processing}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-600 py-2.5 font-medium text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    <XCircle size={16} />
                    {processing ? 'Processing...' : 'Reject'}
                  </button>
                  <button
                    onClick={() => handleReview(selected, 'approve')}
                    disabled={processing}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-green-600 py-2.5 font-medium text-white hover:bg-green-700 disabled:opacity-50"
                  >
                    <CheckCircle size={16} />
                    {processing ? 'Processing...' : 'Approve'}
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
