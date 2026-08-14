import {
  BricolageGrotesque_700Bold,
  BricolageGrotesque_800ExtraBold,
} from '@expo-google-fonts/bricolage-grotesque';
import { DMMono_400Regular, DMMono_500Medium } from '@expo-google-fonts/dm-mono';
import {
  PublicSans_400Regular,
  PublicSans_500Medium,
  PublicSans_600SemiBold,
  PublicSans_700Bold,
} from '@expo-google-fonts/public-sans';
import { useFonts } from 'expo-font';

import { fonts } from './theme';

/**
 * Maps the role names in theme.ts to real font files. Roles are registered
 * under their role name, so swapping a typeface means editing only this map.
 */
const fontMap = {
  [fonts.display]: BricolageGrotesque_700Bold,
  [fonts.displayHeavy]: BricolageGrotesque_800ExtraBold,
  [fonts.body]: PublicSans_400Regular,
  [fonts.bodyMedium]: PublicSans_500Medium,
  [fonts.bodySemi]: PublicSans_600SemiBold,
  [fonts.bodyBold]: PublicSans_700Bold,
  [fonts.mono]: DMMono_400Regular,
  [fonts.monoMedium]: DMMono_500Medium,
};

export function useAppFonts(): boolean {
  const [loaded, error] = useFonts(fontMap);
  // A font that fails to download should not block the app behind a blank
  // screen forever; the system face is an acceptable fallback.
  return loaded || error !== null;
}
