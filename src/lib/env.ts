// EXPO_PUBLIC_* vars are inlined at build time by Expo, so this is the one
// place that reads them. Falling back to localhost keeps `expo start` usable
// without extra setup while still failing obviously (network error) if a
// real backend URL was actually required.
export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';
