import type { ZodType } from 'zod';

import { getAccessToken, readRefreshToken, setAccessToken, writeRefreshToken } from './tokens';

export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/** Thrown when a response is well-formed JSON but not the shape we expect. */
export class ApiContractError extends Error {
  constructor(path: string, cause: unknown) {
    super(`The server sent an unexpected response for ${path}.`);
    this.name = 'ApiContractError';
    this.cause = cause;
  }
}

type QueryValue = string | number | boolean | undefined | null;

export interface RequestOptions<T> {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  query?: Record<string, QueryValue>;
  /** Validates the response body. Omit for 204 endpoints. */
  schema?: ZodType<T>;
  /** Auth endpoints must not trigger the refresh-and-retry path. */
  skipAuth?: boolean;
}

let sessionLostHandler: (() => void) | null = null;

/** AuthContext registers here so a dead refresh token logs the user out. */
export function onSessionLost(handler: (() => void) | null): void {
  sessionLostHandler = handler;
}

function buildUrl(path: string, query?: Record<string, QueryValue>): string {
  const url = `${API_URL}${path}`;
  if (!query) return url;

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, String(value));
    }
  }
  const queryString = params.toString();
  return queryString ? `${url}?${queryString}` : url;
}

async function toApiError(response: Response): Promise<ApiError> {
  let code = 'INTERNAL';
  let message = 'Something went wrong. Try again.';
  let details: unknown;

  try {
    const payload: unknown = await response.json();
    if (payload && typeof payload === 'object' && 'error' in payload) {
      const error = (payload as { error: unknown }).error;
      if (error && typeof error === 'object') {
        const shape = error as { code?: unknown; message?: unknown; details?: unknown };
        if (typeof shape.code === 'string') code = shape.code;
        if (typeof shape.message === 'string') message = shape.message;
        details = shape.details;
      }
    }
  } catch {
    // A non-JSON error body (a proxy timeout page, say) leaves the defaults.
  }

  return new ApiError(response.status, code, message, details);
}

/**
 * Several requests can hit an expired access token at the same moment. They
 * all await this one promise so only a single refresh (and so a single token
 * rotation) is ever in flight.
 */
let refreshInFlight: Promise<boolean> | null = null;

function refreshSession(): Promise<boolean> {
  refreshInFlight ??= runRefresh().finally(() => {
    refreshInFlight = null;
  });
  return refreshInFlight;
}

async function runRefresh(): Promise<boolean> {
  const refreshToken = await readRefreshToken();
  if (!refreshToken) return false;

  const response = await fetch(buildUrl('/auth/refresh'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  if (!response.ok) {
    setAccessToken(null);
    await writeRefreshToken(null);
    sessionLostHandler?.();
    return false;
  }

  const payload = (await response.json()) as { accessToken?: unknown; refreshToken?: unknown };
  if (typeof payload.accessToken !== 'string' || typeof payload.refreshToken !== 'string') {
    setAccessToken(null);
    await writeRefreshToken(null);
    sessionLostHandler?.();
    return false;
  }

  setAccessToken(payload.accessToken);
  await writeRefreshToken(payload.refreshToken);
  return true;
}

async function send(path: string, options: RequestOptions<unknown>): Promise<Response> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  const token = getAccessToken();
  if (token && !options.skipAuth) headers.Authorization = `Bearer ${token}`;
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';

  return fetch(buildUrl(path, options.query), {
    method: options.method ?? 'GET',
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
}

export async function request<T>(path: string, options: RequestOptions<T> = {}): Promise<T> {
  let response: Response;
  try {
    response = await send(path, options);
  } catch {
    throw new ApiError(0, 'NETWORK', 'Cannot reach Melo. Check your connection.');
  }

  if (response.status === 401 && !options.skipAuth) {
    const refreshed = await refreshSession();
    if (refreshed) {
      response = await send(path, options);
    }
  }

  if (!response.ok) throw await toApiError(response);

  if (!options.schema) return undefined as T;

  const payload: unknown = await response.json();
  const parsed = options.schema.safeParse(payload);
  if (!parsed.success) throw new ApiContractError(path, parsed.error);
  return parsed.data;
}

/** Human-readable text for anything thrown by the API layer. */
export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof ApiContractError) return error.message;
  if (error instanceof Error && error.message) return error.message;
  return 'Something went wrong. Try again.';
}
