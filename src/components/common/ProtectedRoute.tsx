import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'mahasiswa' | 'admin';
}

/**
 * Komponen ProtectedRoute:
 * Memastikan pengguna wajib login terlebih dahulu sebelum bisa membuka dashboard.
 * Jika belum login, otomatis dialihkan ke /login.
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
}) => {
  const { currentUser } = useAuth();

  // Jika belum login sama sekali, wajib dialihkan ke halaman Login
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // Jika hak akses (role) tidak sesuai
  if (requiredRole && currentUser.role !== requiredRole) {
    if (currentUser.role === 'admin') {
      return <Navigate to="/admin/dashboard" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};
