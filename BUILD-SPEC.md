# Melo frontend — build spec

Read this file completely before writing any code. It is the single source of
truth for design, architecture, and file ownership. The backend is unchanged:
`../backend/API.md` is the endpoint contract. Do not modify the backend.

The previous frontend was rejected wholesale and moved to `../_old-frontend/`.
**Do not read it. Do not copy from it.**

---

## 1. What Melo is

A cooking-first social app. Instagram-shaped, but the unit of content is not a
photo — it is **evidence that someone cooked a specific recipe**. Every post is
required to link a recipe (`recipeId` is mandatory server-side). Every recipe
carries real computed numbers: grams, calories, protein, carbs, fat.

Audience: home cooks in their 20s–30s who actually cook, keep a personal
cookbook, and follow friends who cook.

The job of the feed: make you want to cook something tonight, and make saving
it to your cookbook a single tap.

---

## 2. Design direction — "the readout"

The one memorable idea: **Melo's numbers are real, so Melo displays them like
an instrument.** Every quantity in the app — ingredient amounts, macros,
calories, follower counts, reaction totals, step numbers, comment counts — is
set in a monospaced face (DM Mono) with tight tracking, usually on a slightly
recessed slab, like a kitchen scale readout. Nothing else in the app shouts.

Two structural signatures carry this:

**(a) The COOKED stamp.** Every post card has a strip attached directly under
its image: an eyebrow reading `COOKED`, the recipe title in the display face,
the macro readout in mono, and the save control on the right. This is the thing
Instagram cannot do, and it is where "save a recipe straight from the feed"
lives.

```
┌─────────────────────────────────────┐
│ ◯  username                 2h   ⋯  │
├─────────────────────────────────────┤
│                                     │
│            [ IMAGE 1:1 ]            │
│                         ● ○ ○       │   dots only when >1 image
├─────────────────────────────────────┤
│ ╭─────────────────────────────────╮ │
│ │ COOKED                          │ │   label, basil, uppercase
│ │ Miso Butter Mushroom Toast   🔖 │ │   display face + save toggle
│ │ 512 KCAL · 18 P · 44 C · 27 F   │ │   mono readout
│ ╰─────────────────────────────────╯ │   basilTint slab, radius.md
├─────────────────────────────────────┤
│ [🔥 12] [❤️ 8]  +      💬 4          │   reaction pills + add + comments
│ username  caption text…             │
│ View all 4 comments                 │
└─────────────────────────────────────┘
```

**(b) The dotted leader.** Ingredient rows in recipe detail and cook mode use a
recipe-card dotted leader between the product name and its mono quantity:

```
Unsalted butter ······················  45 g
Chestnut mushrooms ···················  300 g
```

Implement the leader as a flexed `View` with `borderBottomWidth: 1`,
`borderStyle: 'dotted'`, `borderColor: colors.line`, sitting on the text
baseline. Not a repeated "·" string.

### Restraint rules

- Boldness is spent on the readout and the COOKED stamp. Everything else is
  quiet: hairlines, generous whitespace, no gradients, no glassmorphism, no
  drop shadows except `shadow.float` on things that genuinely float (sheets,
  FABs, toasts) and `shadow.lift` on nothing else unless justified.
- No decorative iconography. Icons are Feather from `@expo/vector-icons`, used
  only where a word would be slower.
- Border radius is never larger than `radius.xl` except pills.
- No emoji anywhere except the five reaction emoji, which are content.
- Animation is limited to: sheet slide-in, reaction picker expand, image
  carousel paging, and the cook-mode step check. Respect
  `AccessibilityInfo.isReduceMotionEnabled` by skipping the animation and
  jumping to the end state.

### Tokens

All tokens live in `src/theme/theme.ts` — **already written, do not add a
second source of truth and do not hardcode a hex anywhere else.**

- `colors.ground` `#F5F5F1` paper background
- `colors.surface` `#FFFFFF` cards / sheets / inputs
- `colors.slab` `#EEEEE8` recessed readouts, image placeholders
- `colors.text` `#14161A`, `textMuted` `#6E7279`, `textFaint` `#9DA1A7`
- `colors.line` `#E3E3DC`, `lineStrong` `#D2D2C9`
- `colors.accent` saffron `#DE9412` — anything you press. `accentTint` for its
  soft background, `accentPressed` for the pressed state.
- `colors.deep` basil `#2E5B3E` — things you scan: category chips, the COOKED
  stamp, links. `deepTint` for its soft background.
- `colors.danger` / `dangerTint`
- `cookColors.*` — cook mode inverts to a dark counter-top palette.

Type roles in `type.*`: `displayXl/Lg/Md/Sm` (Bricolage Grotesque, tight
negative tracking), `bodyLg/body/bodySm` + `strong/strongSm` (Public Sans),
`label` (uppercase eyebrow), `readoutXl/Lg/readout/readoutSm` (DM Mono).

`space.*` = hair 2, xs 4, sm 8, md 12, lg 16, xl 20, xxl 28, xxxl 40.
`radius.*` = sm 6, md 10, lg 14, xl 22, pill 999.

Never set `fontWeight` alongside a custom `fontFamily` — pick the right family
role instead. Never inline a font size that is not in `type.*`.

### Copy voice

Plain, second person, sentence case, active verbs. Buttons name the outcome
("Save recipe", "Post", "Start cooking"), and the confirmation reuses the same
word. Empty states are invitations with an action, never a shrug. Errors say
what happened and what to do; they do not apologise.

Examples to use verbatim where they fit:
- Empty feed: "Your feed is quiet. Follow some cooks, or cook something
  yourself." + button "Find people to follow".
- Empty cookbook: "Nothing saved yet. Tap the bookmark on any recipe to keep
  it here." + button "Browse recipes".
- Empty comments: "No comments yet. Say something."
- Failed load: "Couldn't load this. Check your connection." + "Try again".

---

## 3. Architecture

Follow `../CLAUDE.md` strictly: simple, explicit, traceable, no premature
abstraction, no `any`, no `as X` to silence the compiler, errors handled
intentionally.

```
frontend/
  app/                      expo-router file routes (screens only, thin)
  src/
    theme/theme.ts          DONE - all tokens
    theme/fonts.ts          DONE - font role -> file map, useAppFonts()
    api/tokens.ts           DONE - in-memory access token, keychain refresh
    api/client.ts           DONE - request(), ApiError, single-flight refresh
    api/schemas.ts          DONE - zod schema + type per response shape
    api/keys.ts             DONE - react-query keys
    api/paging.ts           DONE - usePagedQuery(), flattenPages()
    api/users.ts            DONE - auth calls, profile, follow, search
    api/recipes.ts          DONE - recipe CRUD, search, presets, save
    api/*                   remaining domain modules (fetchers + hooks together)
    auth/AuthContext.tsx    session
    lib/                    upload, formatting
    ui/                     dumb primitives, no data fetching
    features/<domain>/      composed components that know about domain types
```

Rules that are not negotiable:

1. **Screens in `app/` stay thin.** Route params in, a hook call, a feature
   component out. No layout-heavy JSX and no business logic in a route file.
2. **Every response is validated.** Call `request()` with a `schema`. Never
   `fetch` directly except inside `src/lib/upload.ts` (raw PUT to storage).
3. **`imageKey` is write-only.** Send it on create/update. Never read it back,
   never construct an image URL client-side — always render `imageUrl`.
4. **Pagination is always `usePagedQuery` + `flattenPages`.**
5. **Lists use `FlatList`** with `onEndReached` → `fetchNextPage()`, guarded by
   `hasNextPage && !isFetchingNextPage`. Never `.map()` an unbounded list.
6. **Images use `expo-image`'s `Image`,** never RN's, with a
   `placeholderContentFit`/background of `colors.slab` so layout never jumps.
7. Any tappable smaller than 44×44 gets `hitSlop={HIT_SLOP}` from theme.
8. Everything interactive gets `accessibilityRole` and a meaningful
   `accessibilityLabel`.

### Auth session

`src/auth/AuthContext.tsx` exposes:

```ts
type Session =
  | { status: 'loading' }
  | { status: 'signedOut' }
  | { status: 'signedIn'; user: Me };

interface AuthValue {
  session: Session;
  signIn(email: string, password: string): Promise<void>;
  signUp(username: string, email: string, password: string): Promise<void>;
  signOut(): Promise<void>;
}
export function useAuth(): AuthValue;         // throws outside the provider
export function useCurrentUser(): Me | null;  // convenience
```

On mount: read the persisted refresh token; if present, POST `/auth/refresh`,
store the new pair, then GET `/users/me`. Any failure ⇒ clear tokens ⇒
`signedOut`. Register `onSessionLost` from `api/client.ts` so a dead refresh
mid-session drops to `signedOut` and the router redirects.

`signOut` calls POST `/auth/logout` with the stored refresh token (ignore
failures — the local session must end regardless), clears both tokens, and
calls `queryClient.clear()`.

---

## 4. UI primitives — `src/ui/`

One file per primitive, each exporting one component. No data fetching, no
navigation, no react-query. Props below are the contract; add optional props
only if a screen genuinely needs them.

- `Text.tsx` — `<Text variant="body" color="textMuted" numberOfLines>`.
  `variant` keys off `type.*`, `color` keys off `colors.*`. This is the only
  component allowed to set `fontFamily`. Also export `Readout` here (or in
  `Readout.tsx`) for numbers: it forces the mono role and
  `fontVariant: ['tabular-nums']`.
- `Button.tsx` — `variant: 'primary' | 'secondary' | 'ghost' | 'danger'`,
  `size: 'md' | 'lg'`, `loading`, `disabled`, `icon?` (Feather name),
  `onPress`, `title`. Primary = saffron fill, ink text. Secondary = surface
  fill with `lineStrong` border. Ghost = text only. Full-width via `stretch`.
  Uses `Pressable` with an opacity/`accentPressed` pressed state.
- `IconButton.tsx` — Feather icon in a 40×40 hit area, `label` required for
  accessibility.
- `Avatar.tsx` — `uri: string | null`, `size: number`, `username: string`.
  Falls back to the first letter of the username on a `slab` circle in the
  display face. Circular, 1px `line` border.
- `Chip.tsx` — `label`, `selected`, `onPress?`. Pill, `bodySm`. Selected =
  `deep` fill / white text; unselected = `deepTint` fill / `deep` text; static
  (no onPress) renders the unselected look without press feedback.
- `Field.tsx` — labeled input: `label`, `value`, `onChangeText`, `error?`,
  `multiline?`, plus pass-through `TextInputProps`. Label is `type.label`.
  Input sits on `surface` with a `line` border that turns `accent` on focus
  and `danger` when `error` is set. Error text below in `bodySm`/`danger`.
- `Screen.tsx` — safe-area wrapper, `colors.ground` background, optional
  `edges`.
- `ScreenHeader.tsx` — `title`, optional `back` (chevron-left, `router.back()`
  is passed in by the caller as `onBack`), optional `right` node. Title in
  `displayMd`. Bottom hairline.
- `Sheet.tsx` — bottom sheet. **Build it, do not add a dependency.** RN
  `Modal` (`transparent`, `animationType="none"`, `statusBarTranslucent`) +
  `Animated.View` translateY + `PanResponder` on the grabber for
  drag-to-dismiss (dismiss past 25% of height or a fling). Props:
  `visible`, `onClose`, `title?`, `heightRatio = 0.85`, `children`. Includes a
  scrim that closes on press, a grabber bar, a title row with a close button,
  and `KeyboardAvoidingView` so a composer pinned to the bottom stays visible.
- `Sheet` must render `children` inside a `View` with `flex: 1` so callers can
  put a `FlatList` in it.
- `EmptyState.tsx` — `title`, `body`, optional `actionLabel` + `onAction`.
- `StateView.tsx` — one component that takes `isLoading`, `error`,
  `onRetry`, `children`: shows a centred `ActivityIndicator` (accent),
  an error message with a retry button, or the children. Every screen uses it
  so loading/error look identical everywhere.
- `Divider.tsx` — 1px `colors.line` hairline.

### `src/lib/format.ts`

- `relativeTime(iso: string): string` — "now", "4m", "2h", "3d", then
  "12 Mar". Used in post headers and comments.
- `formatQuantity(quantity: number, unit: Unit): string` — trims trailing
  zeros (`45` not `45.0`, `1.5` not `1.50`) and appends the short unit label.
  Unit labels: GRAM `g`, KILOGRAM `kg`, MILLILITRE `ml`, LITRE `l`, CUP `cup`,
  TABLESPOON `tbsp`, TEASPOON `tsp`, PIECE `pc`.
- `UNIT_LABELS: Record<Unit, string>` and `UNIT_OPTIONS` for pickers.
- `formatCount(n: number): string` — `1234` → `1,234`; `12500` → `12.5k`.
- `formatMacros(n: Nutrition): string` — `"512 KCAL · 18 P · 44 C · 27 F"`,
  values rounded to whole numbers.

---

## 5. Screens

Router: expo-router, typed routes on. Root `app/_layout.tsx` mounts
`QueryClientProvider`, `AuthProvider`, `SafeAreaProvider`,
`GestureHandlerRootView`, loads fonts via `useAppFonts()` and renders nothing
until fonts and session both resolve. It redirects: `signedOut` ⇒ `(auth)`,
`signedIn` inside `(auth)` ⇒ `(tabs)`.

### Tabs — `app/(tabs)/_layout.tsx`

Five tabs, custom-styled `Tabs` (hairline top border, `surface` background, no
labels, `accent` when focused, `textFaint` when not, Feather icons):

| route | icon | screen |
| --- | --- | --- |
| `index` | `home` | Feed |
| `discover` | `search` | Discover |
| `create` | `plus-square` | Create (see below) |
| `cookbook` | `bookmark` | Cookbook |
| `profile` | avatar | Your profile |

The `create` tab must not navigate. Intercept `tabPress` with
`preventDefault()` and open a small bottom `Sheet` offering two rows:
**Write a recipe** → `/recipe/new`, and **Post a cook** → `/compose` (recipe
picker first). Match Instagram's behaviour of the centre button being an
action, not a destination.

### Feed — `app/(tabs)/index.tsx`

`GET /feed`, infinite. Header row: the Melo wordmark left (display face,
tight), nothing else. `FlatList` of `PostCard`, pull-to-refresh, empty state as
specced above. Everything is done in place — no navigation required to react,
save, or comment.

### Post detail — `app/post/[id].tsx`

`GET /posts/:id`. Same `PostCard` in a `detail` variant: full caption always
expanded, comments list rendered inline below instead of the "view all" link,
composer pinned at the bottom. Owner sees an overflow menu with **Delete post**
and, per image, **Remove this photo** (`DELETE /posts/:postId/images/:imageId`,
which the server refuses when it is the last image — surface that message).

### Compose — `app/compose/index.tsx` and `app/compose/[recipeId].tsx`

`/compose` with no recipe: a picker screen listing your cookbook + your recipes
with a search field; picking one routes to `/compose/<recipeId>`.
`/compose/[recipeId]`: the chosen recipe shown as a locked COOKED stamp at the
top (with a "Change" affordance), a multi-image picker (up to 10, reorderable
is out of scope, removable before posting), a caption field (2000 max, counter
shown past 1800), and a primary **Post** button. Upload sequence: for each
image, `POST /posts/images/upload-url` → raw `PUT` → collect `storageKey`, then
`POST /posts`. Show per-image upload progress state ("3 of 5"). On success,
invalidate feed + that user's posts and `router.replace('/(tabs)')`.

### Cook mode — `app/cook/[id].tsx`

Full-screen, `cookColors` dark palette, status bar light. Ingredients as
tappable rows with a checkbox and the dotted leader; instructions split on
blank lines into steps, each a tappable card with a mono step number. A thin
progress bar at the top tracks checked-off items across both sections. Keep the
screen awake is out of scope. Bottom bar: **Finish and post** (primary) which
routes to `/compose/<recipeId>`, and a quiet **Close**.

### Discover — `app/(tabs)/discover.tsx`

Search field at the top. A two-way segmented control **Recipes | People**.
- Recipes: horizontal category chip row (from `GET /categories`, multi-select),
  a sort control (`newest` / `oldest` / `popular`), and a 2-column grid of
  `RecipeTile`s.
- People: `GET /users?search=` as rows of avatar + username + a `FollowButton`.

Debounce the search input by 300ms. When the query is empty, Recipes still
shows results (newest); People shows the empty state "Search for a cook by
username."

### Cookbook — `app/(tabs)/cookbook.tsx`

Top: a horizontal rail of collection tiles (name + `recipeCount` in mono) plus
a `+ New collection` tile that opens a naming sheet. Below: the category chip
filter, then a 2-column grid from `GET /users/me/cookbook`. Long-press (or an
overflow icon) on a collection tile offers Rename / Delete with a confirm.

### Collection — `app/collection/[id].tsx`

Header = collection name with a rename action, grid of its recipes, and a
per-item remove action.

### Profile — `app/(tabs)/profile.tsx` and `app/user/[id].tsx`

Both render one `ProfileView` feature component; the tab passes the current
user's id. Layout, Instagram-shaped:

```
  ◯ 84px avatar     12      340       180
                   POSTS  FOLLOWERS  FOLLOWING     <- counts in mono readout
  username (displayLg)
  [ Edit profile ] [ ⚙ ]        or       [ Follow / Following ]
  ── Posts | Recipes ──                            <- segmented, hairline
  ▦▦▦  3-column square grid, 1px gutters
```

Tapping a grid post opens `/post/<id>`. Tapping a grid recipe opens
`/recipe/<id>`. Followers/Following counts are tappable →
`/user/[id]/followers` and `/user/[id]/following`, each a paginated list of
`UserRow`s with a follow button.

### Settings — `app/settings/index.tsx`, `app/settings/profile.tsx`

Cog on your own profile opens settings: rows for **Edit profile**, and **Log
out** (danger, with a confirm). Edit profile: username field, and profile
image. **Make the avatar a real upload**, consistent with everything else:
reuse the recipe image upload ticket endpoint (`POST /recipes/images/upload-url`
issues a key under `recipes/<userId>/`, which is publicly readable), PUT the
bytes, then `PATCH /users/me` with `profileImage` set to the resulting public
URL. If deriving the public URL from the storage key is not possible without
guessing, fall back to the plain URL field and say so in the UI — do not
invent a URL format.

### Recipe detail — `app/recipe/[id].tsx`

Hero image 4:3, title `displayXl`, owner row (avatar + username, tappable),
category chips, then the **nutrition readout block**: a slab with the calorie
figure in `readoutXl` and three macro columns (P / C / F) in `readoutLg`, each
under a `type.label` caption. Then ingredients with dotted leaders, then
instructions. Sticky bottom bar: **Start cooking** (primary, → `/cook/<id>`)
and a save toggle. Owner also gets Edit and Delete (confirm) in an overflow.

### Recipe editor — `app/recipe/new.tsx` and `app/recipe/[id]/edit.tsx`

Both render one `RecipeForm`. Sections in order: image, title, description,
categories, ingredients, instructions.
- Image: a horizontal row of the 7 presets from `GET /recipes/image-presets`
  (selected gets an accent ring) plus an **Upload your own** tile that opens
  `expo-image-picker`. Chosen preset ⇒ `imageKey: 'preset:<slug>'`; chosen
  upload ⇒ upload then `imageKey: storageKey`. No choice on create ⇒ omit
  `imageKey` entirely (server defaults it).
- Ingredients: rows of `product · quantity · unit`, each removable. "Add
  ingredient" opens a `ProductPickerSheet` — a search over `GET /products` —
  then a quantity field and a unit segmented control. **There is no free-text
  ingredient.** Include a "Can't find it? Add a product" affordance that opens
  a small form (`POST /products`: name + the four per-100g values + optional
  density and grams-per-piece), because the catalog is not exhaustive and the
  form is otherwise a dead end.
- Validation is client-side before submit and mirrors the server: title 1–150,
  description 1–2000, instructions 1–10000, at least one ingredient, quantity
  > 0. Show field-level errors, do not rely on a 422 alert.

### Auth — `app/(auth)/sign-in.tsx`, `app/(auth)/sign-up.tsx`

The one place the display face gets to be large: the Melo wordmark at
`displayXl`, a one-line positioning statement ("Cook it. Log it. Keep it."),
then the form. Fields with `autoComplete`/`textContentType`/`keyboardType` set
correctly, password `secureTextEntry` with a show/hide toggle, submit disabled
while pending, server error shown above the button in `danger`. Link across to
the other screen at the bottom.

---

## 6. Feature components — `src/features/`

`posts/PostCard.tsx` — props `{ post: Post; variant?: 'feed' | 'detail';
onOpenComments(postId): void }`. Composes `PostImageCarousel`, `CookedStamp`,
`ReactionBar`. Double-tap the image applies ❤️ (with `expo-haptics`
`impactAsync(Light)`) and shows a brief centred heart.

`posts/PostImageCarousel.tsx` — horizontal paging `FlatList` at 1:1, page dots
only when `images.length > 1`, index state lifted so the owner's per-image
delete acts on the visible one.

`posts/CookedStamp.tsx` — the signature strip. Props `{ recipe: Post['recipe'] }`.
Tapping the title opens `/recipe/<id>`; the bookmark toggles the save with an
optimistic update.

`posts/ReactionBar.tsx` — renders one pill per emoji present in
`reactions.byEmoji` (emoji + mono count), the viewer's own pill outlined in
`accent`. A `+` button expands the five-emoji picker inline (animated width or
opacity, no modal). Tapping your current emoji clears it
(`DELETE /posts/:id/reactions`); tapping another swaps it
(`PUT /posts/:id/reactions`). Optimistic, reconciled from the server response.
Emoji set: ❤️ 😋 🔥 👍 😍.

`posts/CommentsSheet.tsx` — the Instagram-style bottom sheet. Props
`{ postId: string | null; onClose(): void }` — non-null postId means open.
Paginated list, newest-first as the server returns them, `UserRow`-ish rows
with avatar, username, content, relative time. Swipe-to-delete is out of scope;
use a long-press → confirm. Delete is offered when you wrote the comment **or**
you own the post. Composer pinned at the bottom: avatar + input + a **Post**
text button that is disabled while empty. Optimistic append.

`recipes/RecipeTile.tsx` — grid tile: square image, title (2 lines,
`displaySm`), kcal in `readoutSm`.
`recipes/NutritionPanel.tsx` — the readout slab described above.
`recipes/IngredientRow.tsx` — the dotted leader row.
`recipes/RecipeForm.tsx`, `recipes/ProductPickerSheet.tsx`,
`recipes/CreateProductSheet.tsx`, `recipes/RecipeImagePicker.tsx`,
`recipes/CategoryPicker.tsx`.

`collections/CollectionPickerSheet.tsx` — props `{ recipeId, visible, onClose }`.
Lists your collections with a checkbox each, plus an inline "New collection"
row that creates and immediately adds. Adding also saves to the cookbook
server-side; reflect that in the cache.

`users/UserRow.tsx`, `users/FollowButton.tsx`, `users/ProfileView.tsx`,
`users/ProfileGrid.tsx`.

---

## 7. File ownership

Do not create or edit a file outside your own list. If you need something from
another agent's area, code against the contract in this document.

| Owner | Files |
| --- | --- |
| **already done** | `src/theme/*`, `src/api/{tokens,client,schemas,keys,paging,users,recipes}.ts` |
| **A** | `src/api/{posts,cookbook,catalog}.ts`, `src/lib/upload.ts`, `src/auth/AuthContext.tsx` |
| **B** | `src/ui/*`, `src/lib/format.ts` |
| **C** | `src/features/posts/*`, `app/(tabs)/index.tsx`, `app/post/[id].tsx`, `app/compose/*` |
| **D** | `src/features/recipes/*`, `app/recipe/*`, `app/cook/[id].tsx` |
| **E** | `app/_layout.tsx`, `app/(auth)/*`, `app/(tabs)/{_layout,discover,cookbook,profile}.tsx`, `app/user/*`, `app/collection/[id].tsx`, `app/settings/*`, `src/features/{users,collections}/*` |

Finish by running `npx tsc --noEmit` and fixing every error in your own files.

---

## 8. Built contracts (verified — code against these exactly)

Everything below exists and typechecks. Import with named imports from the
exact paths shown. Do not re-implement any of it.

### `src/ui/*` — all named exports, one per file

```ts
Text     ({ variant?: keyof typeof type = 'body', color?: keyof typeof colors = 'text',
            align?, style?, ...RNTextProps })                       // src/ui/Text.tsx
Readout  ({ variant?: 'readoutXl'|'readoutLg'|'readout'|'readoutSm', color?, align?, style? })
                                                                    // also src/ui/Text.tsx
Button   ({ title, onPress, variant?: 'primary'|'secondary'|'ghost'|'danger',
            size?: 'md'|'lg', loading?, disabled?, icon?, stretch? })
IconButton ({ name, onPress, label, size?, color?, disabled? })      // label is required
Avatar   ({ uri, username, size? = 36, ring? })
Chip     ({ label, selected?, onPress?, size?: 'sm'|'md' })
Field    ({ label, value, onChangeText, error?, hint?, multiline?, rightSlot?,
            ...TextInputProps })
Screen   ({ children, edges? = ['top'], style? })
ScreenHeader ({ title?, onBack?, right?, subtitle? })
Sheet    ({ visible, onClose, title?, heightRatio? = 0.85, children, footer? })
EmptyState ({ title, body?, actionLabel?, onAction?, icon? })
StateView ({ isLoading, error?, onRetry?, children, emptyWhen?, empty? })
Divider  ()
SegmentedControl ({ options: {value,label}[], value, onChange })
ConfirmDialog ({ visible, title, body?, confirmLabel, onConfirm, onCancel, destructive? })
```

`icon` / `name` props are typed `keyof typeof Feather.glyphMap`
(`import { Feather } from '@expo/vector-icons'`).

**Use `Readout` for every number in the UI.** That is the design.

### `src/lib/format.ts`

```ts
relativeTime(iso: string): string
formatQuantity(quantity: number, unit: Unit): string      // "45 g", "1.5 cup"
formatCount(n: number): string                            // "1,234" / "12.5k"
formatMacros(n: Nutrition): string                        // "512 KCAL · 18 P · 44 C · 27 F"
UNIT_LABELS: Record<Unit, string>
UNIT_OPTIONS: { value: Unit; label: string }[]
```

### `src/lib/upload.ts`

```ts
uploadImage(localUri, requestTicket): Promise<string>     // resolves to storageKey
uploadImages(localUris, requestTicket, onProgress?): Promise<string[]>   // sequential
```
Pass `requestPostImageUpload` (src/api/posts.ts) or `requestRecipeImageUpload`
(src/api/recipes.ts) as `requestTicket`.

### `src/auth/AuthContext.tsx`

```ts
AuthProvider({ children })          // must be mounted INSIDE QueryClientProvider
useAuth(): { session, signIn(email,password), signUp(username,email,password),
             signOut(), refreshUser() }
useCurrentUser(): Me | null
// session: { status:'loading' } | { status:'signedOut' } | { status:'signedIn', user: Me }
```

### `src/api/*` — hooks

```
users.ts     useProfile(userId?) useUserSearch(search) useFollowers(userId)
             useFollowing(userId) useUserPosts(userId?) useUserRecipes(userId?)
             useUpdateProfile() useToggleFollow(userId)   // mutate(isFollowing: boolean)
             register/login/logout/fetchMe/fetchProfile

recipes.ts   useRecipeSearch(search, categorySlugs, sort) useRecipe(recipeId?)
             useImagePresets() useCreateRecipe() useUpdateRecipe(recipeId)
             useDeleteRecipe() requestRecipeImageUpload() setRecipeSaved()
             types RecipeInput, IngredientInput, RecipeSort

posts.ts     useFeed() usePost(postId?) useCreatePost() useDeletePost()
             useDeletePostImage(postId) useComments(postId?) useAddComment(postId)
             useDeleteComment(postId) useSetReaction(postId) useClearReaction(postId)
             requestPostImageUpload() updatePostEverywhere() setSavedEverywhere()

cookbook.ts  useCookbook(categorySlugs) useToggleSave()   // mutate({recipeId, saved})
             useCollections() useCreateCollection()       // mutate(name)
             useRenameCollection()                        // mutate({collectionId, name})
             useDeleteCollection()                        // mutate(collectionId)
             useCollectionRecipes(collectionId?)
             useAddRecipeToCollection(collectionId)       // mutate(recipeId)
             useRemoveRecipeFromCollection(collectionId)  // mutate(recipeId)

catalog.ts   useCategories() useProductSearch(search) useCreateProduct()

paging.ts    usePagedQuery({queryKey, fetchPage, enabled?})  flattenPages(data)
client.ts    request() ApiError errorMessage(error)
keys.ts      keys.*
schemas.ts   all response types: Me, Post, Comment, RecipeDetail, RecipeSummary,
             SavedRecipe, Collection, Product, Category, PublicProfile,
             UserSummary, PublicUser, Nutrition, Unit, ImagePreset, UNITS
```

Reactions are already optimistic inside the hooks — do not add a second layer
of optimistic state in a component.

`useToggleSave()` already patches `recipe.isSaved` across every cached post.
Call it and render from the query data; do not hold local saved state.
