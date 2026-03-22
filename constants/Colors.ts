import { Platform } from 'react-native';

export const Colors = {
  primary: '#1B3A5C',
  primaryLight: '#2A5080',
  primaryDark: '#0F2440',
  accent: '#D4AF37',
  accentLight: '#E5CC60',
  background: '#F8F8F6',
  /** Main scroll/safe-area fill: transparent on web so ColorBends + root tint show through. */
  appCanvas: Platform.select({ web: 'transparent', default: '#F8F8F6' }) ?? '#F8F8F6',
  surface: '#FFFFFF',
  surfaceElevated: '#F0F2F4',
  text: '#16233B',
  textSecondary: '#5A6B80',
  textTertiary: '#8E99A8',
  border: '#DDE2E8',
  borderLight: '#EDF0F3',
  heart: '#D94F4F',
  ratingGreen: '#1B3A5C',
  ratingYellow: '#D4AF37',
  ratingRed: '#C45B4A',
  white: '#FFFFFF',
  black: '#000000',
  overlay: 'rgba(0, 0, 0, 0.4)',
  shadow: 'rgba(0, 0, 0, 0.08)',
  placeholder: '#E0E0E0',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const FontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  display: 36,
};

export const BorderRadius = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  full: 999,
};

/** Gilda Display for editorial headings; Hanken Grotesk for all UI/body text. */
export const Fonts = {
  display: 'GildaDisplay_400Regular',
  heading: 'HankenGrotesk_700Bold',
  headingSemiBold: 'HankenGrotesk_600SemiBold',
  body: 'HankenGrotesk_400Regular',
  bodyLight: 'HankenGrotesk_300Light',
  bodyMedium: 'HankenGrotesk_500Medium',
  bodySemiBold: 'HankenGrotesk_600SemiBold',
  bodyBold: 'HankenGrotesk_700Bold',
  bodyExtraBold: 'HankenGrotesk_800ExtraBold',
};
