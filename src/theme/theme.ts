/**
 * Melo design tokens. This is the single file to edit to restyle the app.
 *
 * Direction: "the readout". Melo is not a photo app that happens to show
 * food, it is a cooking log where every number is real - grams, calories,
 * macros, counts. So numbers are always set in a monospaced face on a
 * recessed slab, like a kitchen scale display, and everything around them
 * stays quiet. Paper ground, ink text, one hot accent (saffron) for things
 * you press, one deep accent (basil) for things you scan.
 */

/** Raw colour values. Swap these to re-skin the whole app. */
const palette = {
  paper: '#F5F5F1',
  card: '#FFFFFF',
  slab: '#EEEEE8',

  ink: '#14161A',
  inkMuted: '#6E7279',
  inkFaint: '#9DA1A7',

  hairline: '#E3E3DC',
  hairlineStrong: '#D2D2C9',

  saffron: '#DE9412',
  saffronPressed: '#C07E08',
  saffronTint: '#FBF0D7',

  basil: '#2E5B3E',
  basilTint: '#E3EDE5',

  crimson: '#B8352B',
  crimsonTint: '#FBE8E6',

  white: '#FFFFFF',
  black: '#000000',
} as const;

export const colors = {
  /** App background. */
  ground: palette.paper,
  /** Raised content: cards, sheets, inputs. */
  surface: palette.card,
  /** Recessed content: readout slabs, disabled fields, image placeholders. */
  slab: palette.slab,

  text: palette.ink,
  textMuted: palette.inkMuted,
  textFaint: palette.inkFaint,
  textInverse: palette.white,

  line: palette.hairline,
  lineStrong: palette.hairlineStrong,

  accent: palette.saffron,
  accentPressed: palette.saffronPressed,
  accentTint: palette.saffronTint,

  deep: palette.basil,
  deepTint: palette.basilTint,

  danger: palette.crimson,
  dangerTint: palette.crimsonTint,

  /** Scrims over photos and behind modals. */
  scrim: 'rgba(20, 22, 26, 0.55)',
  scrimSoft: 'rgba(20, 22, 26, 0.28)',
} as const;

/**
 * Cook mode inverts the app. You prop the phone against a jar on a counter
 * under kitchen lights, so it needs a dark ground and oversized type.
 */
export const cookColors = {
  ground: '#101317',
  surface: '#191D22',
  slab: '#22272E',
  text: '#F2F1EC',
  textMuted: '#9AA1AA',
  line: '#2C3138',
  accent: '#F0AB2C',
  done: '#5E9C72',
} as const;

export const fonts = {
  /** Bricolage Grotesque. Titles only, always tight. */
  display: 'Display',
  displayHeavy: 'DisplayHeavy',
  /** Public Sans. Everything you read as a sentence. */
  body: 'Body',
  bodyMedium: 'BodyMedium',
  bodySemi: 'BodySemi',
  bodyBold: 'BodyBold',
  /** DM Mono. Every number, without exception. */
  mono: 'Mono',
  monoMedium: 'MonoMedium',
} as const;

/**
 * Named text styles. Components pick one of these rather than assembling
 * font/size/spacing by hand, so the scale stays a scale.
 */
export const type = {
  displayXl: { fontFamily: fonts.displayHeavy, fontSize: 34, lineHeight: 37, letterSpacing: -1.1 },
  displayLg: { fontFamily: fonts.displayHeavy, fontSize: 26, lineHeight: 29, letterSpacing: -0.8 },
  displayMd: { fontFamily: fonts.display, fontSize: 20, lineHeight: 24, letterSpacing: -0.45 },
  displaySm: { fontFamily: fonts.display, fontSize: 16, lineHeight: 20, letterSpacing: -0.25 },

  bodyLg: { fontFamily: fonts.body, fontSize: 16, lineHeight: 23 },
  body: { fontFamily: fonts.body, fontSize: 14.5, lineHeight: 21 },
  bodySm: { fontFamily: fonts.body, fontSize: 13, lineHeight: 19 },

  strong: { fontFamily: fonts.bodySemi, fontSize: 14.5, lineHeight: 21 },
  strongSm: { fontFamily: fonts.bodySemi, fontSize: 13, lineHeight: 19 },

  /** Eyebrows and section markers. Always uppercase. */
  label: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.9,
    textTransform: 'uppercase' as const,
  },

  /** The scale display. */
  readoutXl: { fontFamily: fonts.monoMedium, fontSize: 30, lineHeight: 32, letterSpacing: -1 },
  readoutLg: { fontFamily: fonts.monoMedium, fontSize: 19, lineHeight: 22, letterSpacing: -0.4 },
  readout: { fontFamily: fonts.monoMedium, fontSize: 14, lineHeight: 18, letterSpacing: -0.1 },
  readoutSm: { fontFamily: fonts.mono, fontSize: 11.5, lineHeight: 14, letterSpacing: 0.1 },
} as const;

export const space = {
  hair: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  xxxl: 40,
} as const;

export const radius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 22,
  pill: 999,
} as const;

/** Elevation is used sparingly: only for things that float over content. */
export const shadow = {
  float: {
    shadowColor: palette.black,
    shadowOpacity: 0.14,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  lift: {
    shadowColor: palette.black,
    shadowOpacity: 0.07,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
} as const;

/**
 * Categorical hues for the macro split bar. Deliberately NOT `accent` or
 * `deep`: those two mean "pressable" and "scannable" everywhere else in the
 * app, and a chart hue that looks like an affordance is a lie. Validated
 * against the slab surface for lightness, chroma, colour-vision separation
 * and 3:1 contrast - re-run that check before changing any of them.
 */
export const macroColors = {
  protein: '#00805F',
  carbs: '#B8760A',
  fat: '#7A4A8C',
} as const;

/** Minimum tap target. Used for icon buttons that look smaller than they are. */
export const HIT_SLOP = { top: 10, bottom: 10, left: 10, right: 10 } as const;
