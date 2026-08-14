import { useWindowDimensions } from 'react-native';

/**
 * On a phone the app is the width of the screen. On a desktop browser a
 * full-bleed feed means metre-wide photographs and line lengths nothing can
 * read, so content is capped and centred instead - the app keeps its phone
 * proportions and the browser just gets margins.
 *
 * 560 is chosen off the body text: at 14.5px Public Sans it lands a caption
 * around 70 characters a line, which is the comfortable end of the range,
 * and it keeps a square feed photo to a size you can take in at a glance.
 */
export const MAX_CONTENT_WIDTH = 560;

/**
 * The width components should lay out against - never the raw window width.
 * Anything sizing itself off the viewport (image carousels, grid tiles) must
 * use this, or it will overflow the centred column on a wide screen.
 */
export function useContentWidth(): number {
  const { width } = useWindowDimensions();
  return Math.min(width, MAX_CONTENT_WIDTH);
}
