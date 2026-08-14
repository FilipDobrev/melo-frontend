# Melo — mobile app

Expo + React Native + Expo Router. A cooking-first social app: you write
recipes, save them to a cookbook, cook them in a guided mode, and post the
result to a feed your followers see.

## Running it

```bash
cd backend && npm run dev     # must be up first, defaults to :4000
cd frontend && npm start
```

`EXPO_PUBLIC_API_URL` in `.env` points at the API and defaults to
`http://localhost:4000/api/v1`. On a physical device, swap `localhost` for
your machine's LAN address or the app cannot reach the backend.

## Design

The visual direction and every component contract live in
[BUILD-SPEC.md](./BUILD-SPEC.md). The short version:

Melo's numbers are real — the backend computes actual grams and macros for
every recipe — so the app displays them like an instrument. Every quantity is
set in DM Mono with tabular figures, usually on a recessed slab, like a
kitchen scale readout. Everything around that stays quiet: paper ground, ink
text, hairline rules, one hot accent for things you press (saffron) and one
deep accent for things you scan (basil).

Two structural signatures carry it:

- **The COOKED stamp** — every post card has a strip under its photo naming
  the recipe it documents, with its macros and the save toggle. It is why you
  can save a recipe straight from the feed.
- **The dotted leader** — ingredient rows run `name ······· 45 g`, the way a
  recipe card does.

**All tokens live in `src/theme/theme.ts`.** That is the one file to edit to
re-skin the app; nothing else hardcodes a colour or a font size. Typefaces are
registered under role names in `src/theme/fonts.ts`, so swapping a family is a
one-line change.

## Layout

```
app/                     routes (expo-router). Thin: params in, hooks, feature component out.
src/theme/               design tokens + font loading
src/api/                 one module per domain, fetchers and react-query hooks together
src/auth/                session context
src/ui/                  dumb primitives. No data fetching, no navigation.
src/features/<domain>/   composed components that know about domain types
src/lib/                 formatting, image upload
```

### Conventions worth knowing

- **Every response is validated.** `request()` takes a zod schema and parses
  before the app touches the data, so a backend change surfaces as one loud
  contract error rather than scattered undefined reads.
- **Tokens.** The access token is memory-only; the refresh token goes to the
  keychain (localStorage on web). On a 401 the client refreshes once, sharing a
  single in-flight promise across concurrent failures, then retries.
- **Pagination** is cursor-based everywhere: `usePagedQuery` + `flattenPages`.
- **`imageKey` is write-only.** Send it on create/update; never read it back and
  never build an image URL client-side. Render the `imageUrl` the server gives.
  The same holds for avatars: send the storage key, render the resolved
  `profileImage` URL that comes back.
- **Every upload is downscaled and re-encoded first** (`src/lib/image.ts`):
  JPEG, 1600px on the long edge. Size is the lesser reason. The real one is
  that re-encoding strips EXIF, which otherwise publishes the GPS coordinates
  of the user's kitchen with every photo. `uploadImage` is the single choke
  point, so posts, recipe pictures and avatars all get this automatically.
  Content length is measured on the *prepared* file — the presigned signature
  covers the byte count, so measuring the original would fail every PUT.
- **Reactions and saves are optimistic inside the hooks.** Components render
  from query data and hold no mirrored local state.
- The bottom sheet is hand-built from `Modal` + `Animated` + `PanResponder`
  (`src/ui/Sheet.tsx`) rather than pulling in a gesture library.

## Known gaps

- **Follower and following lists show no follow button.** Those endpoints
  return a user summary without an `isFollowing` flag, so a button there would
  have to guess. Rows navigate to the profile, where the state is known.
- **Post counts on a profile** are the number loaded so far, rendered with a
  trailing `+` while more pages exist — the API exposes no total.
- **The collection picker cannot show existing membership.** No endpoint says
  whether a recipe is already in a collection, so rows mark themselves "Added"
  only after you add them in that session.
- No tests yet.
