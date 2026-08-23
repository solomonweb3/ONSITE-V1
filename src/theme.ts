// ONSITE design tokens — derived from the Figma "Foundations" page.
// Sans (Hanken Grotesk) for titles/labels, Mono (IBM Plex Mono) for metadata/badges.

export const colors = {
  white: '#FFFFFF',
  black: '#0D0D0D',
  grey50: '#FAFAFA', // subtle fill panels
  grey100: '#F2F2F2', // hairline borders, badge bg, progress track
  grey200: '#E5E5E5',
  grey300: '#C7C7C7', // checkbox border, disabled/inactive tab
  grey400: '#B0B0B0',
  grey600: '#6B6B6B', // secondary text
  amber: '#B8860B', // LIVE dot
  green: '#2E7D32', // COMPLETED / PAID dot
  success: '#1C6B33', // approved / success meta text
  red: '#C0392B', // reject / destructive
  pendingAmber: '#A6800D', // "required" / pending accent
  approveBg: '#BFEDC9',
  approveText: '#1A5929',
  rejectBg: '#F7CCCC',
  rejectText: '#8C1F1F',
  overlay: 'rgba(13,13,13,0.45)',
} as const;

export const font = {
  regular: 'HankenGrotesk_400Regular',
  medium: 'HankenGrotesk_500Medium',
  semibold: 'HankenGrotesk_600SemiBold',
  bold: 'HankenGrotesk_700Bold',
  mono: 'IBMPlexMono_400Regular',
  monoMedium: 'IBMPlexMono_500Medium',
} as const;

// Type ramp (fontFamily + size + reasonable line height)
export const type = {
  screenTitle: { fontFamily: font.bold, fontSize: 24, color: colors.black },
  sectionTitle: { fontFamily: font.bold, fontSize: 20, color: colors.black },
  cardTitle: { fontFamily: font.semibold, fontSize: 16, color: colors.black },
  body: { fontFamily: font.regular, fontSize: 15, color: colors.black },
  subtitle: { fontFamily: font.regular, fontSize: 13, color: colors.grey600 },
  label: { fontFamily: font.semibold, fontSize: 13, color: colors.black },
  meta: { fontFamily: font.mono, fontSize: 11, color: colors.grey600, letterSpacing: 0.22 },
  metaStrong: { fontFamily: font.monoMedium, fontSize: 11, color: colors.black, letterSpacing: 0.22 },
  tab: { fontFamily: font.regular, fontSize: 11, color: colors.grey600 },
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 20,
  round: 999,
} as const;

export const space = {
  screenX: 24,
  gap: 12,
} as const;
