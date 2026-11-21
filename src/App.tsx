import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { BookingProvider } from './context/BookingContext';
import { AppLayout } from './components/layout/AppLayout';
import { AdminLayout } from './components/layout/AdminLayout';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { BookingCalendarPage } from './pages/BookingCalendarPage';
import { PengaduanFasilitasPage } from './pages/PengaduanFasilitasPage';
import { ProfilePage } from './pages/ProfilePage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { ApprovalPage } from './pages/ApprovalPage';
import { DamageReportPage } from './pages/DamageReportPage';
import { AdminProfilePage } from './pages/AdminProfilePage';

/**
 * Pengalihan Route Root (/):
 * - Jika belum login: Wajib masuk ke /login
 * - Jika sudah login sebagai Mahasiswa: Masuk ke /dashboard
 * - Jika sudah login sebagai Admin: Masuk ke /admin/dashboard
 */
const RootRoute: React.FC = () => {
  const { currentUser } = useAuth();
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  if (currentUser.role === 'admin') {
    return <Navigate to="/admin/dashboard" replace />;
  }
  return <Navigate to="/dashboard" replace />;
};

/**
 * Route Login (/login):
 * Jika sudah memiliki sesi login aktif, langsung arahkan ke portal yang sesuai
 */
const LoginRoute: React.FC = () => {
  const { currentUser } = useAuth();
  if (currentUser) {
    return currentUser.role === 'admin' ? (
      <Navigate to="/admin/dashboard" replace />
    ) : (
      <Navigate to="/dashboard" replace />
    );
  }
  return <LoginPage />;
};

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Route Root (/) selalu diarahkan lewat RootRoute */}
      <Route path="/" element={<RootRoute />} />

      {/* Halaman Login & Registrasi (Figma Frame 41:3) */}
      <Route path="/login" element={<LoginRoute />} />

      {/* ========================================================= */}
      {/* 1. PORTAL MAHASISWA (Dilindungi ProtectedRoute Mahasiswa)  */}
      {/* ========================================================= */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute requiredRole="mahasiswa">
            <AppLayout>
              <DashboardPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/peminjaman"
        element={
          <ProtectedRoute requiredRole="mahasiswa">
            <AppLayout>
              <BookingCalendarPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/pengaduan"
        element={
          <ProtectedRoute requiredRole="mahasiswa">
            <AppLayout>
              <PengaduanFasilitasPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/profil"
        element={
          <ProtectedRoute requiredRole="mahasiswa">
            <AppLayout>
              <ProfilePage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route path="/profile" element={<Navigate to="/profil" replace />} />

      {/* ========================================================= */}
      {/* 2. PORTAL ADMIN (Dilindungi ProtectedRoute Admin)          */}
      {/* ========================================================= */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute requiredRole="admin">
            <Navigate to="/admin/dashboard" replace />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminLayout>
              <AdminDashboardPage />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/approval"
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminLayout>
              <ApprovalPage />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/laporan"
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminLayout>
              <DamageReportPage />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/profil"
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminLayout>
              <AdminProfilePage />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route path="/admin/profile" element={<Navigate to="/admin/profil" replace />} />

      {/* Catch-all Wildcard Route (*) */}
      <Route path="*" element={<RootRoute />} />
    </Routes>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BookingProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </BookingProvider>
    </AuthProvider>
  );
};

export default App;
