// Single fetch wrapper for the whole app. Responsibilities:
//   - build the URL from EXPO_PUBLIC_API_URL
//   - attach the access token
//   - on a 401, refresh the access token exactly once (concurrent callers
//     share the same in-flight refresh) and retry the original request
//   - parse the response through the zod schema the caller provides, so
//     nothing downstream touches unvalidated JSON
import type { ZodTypeAny, z } from 'zod';
import { API_URL } from '../lib/env';
import { getAccessToken, getRefreshToken, setTokens, clearTokens } from '../lib/tokenStore';
import { authResultSchema, errorResponseSchema } from './schemas';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Called by AuthContext so a failed refresh (refresh token expired/revoked)
// clears the session and drops the user back to the login screen, instead of
// the app silently retrying 401s forever.
let onSessionExpired: (() => void) | null = null;
export function setOnSessionExpired(handler: () => void): void {
  onSessionExpired = handler;
}

// Ten parallel 401s must trigger exactly one refresh call. Every caller that
// hits a 401 while a refresh is already in flight awaits this same promise
// instead of starting its own.
let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    const refreshToken = await getRefreshToken();
    if (!refreshToken) {
      throw new ApiError(401, 'UNAUTHENTICATED', 'No refresh token available');
    }

    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      throw new ApiError(response.status, 'UNAUTHENTICATED', 'Session expired');
    }

    const json: unknown = await response.json();
    const result = authResultSchema.parse(json);
    await setTokens(result.accessToken, result.refreshToken);
    return result.accessToken;
  })();

  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  query?: Record<string, string | number | undefined>;
  /** Skip attaching the access token (login/register/refresh). */
  skipAuth?: boolean;
};

function buildUrl(path: string, query?: RequestOptions['query']): string {
  const url = new URL(`${API_URL}${path}`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    }
  }
  return url.toString();
}

async function performFetch(path: string, options: RequestOptions): Promise<Response> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (!options.skipAuth) {
    const token = getAccessToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  return fetch(buildUrl(path, options.query), {
    method: options.method ?? 'GET',
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });
}

async function throwApiError(response: Response): Promise<never> {
  const json: unknown = await response.json().catch(() => null);
  const parsed = json ? errorResponseSchema.safeParse(json) : null;
  if (parsed?.success) {
    throw new ApiError(response.status, parsed.data.error.code, parsed.data.error.message);
  }
  throw new ApiError(response.status, 'INTERNAL', `Request failed with status ${response.status}`);
}

async function requestWithRefresh(path: string, options: RequestOptions): Promise<Response> {
  let response = await performFetch(path, options);

  if (response.status === 401 && !options.skipAuth) {
    try {
      await refreshAccessToken();
    } catch {
      await clearTokens();
      onSessionExpired?.();
      await throwApiError(response);
    }
    response = await performFetch(path, options);
  }

  return response;
}

/** For endpoints that return a JSON body, validated against `schema`. */
export async function apiRequest<S extends ZodTypeAny>(
  path: string,
  schema: S,
  options: RequestOptions = {},
): Promise<z.infer<S>> {
  const response = await requestWithRefresh(path, options);
  if (!response.ok) {
    await throwApiError(response);
  }
  const json: unknown = await response.json();
  return schema.parse(json);
}

/** For endpoints that return 204 No Content. */
export async function apiRequestNoContent(path: string, options: RequestOptions = {}): Promise<void> {
  const response = await requestWithRefresh(path, options);
  if (!response.ok) {
    await throwApiError(response);
  }
}
