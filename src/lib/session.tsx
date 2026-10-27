'use client';
// Same shape as the sales CRM's lib/session.tsx. Login is a full-page redirect
// to the backend's Google OIDC start route (state + nonce + PKCE live there).
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { StaffUser } from './types';
import { apiGet, apiSend } from './api';

interface SessionCtx {
  user: StaffUser | null;
  loading: boolean;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const Ctx = createContext<SessionCtx | null>(null);

export const GOOGLE_START_URL = '/api/auth/google/start';

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<StaffUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      setUser(await apiGet<StaffUser>('/auth/me'));
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const logout = useCallback(async () => {
    await apiSend('POST', '/auth/logout', {});
    setUser(null);
  }, []);

  return <Ctx.Provider value={{ user, loading, logout, refresh }}>{children}</Ctx.Provider>;
}

export function useSession() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useSession must be used within SessionProvider');
  return ctx;
}
