import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useUser, useAuth as useClerkAuth } from '@clerk/clerk-react';
import { api } from '../lib/api';
import type { User, Partner, Subscription } from '../types';

interface AuthContextType {
  user: User | null;
  partner: Partner | null;
  loading: boolean;
  tier: string;
  refreshUser: () => Promise<void>;
  coupleCode: string | null;
  createCouple: () => Promise<string>;
  joinCouple: (code: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { user: clerkUser, isLoaded, isSignedIn } = useUser();
  const { getToken } = useClerkAuth();
  const [user, setUser] = useState<User | null>(null);
  const [partner, setPartner] = useState<Partner | null>(null);
  const [tier, setTier] = useState('free');
  const [coupleCode, setCoupleCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isLoaded && isSignedIn && clerkUser) {
      // Pass Clerk token to API wrapper
      api.setTokenGetter(getToken);
      refreshUser();
    } else if (isLoaded && !isSignedIn) {
      setUser(null);
      setPartner(null);
      setLoading(false);
    }
  }, [isLoaded, isSignedIn, clerkUser]);

  async function refreshUser() {
    try {
      const data = await api.getMe();
      setUser(data.user);
      setPartner(data.partner);
      if (data.user?.coupleCode) {
        setCoupleCode(data.user.coupleCode);
      }
      const subData = await api.getSubscription();
      setTier(subData.subscription.tier);
    } catch (err) {
      console.error('Failed to load user data', err);
    } finally {
      setLoading(false);
    }
  }

  async function createCouple(): Promise<string> {
    const data = await api.createCouple();
    setCoupleCode(data.code);
    await refreshUser();
    return data.code;
  }

  async function joinCouple(code: string) {
    await api.joinCouple(code);
    await refreshUser();
  }

  return (
    <AuthContext.Provider value={{ user, partner, loading, tier, refreshUser, coupleCode, createCouple, joinCouple }}>
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