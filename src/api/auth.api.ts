import { apiRequest, apiRequestNoContent } from './client';
import { authResultSchema, type AuthResult } from './schemas';
import { getRefreshToken, setTokens, clearTokens } from '../lib/tokenStore';

export async function register(input: {
  username: string;
  email: string;
  password: string;
}): Promise<AuthResult> {
  const result = await apiRequest('/auth/register', authResultSchema, {
    method: 'POST',
    body: input,
    skipAuth: true,
  });
  await setTokens(result.accessToken, result.refreshToken);
  return result;
}

export async function login(input: { email: string; password: string }): Promise<AuthResult> {
  const result = await apiRequest('/auth/login', authResultSchema, {
    method: 'POST',
    body: input,
    skipAuth: true,
  });
  await setTokens(result.accessToken, result.refreshToken);
  return result;
}

export async function logout(): Promise<void> {
  const refreshToken = await getRefreshToken();
  if (refreshToken) {
    // Best-effort: the local session is cleared either way.
    await apiRequestNoContent('/auth/logout', { method: 'POST', body: { refreshToken } }).catch(() => {});
  }
  await clearTokens();
}
