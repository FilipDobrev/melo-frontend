import { useQueryClient } from '@tanstack/react-query';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { ApiError, onSessionLost } from '../api/client';
import { readRefreshToken, setAccessToken, writeRefreshToken } from '../api/tokens';
import { fetchMe, login, logout, register } from '../api/users';
import type { Me } from '../api/schemas';

type Session = { status: 'loading' } | { status: 'signedOut' } | { status: 'signedIn'; user: Me };

interface AuthValue {
  session: Session;
  signIn(email: string, password: string): Promise<void>;
  signUp(username: string, email: string, password: string): Promise<void>;
  signOut(): Promise<void>;
  /** Re-reads /users/me. Call after editing the profile so the avatar and
   *  username shown around the app follow the change. */
  refreshUser(): Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

async function clearTokens(): Promise<void> {
  setAccessToken(null);
  await writeRefreshToken(null);
}

/**
 * Mounted inside QueryClientProvider - it needs useQueryClient() to clear the
 * cache on sign-out and a dead session.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session>({ status: 'loading' });
  const queryClient = useQueryClient();

  useEffect(() => {
    let cancelled = false;

    // Refresh tokens are single use and rotate: presenting one that's already
    // been redeemed is treated as theft and revokes every session for that
    // user. Refreshing here too, on top of the reactive refresh in
    // client.ts's request(), would give a cold start two refresh code paths
    // racing over the same token. So on mount we never refresh directly - we
    // just call fetchMe() unauthenticated (no access token exists yet), let
    // it 401, and let client.ts's single-flight refresh-and-retry handle the
    // rotation the normal way, on demand.
    async function bootstrap() {
      const refreshToken = await readRefreshToken();
      if (refreshToken === null) {
        if (!cancelled) setSession({ status: 'signedOut' });
        return;
      }

      try {
        const me = await fetchMe();
        if (!cancelled) setSession({ status: 'signedIn', user: me });
      } catch (error) {
        // Opening the app with no connection must not destroy a perfectly
        // good session: the refresh token is kept so the next launch can
        // restore it. Only an answer from the server means the session is
        // genuinely over, and then the dead token is cleared.
        const unreachable = error instanceof ApiError && error.code === 'NETWORK';
        if (!unreachable) await clearTokens();
        if (!cancelled) setSession({ status: 'signedOut' });
      }
    }

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    onSessionLost(() => {
      void clearTokens();
      setSession({ status: 'signedOut' });
    });
    return () => onSessionLost(null);
  }, []);

  const value = useMemo<AuthValue>(
    () => ({
      session,
      signIn: async (email, password) => {
        const result = await login({ email, password });
        setAccessToken(result.accessToken);
        await writeRefreshToken(result.refreshToken);
        setSession({ status: 'signedIn', user: result.user });
      },
      signUp: async (username, email, password) => {
        const result = await register({ username, email, password });
        setAccessToken(result.accessToken);
        await writeRefreshToken(result.refreshToken);
        setSession({ status: 'signedIn', user: result.user });
      },
      signOut: async () => {
        const refreshToken = await readRefreshToken();
        if (refreshToken) {
          try {
            await logout(refreshToken);
          } catch {
            // The local session must end even if the server call fails
            // (e.g. offline, token already expired) - there is nothing
            // meaningful to do with this error beyond that.
          }
        }
        await clearTokens();
        queryClient.clear();
        setSession({ status: 'signedOut' });
      },
      refreshUser: async () => {
        const me = await fetchMe();
        setSession({ status: 'signedIn', user: me });
      },
    }),
    [session, queryClient],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used within an AuthProvider');
  return value;
}

export function useCurrentUser(): Me | null {
  const { session } = useAuth();
  return session.status === 'signedIn' ? session.user : null;
}
