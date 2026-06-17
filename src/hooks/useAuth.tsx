import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '../lib/api';
import type { User, Partner } from '../types';

interface AuthContextType {
  user: User | null;
  partner: Partner | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, name: string, password: string, coupleCode?: string) => Promise<string>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [partner, setPartner] = useState<Partner | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('couplesync_token');
    if (token) {
      refreshUser();
    } else {
      setLoading(false);
    }
  }, []);

  async function refreshUser() {
    try {
      const data = await api.getMe();
      setUser(data.user);
      setPartner(data.partner);
    } catch {
      localStorage.removeItem('couplesync_token');
      setUser(null);
      setPartner(null);
    } finally {
      setLoading(false);
    }
  }

  async function login(email: string, password: string) {
    const data = await api.login({ email, password });
    localStorage.setItem('couplesync_token', data.token);
    setUser(data.user);
    await refreshUser();
  }

  async function register(email: string, name: string, password: string, coupleCode?: string): Promise<string> {
    const data = await api.register({ email, name, password, coupleCode });
    localStorage.setItem('couplesync_token', data.token);
    setUser(data.user);
    await refreshUser();
    return data.coupleCode;
  }

  function logout() {
    localStorage.removeItem('couplesync_token');
    setUser(null);
    setPartner(null);
  }

  return (
    <AuthContext.Provider value={{ user, partner, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}