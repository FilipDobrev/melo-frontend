import { Redirect } from 'expo-router';

// This tab is never actually shown: the tab bar's centre button intercepts
// the press (see _layout.tsx) and navigates to the recipe picker instead.
// The redirect here is only a safety net if this route is ever reached
// directly (e.g. a stale deep link).
export default function PostTabPlaceholder() {
  return <Redirect href="/post/pick" />;
}
