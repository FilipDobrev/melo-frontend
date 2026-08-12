// Owns the current user and the auth lifecycle (login/register/logout, and
// restoring a session from the persisted refresh token on app start).
// Screens read `user`/`isLoading` to decide what to render; they never touch
// tokens directly.
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { apiRequest } from '../api/client';
import { authResultSchema } from '../api/schemas';
import * as authApi from '../api/auth.api';
import { getMe, updateMe as updateMeApi } from '../api/users.api';
import type { Me } from '../api/schemas';
import { getRefreshToken, setTokens } from '../lib/tokenStore';
import { setOnSessionExpired } from '../api/client';

type AuthContextValue = {
  user: Me | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (input: { username?: string; profileImage?: string }) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Me | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setOnSessionExpired(() => setUser(null));
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      const refreshToken = await getRefreshToken();
      if (!refreshToken) {
        setIsLoading(false);
        return;
      }

      try {
        const result = await apiRequest('/auth/refresh', authResultSchema, {
          method: 'POST',
          body: { refreshToken },
          skipAuth: true,
        });
        await setTokens(result.accessToken, result.refreshToken);
        const me = await getMe();
        if (!cancelled) {
          setUser(me);
        }
      } catch {
        // Refresh token expired or revoked; stay logged out.
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    restoreSession();
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      async login(email, password) {
        const result = await authApi.login({ email, password });
        setUser(result.user);
      },
      async register(username, email, password) {
        const result = await authApi.register({ username, email, password });
        setUser(result.user);
      },
      async logout() {
        await authApi.logout();
        setUser(null);
      },
      async updateProfile(input) {
        const updated = await updateMeApi(input);
        setUser(updated);
      },
    }),
    [user, isLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
