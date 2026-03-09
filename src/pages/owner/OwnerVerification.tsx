import { DashboardLayout } from '../../components/layouts/DashboardLayout';
import { useAuth } from '../../contexts/AuthContext';
import { CheckCircle, Clock } from 'lucide-react';

export function OwnerVerification() {
  const { profile } = useAuth();

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Account Verification</h1>
          <p className="text-gray-600 mt-1">Your account verification status</p>
        </div>

        {profile?.isApproved ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 flex items-start gap-4">
            <CheckCircle className="text-green-600 flex-shrink-0" size={24} />
            <div>
              <h3 className="font-semibold text-green-900 text-lg">Account Approved</h3>
              <p className="text-green-800 mt-1">
                Your account has been approved by an admin. You can add and manage your hostels.
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 flex items-start gap-4">
            <Clock className="text-yellow-600 flex-shrink-0" size={24} />
            <div>
              <h3 className="font-semibold text-yellow-900 text-lg">Pending Admin Review</h3>
              <p className="text-yellow-800 mt-1">
                Your business license has been submitted and is under review. You will receive an email once approved.
              </p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">How verification works</h2>
          <ol className="space-y-3 text-gray-700">
            <li className="flex gap-3"><span className="font-bold text-blue-600">1.</span><span>You registered and uploaded your business license.</span></li>
            <li className="flex gap-3"><span className="font-bold text-blue-600">2.</span><span>Our admin team reviews your documents and account details.</span></li>
            <li className="flex gap-3"><span className="font-bold text-blue-600">3.</span><span>Once approved, you can list and manage hostels on the platform.</span></li>
          </ol>
        </div>
      </div>
    </DashboardLayout>
  );
}
