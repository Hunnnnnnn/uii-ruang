import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { authApi, getApiErrorMessage } from '../services/api';

interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  token: string | null;
  setCurrentUser: (user: User | null) => void;
  switchRole: (role: UserRole) => void;
  login: (
    email: string,
    password?: string,
    role?: UserRole
  ) => Promise<{ success: boolean; message?: string; user?: User }>;
  register: (data: {
    name: string;
    nim?: string;
    email: string;
    password?: string;
    role: UserRole;
  }) => Promise<{ success: boolean; message?: string; user?: User }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => {
    return sessionStorage.getItem('uiiruang_token');
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const savedToken = sessionStorage.getItem('uiiruang_token');
    const saved = sessionStorage.getItem('uiiruang_user');
    if (saved && savedToken) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return null;
  });

  // Listener untuk session expired dari axios interceptor (401)
  useEffect(() => {
    const handleAuthExpired = () => {
      setToken(null);
      setCurrentUser(null);
    };
    window.addEventListener('uiiruang_auth_expired', handleAuthExpired);
    return () => window.removeEventListener('uiiruang_auth_expired', handleAuthExpired);
  }, []);

  // Sinkronisasi status user dengan backend jika token tersimpan
  useEffect(() => {
    const savedToken = sessionStorage.getItem('uiiruang_token');
    if (savedToken) {
      authApi
        .getMe()
        .then((res) => {
          if (res?.data) {
            const mappedUser: User = {
              ...res.data,
              nim: res.data.number_id || res.data.nim || '',
            };
            setCurrentUser(mappedUser);
            sessionStorage.setItem('uiiruang_user', JSON.stringify(mappedUser));
          }
        })
        .catch((err) => {
          if (err?.response?.status === 401) {
            sessionStorage.removeItem('uiiruang_token');
            sessionStorage.removeItem('uiiruang_user');
            setToken(null);
            setCurrentUser(null);
          }
        });
    }
  }, []);

  const switchRole = (role: UserRole) => {
    if (role === 'admin') {
      const adminUser: User = {
        id: 1,
        name: 'Facility Admin',
        email: 'admin@uii.ac.id',
        role: 'admin',
        credit_score: 100,
        status: 'aktif',
      };
      setCurrentUser(adminUser);
      sessionStorage.setItem('uiiruang_user', JSON.stringify(adminUser));
    } else {
      const mhsUser: User = {
        id: 2,
        name: 'Khoiru Rizal Kalam Ismail',
        nim: '24523204',
        number_id: '24523204',
        email: '24523204@students.uii.ac.id',
        role: 'mahasiswa',
        credit_score: 100,
        status: 'aktif',
      };
      setCurrentUser(mhsUser);
      sessionStorage.setItem('uiiruang_user', JSON.stringify(mhsUser));
    }
  };

  const login = async (
    email: string,
    password: string = 'password123',
    _role: UserRole = 'mahasiswa'
  ): Promise<{ success: boolean; message?: string; user?: User }> => {
    try {
      const cleanEmail = email.trim();
      const res = await authApi.login(cleanEmail, password);
      const mappedUser: User = {
        ...res.user,
        nim: res.user.number_id || res.user.nim || cleanEmail.split('@')[0],
      };
      setToken(res.token);
      sessionStorage.setItem('uiiruang_token', res.token);
      setCurrentUser(mappedUser);
      sessionStorage.setItem('uiiruang_user', JSON.stringify(mappedUser));
      return { success: true, user: mappedUser };
    } catch (error: any) {
      console.warn('Backend login error:', error);
      const errMsg = getApiErrorMessage(error);
      return { success: false, message: errMsg };
    }
  };

  const register = async (data: {
    name: string;
    nim?: string;
    email: string;
    password?: string;
    role: UserRole;
  }): Promise<{ success: boolean; message?: string; user?: User }> => {
    try {
      const res = await authApi.register({
        name: data.name,
        email: data.email,
        password: data.password || 'password123',
        number_id: data.nim || data.email.split('@')[0],
      });
      const mappedUser: User = {
        ...res.user,
        nim: res.user.number_id || res.user.nim || '',
      };
      setToken(res.token);
      sessionStorage.setItem('uiiruang_token', res.token);
      setCurrentUser(mappedUser);
      sessionStorage.setItem('uiiruang_user', JSON.stringify(mappedUser));
      return { success: true, user: mappedUser };
    } catch (error: any) {
      console.warn('Backend register error:', error);
      const errMsg = getApiErrorMessage(error);

      // Graceful fallback for offline demo testing
      if (
        error.code === 'ERR_NETWORK' ||
        error.message?.includes('Network Error') ||
        error.message?.includes('timeout')
      ) {
        const newUser: User = {
          id: Date.now(),
          name: data.name,
          nim: data.nim || data.email.split('@')[0],
          email: data.email,
          role: data.role,
          credit_score: 100,
          status: 'aktif',
        };
        setCurrentUser(newUser);
        sessionStorage.setItem('uiiruang_user', JSON.stringify(newUser));
        return { success: true, user: newUser };
      }

      return { success: false, message: errMsg };
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (e) {
      console.warn('Backend logout handled:', e);
    } finally {
      sessionStorage.removeItem('uiiruang_token');
      sessionStorage.removeItem('uiiruang_user');
      setToken(null);
      setCurrentUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: !!currentUser,
        token,
        setCurrentUser,
        switchRole,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
