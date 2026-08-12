# Melo (frontend)

Expo + React Native + TypeScript client for the Melo API, targeting iOS, Android and Web
from a single codebase via [expo-router](https://docs.expo.dev/router/introduction/).

## Stack

- **Expo SDK 57**, React Native, TypeScript (`strict: true`, no `any`).
- **expo-router** - file-based routing under `app/`, typed routes enabled.
- **@tanstack/react-query** - server state, caching and pagination (`useInfiniteQuery`
  for every paginated list; the app never fetches "everything" up front).
- **zod** - every API response is parsed against a schema in `src/api/schemas.ts`
  before the app touches it.
- **expo-secure-store** for the refresh token on iOS/Android (Keychain/Keystore-backed).
  On web, where SecureStore has no equivalent, it falls back to `localStorage`
  (see `src/lib/storage.ts` - this is a documented, intentional weaker guarantee on web).
- **fetch**, not axios - the client wrapper (`src/api/client.ts`) is one function with
  token attachment, single-flight refresh-on-401, and JSON parsing. Axios buys
  interceptors and a bigger bundle for no capability fetch doesn't already give us here.
- **expo-image-picker** / **expo-image** for picking and rendering photos.
- Plain **React Native `StyleSheet`** - no UI kit, no NativeWind.

## Running it

```bash
npm install
npx expo start          # then press i / a / w, or scan the QR code with Expo Go
npx expo start --web    # web only
npx expo start --ios    # requires macOS/Xcode, or use Expo Go
npx expo start --android
```

## Pointing at the backend

The API base URL is read from `EXPO_PUBLIC_API_URL` (see `src/lib/env.ts`). Copy
`.env.example` to `.env` and edit it:

```bash
cp .env.example .env
```

```
EXPO_PUBLIC_API_URL=http://localhost:3000/api/v1
```

`EXPO_PUBLIC_*` variables are inlined at build/start time by Expo. If it's unset the
app falls back to `http://localhost:3000/api/v1`. When testing on a physical device
over Expo Go, `localhost` means the device itself - point it at your machine's LAN IP
instead (e.g. `http://192.168.1.20:3000/api/v1`).

## Project structure

```
app/                     expo-router screens (file-based routing)
  (auth)/                login, register - redirects to (tabs) once authenticated
  (tabs)/                feed, discover, cookbook, profile
  post/[id].tsx           post detail: images, reactions, paginated comments
  post/new.tsx            create a post (image upload + optional recipe attach)
  recipe/[id].tsx         recipe detail: ingredients, nutrition, save/edit/delete
  recipe/new.tsx          create/edit a recipe (also handles ?editId=)
  user/[id].tsx           public profile: follow, posts, recipes

src/
  api/
    client.ts             fetch wrapper: base URL, auth header, 401 refresh-and-retry
    schemas.ts             zod schemas mirroring API.md
    *.api.ts                one module per resource (auth, users, recipes, ...)
    pagination.ts           shared Paginated<T>/PageParams types
  hooks/                  react-query hooks (useFeed, useRecipe, useToggleFollow, ...)
  components/             presentational components (PostCard, RecipeCard, ...)
  context/AuthContext.tsx current user + login/register/logout, token persistence
  lib/                    env, secure storage wrapper, token store, unit formatting
```

## Auth token handling

- The **access token** lives in memory only (`src/lib/tokenStore.ts`) - it's short-lived
  and re-derived on every app start via a refresh call, so persisting it buys nothing.
- The **refresh token** is persisted via `secureStorage` (SecureStore on native,
  localStorage on web).
- `src/api/client.ts` de-duplicates concurrent refreshes: if ten requests hit a 401 at
  once, only one `/auth/refresh` call is made and all ten retry against its result.
- A failed refresh (expired/revoked refresh token) clears the session and the router
  guards in `(auth)/_layout.tsx` and `(tabs)/_layout.tsx` redirect to `/login`.

## What's stubbed / incomplete

- **Profile picture editing** is a plain "paste an image URL" text field. API.md only
  documents a presigned-upload flow for *post* images (`/posts/images/upload-url`);
  there's no documented equivalent for avatars, so wiring the image picker through an
  undocumented endpoint would have been a guess. Swapping in the picker + upload flow
  is a small change once that endpoint is confirmed.
- **Adding a brand-new product** (not just searching existing ones) isn't exposed in
  the recipe form. `POST /products` exists in the API and `src/api/products.api.ts`
  already wraps it, but there's no screen for it yet.
- Followers/following **list screens** aren't wired up as their own routes - the API
  client functions (`getFollowers`, `getFollowing`) exist and the profile screen shows
  the counts, but tapping through to the full lists isn't built.
- No automated tests. There is no running backend to test against per the task
  brief; correctness was verified by matching API.md's documented shapes in the zod
  schemas and by `npx tsc --noEmit` passing with zero errors.
- A few response shapes aren't fully pinned down in API.md (e.g. the exact field
  names on `GET /users/:userId` for follower/following counts, or the comment
  payload shape). Reasonable field names were chosen and are called out with a
  comment at the point of definition in `src/api/schemas.ts` - these are the first
  place to check if the real backend returns a different shape.
