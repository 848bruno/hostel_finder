import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layouts/DashboardLayout';
import { useAuth } from '../../contexts/AuthContext';
import { ApiError, api, getToken } from '../../lib/api';
import { AlertCircle, CheckCircle2, Clock, Download, FileText, RefreshCw, Upload, XCircle } from 'lucide-react';

type VerificationStatus = 'not_submitted' | 'submitted' | 'approved' | 'rejected';
type DocumentKey = 'idDocument' | 'businessCertificate' | 'taxComplianceCertificate' | 'propertyProof';

interface VerificationRecord {
  status: VerificationStatus;
  rejectionReason: string;
  submittedAt: string | null;
  reviewedAt: string | null;
  personalInfo: {
    fullName: string;
    idNumber: string;
    phone: string;
  };
  businessInfo: {
    name: string;
    registrationNumber: string;
    kraPin: string;
  };
  documents: Record<DocumentKey, string>;
}

interface VerificationResponse {
  verification: VerificationRecord;
  profile: {
    username: string;
    email: string;
    phone: string;
  };
}

interface FormState {
  fullName: string;
  idNumber: string;
  phone: string;
  businessName: string;
  registrationNumber: string;
  kraPin: string;
}

type FileState = Record<DocumentKey, File | null>;

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5100/api';

const emptyVerification: VerificationRecord = {
  status: 'not_submitted',
  rejectionReason: '',
  submittedAt: null,
  reviewedAt: null,
  personalInfo: {
    fullName: '',
    idNumber: '',
    phone: '',
  },
  businessInfo: {
    name: '',
    registrationNumber: '',
    kraPin: '',
  },
  documents: {
    idDocument: '',
    businessCertificate: '',
    taxComplianceCertificate: '',
    propertyProof: '',
  },
};

const emptyFiles: FileState = {
  idDocument: null,
  businessCertificate: null,
  taxComplianceCertificate: null,
  propertyProof: null,
};

const documentConfig: Array<{ key: DocumentKey; label: string; required: boolean; helper: string }> = [
  { key: 'idDocument', label: 'National ID', required: true, helper: 'Front/back scan or PDF.' },
  { key: 'businessCertificate', label: 'Business certificate', required: true, helper: 'Registration or business license document.' },
  { key: 'taxComplianceCertificate', label: 'KRA tax compliance certificate', required: false, helper: 'Optional, but useful for review.' },
  { key: 'propertyProof', label: 'Property ownership or lease proof', required: true, helper: 'Title, lease agreement, or management authority.' },
];

async function downloadProtectedDocument(path: string, fileName: string) {
  const token = getToken();
  const response = await fetch(`${API_BASE_URL}${path}`, {
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
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

function formatDate(value: string | null) {
  if (!value) return 'Not yet';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Not yet' : date.toLocaleString();
}

export function OwnerVerification() {
  const { profile, updateProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [verification, setVerification] = useState<VerificationRecord>(emptyVerification);
  const [form, setForm] = useState<FormState>({
    fullName: '',
    idNumber: '',
    phone: profile?.phone || '',
    businessName: '',
    registrationNumber: '',
    kraPin: '',
  });
  const [files, setFiles] = useState<FileState>(emptyFiles);

  const canEdit = verification.status === 'not_submitted' || verification.status === 'rejected';

  const loadVerification = async () => {
    setLoading(true);
    setError('');

    try {
      const data = await api.get<VerificationResponse>('/owners/verification');
      setVerification(data.verification || emptyVerification);
      setForm({
        fullName: data.verification.personalInfo.fullName || data.profile.username || '',
        idNumber: data.verification.personalInfo.idNumber || '',
        phone: data.verification.personalInfo.phone || data.profile.phone || profile?.phone || '',
        businessName: data.verification.businessInfo.name || '',
        registrationNumber: data.verification.businessInfo.registrationNumber || '',
        kraPin: data.verification.businessInfo.kraPin || '',
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load verification details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVerification();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleInputChange = (field: keyof FormState) => (event: ChangeEvent<HTMLInputElement>) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const handleFileChange = (key: DocumentKey) => (event: ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.[0] || null;
    setFiles((current) => ({ ...current, [key]: nextFile }));
  };

  const handleDownload = async (documentType: DocumentKey) => {
    setError('');
    try {
      await downloadProtectedDocument(`/owners/verification/documents/${documentType}`, `${documentType}-${profile?.username || 'owner'}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to download document.');
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const payload = new FormData();
      payload.append('fullName', form.fullName);
      payload.append('idNumber', form.idNumber);
      payload.append('phone', form.phone);
      payload.append('businessName', form.businessName);
      payload.append('registrationNumber', form.registrationNumber);
      payload.append('kraPin', form.kraPin);

      documentConfig.forEach(({ key }) => {
        if (files[key]) {
          payload.append(key, files[key] as File);
        }
      });

      const result = await api.postForm<{ message: string; verification: VerificationRecord }>('/owners/verification', payload);
      setVerification(result.verification);
      setFiles(emptyFiles);
      setSuccess(result.message);
      await updateProfile({});
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to submit verification.');
    } finally {
      setSaving(false);
    }
  };

  const statusTone = verification.status === 'approved'
    ? 'bg-green-50 border-green-200 text-green-800'
    : verification.status === 'submitted'
    ? 'bg-yellow-50 border-yellow-200 text-yellow-800'
    : verification.status === 'rejected'
    ? 'bg-red-50 border-red-200 text-red-800'
    : 'bg-blue-50 border-blue-200 text-blue-800';

  const StatusIcon = verification.status === 'approved'
    ? CheckCircle2
    : verification.status === 'submitted'
    ? Clock
    : verification.status === 'rejected'
    ? XCircle
    : AlertCircle;

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground">Owner Verification</h1>
            <p className="text-muted-foreground mt-1">Submit real identity and business documents for admin review.</p>
          </div>
          <button
            onClick={loadVerification}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-secondary disabled:opacity-60"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh status
          </button>
        </div>

        <div className={`rounded-2xl border p-5 ${statusTone}`}>
          <div className="flex items-start gap-3">
            <StatusIcon size={20} className="mt-0.5 shrink-0" />
            <div className="space-y-1">
              <p className="font-semibold capitalize">{verification.status.replace('_', ' ')}</p>
              <p className="text-sm">
                {verification.status === 'approved' && 'Your owner account has been approved.'}
                {verification.status === 'submitted' && 'Your documents are under review. You can refresh this page to check for updates.'}
                {verification.status === 'rejected' && 'Your submission was rejected. Update the details below and resubmit.'}
                {verification.status === 'not_submitted' && 'Submit the required documents to unlock the rest of the owner portal.'}
              </p>
              {verification.rejectionReason && (
                <p className="text-sm font-medium">Reason: {verification.rejectionReason}</p>
              )}
              <p className="text-xs opacity-80">Submitted: {formatDate(verification.submittedAt)} | Reviewed: {formatDate(verification.reviewedAt)}</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {success && (
          <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{success}</div>
        )}

        {loading ? (
          <div className="rounded-2xl border border-border bg-card p-10 text-center text-muted-foreground">Loading verification details...</div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
              <h2 className="text-lg font-semibold text-foreground">Personal details</h2>
              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">Full name</label>
                  <input
                    value={form.fullName}
                    onChange={handleInputChange('fullName')}
                    disabled={!canEdit || saving}
                    className="w-full rounded-xl border border-input bg-background px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">National ID number</label>
                  <input
                    value={form.idNumber}
                    onChange={handleInputChange('idNumber')}
                    disabled={!canEdit || saving}
                    className="w-full rounded-xl border border-input bg-background px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-foreground">Phone number</label>
                  <input
                    value={form.phone}
                    onChange={handleInputChange('phone')}
                    disabled={!canEdit || saving}
                    className="w-full rounded-xl border border-input bg-background px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
              <h2 className="text-lg font-semibold text-foreground">Business details</h2>
              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-foreground">Business name</label>
                  <input
                    value={form.businessName}
                    onChange={handleInputChange('businessName')}
                    disabled={!canEdit || saving}
                    className="w-full rounded-xl border border-input bg-background px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">Registration number</label>
                  <input
                    value={form.registrationNumber}
                    onChange={handleInputChange('registrationNumber')}
                    disabled={!canEdit || saving}
                    className="w-full rounded-xl border border-input bg-background px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">KRA PIN</label>
                  <input
                    value={form.kraPin}
                    onChange={handleInputChange('kraPin')}
                    disabled={!canEdit || saving}
                    className="w-full rounded-xl border border-input bg-background px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
              <h2 className="text-lg font-semibold text-foreground">Documents</h2>
              <div className="mt-4 space-y-4">
                {documentConfig.map((documentField) => (
                  <div key={documentField.key} className="rounded-2xl border border-border p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div className="space-y-1">
                        <p className="font-medium text-foreground">
                          {documentField.label}
                          {documentField.required ? ' *' : ''}
                        </p>
                        <p className="text-sm text-muted-foreground">{documentField.helper}</p>
                        {verification.documents[documentField.key] && (
                          <p className="text-xs text-green-700">Document on file.</p>
                        )}
                        {files[documentField.key] && (
                          <p className="text-xs text-primary">Selected: {files[documentField.key]?.name}</p>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {verification.documents[documentField.key] && (
                          <button
                            type="button"
                            onClick={() => handleDownload(documentField.key)}
                            className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary"
                          >
                            <Download size={15} />
                            Download current
                          </button>
                        )}
                        {canEdit && (
                          <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-primary px-3 py-2 text-sm font-medium text-white hover:bg-primary/90">
                            <Upload size={15} />
                            {verification.documents[documentField.key] ? 'Replace' : 'Upload'}
                            <input
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png"
                              onChange={handleFileChange(documentField.key)}
                              className="hidden"
                            />
                          </label>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-muted-foreground">
                Required for submission: full name, ID number, phone, business name, ID document, business certificate, and property proof.
              </div>
              {canEdit && (
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-60"
                >
                  <FileText size={16} />
                  {saving ? 'Submitting...' : verification.status === 'rejected' ? 'Resubmit verification' : 'Submit verification'}
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </DashboardLayout>
  );
}
