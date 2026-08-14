import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const REFRESH_TOKEN_KEY = 'melo.refreshToken';

/**
 * The access token never leaves memory: it is short-lived and re-derivable
 * from the refresh token, so persisting it would only widen the blast radius
 * of a stolen device backup. The refresh token goes to the keychain.
 */
let accessToken: string | null = null;

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

/** SecureStore has no web implementation, so the web build uses localStorage. */
export async function readRefreshToken(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return globalThis.localStorage?.getItem(REFRESH_TOKEN_KEY) ?? null;
  }
  return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
}

export async function writeRefreshToken(token: string | null): Promise<void> {
  if (Platform.OS === 'web') {
    if (token === null) globalThis.localStorage?.removeItem(REFRESH_TOKEN_KEY);
    else globalThis.localStorage?.setItem(REFRESH_TOKEN_KEY, token);
    return;
  }
  if (token === null) await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  else await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
}
