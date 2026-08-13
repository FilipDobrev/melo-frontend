// Owns the current user and the auth lifecycle (login/register/logout, and
// restoring a session from the persisted refresh token on app start).
// Screens read `user`/`isLoading` to decide what to render; they never touch
// tokens directly.
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { refreshAccessToken, setOnSessionExpired } from '../api/client';
import * as authApi from '../api/auth.api';
import { getMe, updateMe as updateMeApi } from '../api/users.api';
import type { Me } from '../api/schemas';
import { getAccessToken, getRefreshToken, clearTokens } from '../lib/tokenStore';

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
      // A remount (not a hard reload) may still hold a valid access token in
      // memory - trust it instead of rotating the refresh token again.
      if (!getAccessToken()) {
        const refreshToken = await getRefreshToken();
        if (!refreshToken) {
          setIsLoading(false);
          return;
        }

        try {
          // Shared single-flight refresh: if another caller (e.g. a second
          // effect invocation under StrictMode, or a 401 elsewhere) is
          // already refreshing, we await that same promise instead of
          // rotating the single-use refresh token a second time.
          await refreshAccessToken();
        } catch {
          // Refresh token expired or revoked; stay logged out.
          await clearTokens();
          if (!cancelled) {
            setIsLoading(false);
          }
          return;
        }
      }

      try {
        const me = await getMe();
        if (!cancelled) {
          setUser(me);
        }
      } catch {
        // Access token turned out to be invalid; apiRequest's own 401 handling
        // already attempted a refresh and clears the session on genuine rejection.
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
