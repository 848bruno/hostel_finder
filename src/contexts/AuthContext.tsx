import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { AuthUser } from '../types/database';
import { api, setToken, getToken, removeToken } from '../lib/api';

interface LoginResponse {
  token: string;
  user: AuthUser;
}

interface AuthContextType {
  user: AuthUser | null;
  // 'profile' is an alias for 'user' kept for backward compatibility
  profile: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<AuthUser>;
  signUpStudent: (username: string, email: string, password: string) => Promise<{ message: string }>;
  signUpOwner: (username: string, email: string, password: string, licenseFile: File) => Promise<{ message: string }>;
  signOut: () => void;
  googleLogin: (credential: string, userType?: 'student' | 'owner') => Promise<AuthUser>;
  updateProfile: (updates: Partial<AuthUser>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // On mount, restore session from token
  useEffect(() => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get<AuthUser>('/auth/profile')
      .then((data) => setUser(data))
      .catch(() => removeToken())
      .finally(() => setLoading(false));
  }, []);

  const signIn = async (email: string, password: string): Promise<AuthUser> => {
    const data = await api.post<LoginResponse>('/auth/login', { email, password });
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const signUpStudent = async (
    username: string,
    email: string,
    password: string
  ): Promise<{ message: string }> => {
    return api.post<{ message: string }>('/auth/register/student', {
      username,
      email,
      password,
    });
  };

  const signUpOwner = async (
    username: string,
    email: string,
    password: string,
    licenseFile: File
  ): Promise<{ message: string }> => {
    const formData = new FormData();
    formData.append('username', username);
    formData.append('email', email);
    formData.append('password', password);
    formData.append('license', licenseFile);
    return api.postForm<{ message: string }>('/auth/register/owner', formData);
  };

  const signOut = () => {
    removeToken();
    setUser(null);
  };

  const googleLogin = async (
    credential: string,
    userType?: 'student' | 'owner'
  ): Promise<AuthUser> => {
    const data = await api.post<LoginResponse>('/auth/google', {
      credential,
      userType: userType || 'student',
    });
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  // Stub - settings pages can be migrated separately
  const updateProfile = async (_updates: Partial<AuthUser>): Promise<void> => {
    const refreshed = await api.get<AuthUser>('/auth/profile');
    setUser(refreshed);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile: user, // alias for backward compat
        loading,
        signIn,
        signUpStudent,
        signUpOwner,
        signOut,
        googleLogin,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
