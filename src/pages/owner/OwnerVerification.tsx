import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../components/layouts/DashboardLayout';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { OwnerVerification as OwnerVerificationType } from '../../types/database';
import { FileCheck, Upload, CheckCircle, XCircle, Clock } from 'lucide-react';

export function OwnerVerification() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [verification, setVerification] = useState<OwnerVerificationType | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    businessName: '',
    businessRegistrationNumber: '',
  });

  useEffect(() => {
    checkExistingVerification();
  }, []);

  const checkExistingVerification = async () => {
    try {
      const { data } = await supabase
        .from('owner_verifications')
        .select('*')
        .eq('owner_id', profile?.id)
        .order('submitted_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data) {
        setVerification(data);
        setFormData({
          businessName: data.business_name,
          businessRegistrationNumber: data.business_registration_number || '',
        });
      }
    } catch (error) {
      console.error('Error checking verification:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const { error } = await supabase
        .from('owner_verifications')
        .insert({
          owner_id: profile!.id,
          business_name: formData.businessName,
          business_registration_number: formData.businessRegistrationNumber,
          id_document_url: 'sample_id_document.pdf',
          business_license_url: 'sample_license.pdf',
          status: 'pending',
          submitted_at: new Date().toISOString(),
          reviewed_at: null,
          reviewed_by: null,
          rejection_reason: null,
        });

      if (error) throw error;

      alert('Verification documents submitted successfully!');
      navigate('/owner/dashboard');
    } catch (error) {
      console.error('Error submitting verification:', error);
      alert('Failed to submit verification. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Owner Verification</h1>
          <p className="text-gray-600 mt-1">Submit your documents for verification</p>
        </div>

        {verification?.status === 'pending' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 flex items-start gap-4">
            <Clock className="text-yellow-600 flex-shrink-0" size={24} />
            <div>
              <h3 className="font-semibold text-yellow-900 text-lg">Verification Pending</h3>
              <p className="text-yellow-800 mt-1">
                Your documents are currently being reviewed by our team. This typically takes 1-3 business days.
              </p>
              <div className="mt-4 space-y-2">
                <p className="text-sm text-yellow-800"><strong>Business Name:</strong> {verification.business_name}</p>
                <p className="text-sm text-yellow-800"><strong>Submitted:</strong> {new Date(verification.submitted_at).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        )}

        {verification?.status === 'approved' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 flex items-start gap-4">
            <CheckCircle className="text-green-600 flex-shrink-0" size={24} />
            <div>
              <h3 className="font-semibold text-green-900 text-lg">Verification Approved</h3>
              <p className="text-green-800 mt-1">
                Congratulations! Your account has been verified. You can now add and manage hostels.
              </p>
            </div>
          </div>
        )}

        {verification?.status === 'rejected' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 flex items-start gap-4">
            <XCircle className="text-red-600 flex-shrink-0" size={24} />
            <div>
              <h3 className="font-semibold text-red-900 text-lg">Verification Rejected</h3>
              <p className="text-red-800 mt-1">
                Your verification was rejected. Please review the reason and resubmit your documents.
              </p>
              {verification.rejection_reason && (
                <div className="mt-3 p-3 bg-red-100 rounded">
                  <p className="text-sm text-red-900"><strong>Reason:</strong> {verification.rejection_reason}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {(!verification || verification.status === 'rejected') && (
          <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Business Information</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Business Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.businessName}
                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your business name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Business Registration Number
                  </label>
                  <input
                    type="text"
                    value={formData.businessRegistrationNumber}
                    onChange={(e) => setFormData({ ...formData, businessRegistrationNumber: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter registration number (optional)"
                  />
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Required Documents</h2>

              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                  <Upload className="mx-auto text-gray-400 mb-2" size={32} />
                  <p className="text-sm font-medium text-gray-700 mb-1">ID Document</p>
                  <p className="text-xs text-gray-500 mb-3">Upload a copy of your national ID or passport</p>
                  <button
                    type="button"
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium"
                  >
                    Choose File
                  </button>
                </div>

                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                  <Upload className="mx-auto text-gray-400 mb-2" size={32} />
                  <p className="text-sm font-medium text-gray-700 mb-1">Business License (Optional)</p>
                  <p className="text-xs text-gray-500 mb-3">Upload your business license if available</p>
                  <button
                    type="button"
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium"
                  >
                    Choose File
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> All documents will be kept confidential and used only for verification purposes.
                The verification process typically takes 1-3 business days.
              </p>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <FileCheck size={20} />
              {submitting ? 'Submitting...' : 'Submit for Verification'}
            </button>
          </form>
        )}
      </div>
    </DashboardLayout>
  );
}
