import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';

import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { Register } from './pages/Register';

import { StudentDashboard } from './pages/student/StudentDashboard';
import { SearchHostels } from './pages/student/SearchHostels';
import { HostelDetails } from './pages/student/HostelDetails';
import { MyBookings } from './pages/student/MyBookings';
import { Payment } from './pages/student/Payment';
import { PaymentSuccess } from './pages/student/PaymentSuccess';
import { StudentSettings } from './pages/student/StudentSettings';

import { OwnerDashboard } from './pages/owner/OwnerDashboard';
import { OwnerVerification } from './pages/owner/OwnerVerification';
import { ManageHostels } from './pages/owner/ManageHostels';
import { AddHostel } from './pages/owner/AddHostel';
import { TenantList } from './pages/owner/TenantList';
import { OwnerAnalytics } from './pages/owner/OwnerAnalytics';
import { OwnerSettings } from './pages/owner/OwnerSettings';

import { AdminDashboard } from './pages/admin/AdminDashboard';
import { VerifyOwners } from './pages/admin/VerifyOwners';
import { ManageUsers } from './pages/admin/ManageUsers';
import { AdminHostels } from './pages/admin/AdminHostels';
import { AdminPayments } from './pages/admin/AdminPayments';
import { AdminAnalytics } from './pages/admin/AdminAnalytics';

import { ProtectedRoute } from './components/ProtectedRoute';

function RoleBasedRedirect() {
  const { profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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
      return <Navigate to="/owner/dashboard" replace />;
    case 'admin':
      return <Navigate to="/admin/dashboard" replace />;
    default:
      return <Navigate to="/login" replace />;
  }
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

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

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
