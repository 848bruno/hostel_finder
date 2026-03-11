import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { PublicLayout } from '../components/layouts/PublicLayout';
import { api, ApiError } from '../lib/api';
import { MailCheck, RefreshCw } from 'lucide-react';

export function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const tokenFromUrl = searchParams.get('token') ?? '';

  const [token, setToken] = useState(tokenFromUrl);
  const [resendEmail, setResendEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'verifying' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [resendStatus, setResendStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [resendMsg, setResendMsg] = useState('');

  // Auto-verify if token comes from URL
  useEffect(() => {
    if (tokenFromUrl) {
      handleVerify(tokenFromUrl);
    }
  }, [tokenFromUrl]);

  const handleVerify = async (t: string) => {
    if (!t.trim()) return;
    setStatus('verifying');
    setMessage('');
    try {
      const data = await api.post<{ message: string }>('/auth/verify-email', { token: t.trim() });
      setStatus('success');
      setMessage(data.message);
    } catch (err) {
      setStatus('error');
      setMessage(err instanceof ApiError ? err.message : 'Verification failed. Please try again.');
    }
  };

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    setResendStatus('sending');
    setResendMsg('');
    try {
      const data = await api.post<{ message: string }>('/auth/resend-verification', {
        email: resendEmail,
      });
      setResendStatus('sent');
      setResendMsg(data.message);
    } catch (err) {
      setResendStatus('error');
      setResendMsg(err instanceof ApiError ? err.message : 'Failed to resend. Please try again.');
    }
  };

  return (
    <PublicLayout>
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto h-16 w-16 bg-primary/20 rounded-full flex items-center justify-center">
              <MailCheck className="h-8 w-8 text-primary" />
            </div>
            <h2 className="mt-6 text-3xl font-bold text-gray-900">Verify Your Email</h2>
            <p className="mt-2 text-gray-600">
              Enter the verification token from the email we sent you.
            </p>
          </div>

          {/* Verification result */}
          {status === 'success' && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-4 rounded-lg text-center">
              <p className="font-medium">{message}</p>
              <Link
                to="/login"
                className="mt-3 inline-block px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors"
              >
                Go to Login
              </Link>
            </div>
          )}

          {status === 'error' && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {message}
            </div>
          )}

          {/* Manual token entry */}
          {status !== 'success' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Verification Token
                </label>
                <input
                  type="text"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
                  placeholder="Paste your verification token here"
                />
              </div>
              <button
                onClick={() => handleVerify(token)}
                disabled={status === 'verifying' || !token.trim()}
                className="w-full py-3 bg-primary text-white rounded-lg hover:bg-primary/90 font-medium disabled:opacity-50 transition-colors"
              >
                {status === 'verifying' ? 'Verifying...' : 'Verify Email'}
              </button>
            </div>
          )}

          {/* Resend section */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <RefreshCw size={16} />
              Resend Verification Email
            </h3>

            {resendStatus === 'sent' ? (
              <p className="text-green-600 text-sm">{resendMsg}</p>
            ) : (
              <form onSubmit={handleResend} className="space-y-3">
                {resendStatus === 'error' && (
                  <p className="text-red-600 text-sm">{resendMsg}</p>
                )}
                <input
                  type="email"
                  required
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Enter your registered email"
                />
                <button
                  type="submit"
                  disabled={resendStatus === 'sending'}
                  className="w-full py-3 border border-primary text-primary rounded-lg hover:bg-primary/10 font-medium disabled:opacity-50 transition-colors"
                >
                  {resendStatus === 'sending' ? 'Sending...' : 'Resend Email'}
                </button>
              </form>
            )}
          </div>

          <div className="text-center">
            <Link to="/login" className="text-sm text-primary hover:text-primary/90 font-medium">
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
