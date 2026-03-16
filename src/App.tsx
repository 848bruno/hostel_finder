import { Component, ErrorInfo, ReactNode, useEffect } from 'react';
import { BrowserRouter, HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider } from 'next-themes';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { applyPortalTheme } from './lib/theme';

import Landing from './pages/Landing';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { VerifyEmail } from './pages/VerifyEmail';
import { ForgotPassword } from './pages/ForgotPassword';
import { ResetPassword } from './pages/ResetPassword';

import { StudentDashboard } from './pages/student/StudentDashboard';
import { SearchHostels } from './pages/student/SearchHostels';
import { HostelDetails } from './pages/student/HostelDetails';
import { MyBookings } from './pages/student/MyBookings';
import { Favorites } from './pages/student/Favorites';
import { CompareHostels } from './pages/student/CompareHostels';
import { Payment } from './pages/student/Payment';
import { PaymentSuccess } from './pages/student/PaymentSuccess';
import { StudentSettings } from './pages/student/StudentSettings';
import { StudentPaymentReport } from './pages/student/PaymentReport';

import { OwnerDashboard } from './pages/owner/OwnerDashboard';
import { OwnerVerification } from './pages/owner/OwnerVerification';
import { ManageHostels } from './pages/owner/ManageHostels';
import { AddHostel } from './pages/owner/AddHostel';
import { EditHostel } from './pages/owner/EditHostel';
import { TenantList } from './pages/owner/TenantList';
import { OwnerAnalytics } from './pages/owner/OwnerAnalytics';
import { OwnerSettings } from './pages/owner/OwnerSettings';
import { OwnerPaymentReport } from './pages/owner/PaymentReport';
import { Maintenance } from './pages/owner/Maintenance';
import { LeaseManagement } from './pages/owner/LeaseManagement';
import { ExpenseTracking } from './pages/owner/ExpenseTracking';
import { CaretakerAccounts } from './pages/owner/CaretakerAccounts';
import { VacancyMarketing } from './pages/owner/VacancyMarketing';
import { CommunicationHub } from './pages/owner/CommunicationHub';
import { MoveInOutChecklist } from './pages/owner/MoveInOutChecklist';
import { RevenueReports } from './pages/owner/RevenueReports';

import { AdminDashboard } from './pages/admin/AdminDashboard';
import { VerifyOwners } from './pages/admin/VerifyOwners';
import { ManageUsers } from './pages/admin/ManageUsers';
import { AdminHostels } from './pages/admin/AdminHostels';
import { AdminPayments } from './pages/admin/AdminPayments';
import { AdminAnalytics } from './pages/admin/AdminAnalytics';
import { AdminSettings } from './pages/admin/AdminSettings';
import { Announcements } from './pages/admin/Announcements';
import { AuditLogs } from './pages/admin/AuditLogs';
import { BulkDataManagement } from './pages/admin/BulkDataManagement';
import { CommissionManagement } from './pages/admin/CommissionManagement';
import { ComplaintsDisputes } from './pages/admin/ComplaintsDisputes';
import { ContentModeration } from './pages/admin/ContentModeration';
import { QualityScoring } from './pages/admin/QualityScoring';
import { SupportTickets } from './pages/admin/SupportTickets';
import { SystemHealth } from './pages/admin/SystemHealth';

import { ProtectedRoute } from './components/ProtectedRoute';
import Chatbot from './components/Chatbot';

class AppErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('App render error:', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background px-4">
          <div className="w-full max-w-2xl rounded-2xl border border-destructive/30 bg-card p-6 shadow-card">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-destructive">
              Runtime Error
            </p>
            <h1 className="mt-3 font-heading text-2xl font-bold text-foreground">
              The app crashed while rendering
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Check the message below and the browser console. This replaces the blank screen so the failure is visible.
            </p>
            <pre className="mt-5 overflow-auto rounded-xl bg-secondary p-4 text-sm text-foreground">
              {this.state.error.stack || this.state.error.message}
            </pre>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function RoleBasedRedirect() {
  const { profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!profile) {
    return <Navigate to="/login" replace />;
  }

  switch (profile.role) {
    case 'student':
      return <Navigate to="/student/dashboard" replace />;
    case 'owner':
      return <Navigate to={profile.isApproved ? "/owner/dashboard" : "/owner/verification"} replace />;
    case 'admin':
      return <Navigate to="/admin/dashboard" replace />;
    default:
      return <Navigate to="/login" replace />;
  }
}

function GlobalChatbot() {
  const location = useLocation();
  const isPlatformRoute = 
    location.pathname.startsWith('/student') || 
    location.pathname.startsWith('/owner') || 
    location.pathname.startsWith('/admin');

  if (!isPlatformRoute) return null;
  return <Chatbot />;
}

function App() {
  useEffect(() => {
    applyPortalTheme();
  }, []);

  const Router =
    typeof window !== 'undefined' && window.location.protocol === 'file:'
      ? HashRouter
      : BrowserRouter;

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <AppErrorBoundary>
        <Router>
          <AuthProvider>
            <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            <Route path="/dashboard" element={<RoleBasedRedirect />} />

            <Route
              path="/student/dashboard"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <StudentDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/search"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <SearchHostels />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/hostel/:id"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <HostelDetails />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/bookings"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <MyBookings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/favorites"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <Favorites />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/compare"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <CompareHostels />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/payment/:bookingId"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <Payment />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/payment-success/:bookingId"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <PaymentSuccess />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/settings"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <StudentSettings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/payments"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <StudentPaymentReport />
                </ProtectedRoute>
              }
            />

            <Route
              path="/owner/dashboard"
              element={
                <ProtectedRoute allowedRoles={['owner']}>
                  <OwnerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/owner/verification"
              element={
                <ProtectedRoute allowedRoles={['owner']}>
                  <OwnerVerification />
                </ProtectedRoute>
              }
            />
            <Route
              path="/owner/hostels"
              element={
                <ProtectedRoute allowedRoles={['owner']}>
                  <ManageHostels />
                </ProtectedRoute>
              }
            />
            <Route
              path="/owner/hostels/new"
              element={
                <ProtectedRoute allowedRoles={['owner']}>
                  <AddHostel />
                </ProtectedRoute>
              }
            />
            <Route
              path="/owner/hostels/edit/:id"
              element={
                <ProtectedRoute allowedRoles={['owner']}>
                  <EditHostel />
                </ProtectedRoute>
              }
            />
            <Route
              path="/owner/hostels/preview/:id"
              element={
                <ProtectedRoute allowedRoles={['owner']}>
                  <HostelDetails previewMode />
                </ProtectedRoute>
              }
            />
            <Route
              path="/owner/tenants"
              element={
                <ProtectedRoute allowedRoles={['owner']}>
                  <TenantList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/owner/analytics"
              element={
                <ProtectedRoute allowedRoles={['owner']}>
                  <OwnerAnalytics />
                </ProtectedRoute>
              }
            />
            <Route
              path="/owner/settings"
              element={
                <ProtectedRoute allowedRoles={['owner']}>
                  <OwnerSettings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/owner/payments"
              element={
                <ProtectedRoute allowedRoles={['owner']}>
                  <OwnerPaymentReport />
                </ProtectedRoute>
              }
            />
            <Route path="/owner/maintenance" element={<ProtectedRoute allowedRoles={['owner']}><Maintenance /></ProtectedRoute>} />
            <Route path="/owner/leases" element={<ProtectedRoute allowedRoles={['owner']}><LeaseManagement /></ProtectedRoute>} />
            <Route path="/owner/expenses" element={<ProtectedRoute allowedRoles={['owner']}><ExpenseTracking /></ProtectedRoute>} />
            <Route path="/owner/caretakers" element={<ProtectedRoute allowedRoles={['owner']}><CaretakerAccounts /></ProtectedRoute>} />
            <Route path="/owner/vacancy-marketing" element={<ProtectedRoute allowedRoles={['owner']}><VacancyMarketing /></ProtectedRoute>} />
            <Route path="/owner/communication" element={<ProtectedRoute allowedRoles={['owner']}><CommunicationHub /></ProtectedRoute>} />
            <Route path="/owner/checklists" element={<ProtectedRoute allowedRoles={['owner']}><MoveInOutChecklist /></ProtectedRoute>} />
            <Route path="/owner/reports" element={<ProtectedRoute allowedRoles={['owner']}><RevenueReports /></ProtectedRoute>} />

            <Route
              path="/admin/dashboard"
              element={<AdminDashboard />}
            />
            <Route
              path="/admin/verifications"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <VerifyOwners />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <ManageUsers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/hostels"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminHostels />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/payments"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminPayments />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/analytics"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminAnalytics />
                </ProtectedRoute>
              }
            />
            <Route path="/admin/settings" element={<ProtectedRoute allowedRoles={['admin']}><AdminSettings /></ProtectedRoute>} />
            <Route path="/admin/announcements" element={<ProtectedRoute allowedRoles={['admin']}><Announcements /></ProtectedRoute>} />
            <Route path="/admin/audit-logs" element={<ProtectedRoute allowedRoles={['admin']}><AuditLogs /></ProtectedRoute>} />
            <Route path="/admin/bulk-data" element={<ProtectedRoute allowedRoles={['admin']}><BulkDataManagement /></ProtectedRoute>} />
            <Route path="/admin/commissions" element={<ProtectedRoute allowedRoles={['admin']}><CommissionManagement /></ProtectedRoute>} />
            <Route path="/admin/complaints" element={<ProtectedRoute allowedRoles={['admin']}><ComplaintsDisputes /></ProtectedRoute>} />
            <Route path="/admin/moderation" element={<ProtectedRoute allowedRoles={['admin']}><ContentModeration /></ProtectedRoute>} />
            <Route path="/admin/quality" element={<ProtectedRoute allowedRoles={['admin']}><QualityScoring /></ProtectedRoute>} />
            <Route path="/admin/support" element={<ProtectedRoute allowedRoles={['admin']}><SupportTickets /></ProtectedRoute>} />
            <Route path="/admin/system-health" element={<ProtectedRoute allowedRoles={['admin']}><SystemHealth /></ProtectedRoute>} />

            <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            <GlobalChatbot />
          </AuthProvider>
        </Router>
      </AppErrorBoundary>
    </ThemeProvider>
  );
}

export default App;
