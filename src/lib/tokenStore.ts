// Single source of truth for the current auth tokens.
//
// The access token only ever lives in memory - it's short-lived and re-derived
// from a refresh on every app start, so there's nothing to gain from persisting
// it. The refresh token is persisted via secureStorage (SecureStore on native,
// localStorage on web - see storage.ts).
import { secureStorage } from './storage';

const REFRESH_TOKEN_KEY = 'melo.refreshToken';

let accessToken: string | null = null;

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export async function getRefreshToken(): Promise<string | null> {
  return secureStorage.getItem(REFRESH_TOKEN_KEY);
}

export async function setRefreshToken(token: string): Promise<void> {
  await secureStorage.setItem(REFRESH_TOKEN_KEY, token);
}

export async function setTokens(access: string, refresh: string): Promise<void> {
  accessToken = access;
  await setRefreshToken(refresh);
}

export async function clearTokens(): Promise<void> {
  accessToken = null;
  await secureStorage.removeItem(REFRESH_TOKEN_KEY);
}
