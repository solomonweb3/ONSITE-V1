import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ViewStyle,
  TextStyle,
  StyleProp,
  ActivityIndicator,
} from 'react-native';
import { colors, font, radius, type as t } from '../theme';

/* ---------------------------------- Text ---------------------------------- */

type TxtProps = React.ComponentProps<typeof Text> & { style?: StyleProp<TextStyle> };
const make = (base: TextStyle) => ({ style, children, ...rest }: TxtProps) =>
  (
    <Text {...rest} style={[base, style]}>
      {children}
    </Text>
  );

export const ScreenTitle = make(t.screenTitle);
export const SectionTitle = make(t.sectionTitle);
export const CardTitle = make(t.cardTitle);
export const Body = make(t.body);
export const Subtitle = make(t.subtitle);
export const Label = make(t.label);
export const Meta = make(t.meta);
export const MetaStrong = make(t.metaStrong);

/* --------------------------------- Button --------------------------------- */

type ButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Button({ label, onPress, variant = 'primary', disabled, loading, style }: ButtonProps) {
  const isPrimary = variant === 'primary';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.btn,
        isPrimary ? styles.btnPrimary : styles.btnSecondary,
        (disabled || loading) && { opacity: 0.45 },
        pressed && { opacity: 0.85 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? colors.white : colors.black} />
      ) : (
        <Text style={[styles.btnLabel, { color: isPrimary ? colors.white : colors.black }]}>{label}</Text>
      )}
    </Pressable>
  );
}

/* ------------------------------- StatusBadge ------------------------------ */

export type BadgeStatus = 'Live' | 'Completed' | 'Paid' | 'Pending' | 'Rejected' | 'Approved';

const badgeMap: Record<BadgeStatus, { label: string; dot: string }> = {
  Live: { label: 'LIVE', dot: colors.amber },
  Completed: { label: 'COMPLETED', dot: colors.green },
  Paid: { label: 'PAID', dot: colors.green },
  Pending: { label: 'PENDING', dot: colors.grey400 },
  Rejected: { label: 'REJECTED', dot: colors.red },
  Approved: { label: 'APPROVED', dot: colors.green },
};

export function StatusBadge({ status }: { status: BadgeStatus }) {
  const { label, dot } = badgeMap[status];
  return (
    <View style={styles.badge}>
      <View style={[styles.badgeDot, { backgroundColor: dot }]} />
      <Text style={styles.badgeLabel}>{label}</Text>
    </View>
  );
}

/* ------------------------------- ProgressBar ------------------------------ */

export function ProgressBar({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <View style={styles.track}>
      <View style={[styles.fill, { width: `${pct}%` }]} />
    </View>
  );
}

/* ---------------------------------- Card ---------------------------------- */

export function Card({
  children,
  style,
  onPress,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
}) {
  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && { opacity: 0.7 }, style]}>
        {children}
      </Pressable>
    );
  }
  return <View style={[styles.card, style]}>{children}</View>;
}

/* --------------------------------- Divider -------------------------------- */

export function Divider({ style }: { style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.divider, style]} />;
}

/* -------------------------------- IconButton ------------------------------ */

export function IconButton({
  children,
  onPress,
  style,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable onPress={onPress} hitSlop={8} style={({ pressed }) => [pressed && { opacity: 0.5 }, style]}>
      {children}
    </Pressable>
  );
}

/* ------------------------------- SelectCard ------------------------------- */

export function SelectCard({
  title,
  subtitle,
  onPress,
  selected,
}: {
  title: string;
  subtitle?: string;
  onPress?: () => void;
  selected?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.selectCard,
        selected && { borderColor: colors.black },
        pressed && { backgroundColor: colors.grey50 },
      ]}
    >
      <Text style={styles.selectTitle}>{title}</Text>
      {subtitle ? <Text style={styles.selectSub}>{subtitle}</Text> : null}
    </Pressable>
  );
}

/* --------------------------------- Field ---------------------------------- */

import { TextInput, TextInputProps } from 'react-native';

export function Field({
  label,
  style,
  ...props
}: TextInputProps & { label?: string }) {
  return (
    <View style={{ gap: 8, width: '100%' }}>
      {label ? <Text style={styles.fieldLabel}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={colors.grey400}
        style={[styles.field, style]}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  btn: {
    height: 48,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  btnPrimary: { backgroundColor: colors.black },
  btnSecondary: { backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.black },
  btnLabel: { fontFamily: font.semibold, fontSize: 15 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.grey100,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  badgeDot: { width: 6, height: 6, borderRadius: 3 },
  badgeLabel: { fontFamily: font.monoMedium, fontSize: 11, color: colors.black, letterSpacing: 0.22 },
  track: { height: 6, borderRadius: 3, backgroundColor: colors.grey100, overflow: 'hidden', width: '100%' },
  fill: { height: 6, borderRadius: 3, backgroundColor: colors.black },
  card: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.grey100,
    borderRadius: radius.md,
    padding: 16,
    gap: 10,
  },
  divider: { height: 1, backgroundColor: colors.grey100, width: '100%' },
  selectCard: {
    width: '100%',
    borderWidth: 1.5,
    borderColor: colors.grey300,
    borderRadius: 10,
    padding: 18,
    gap: 4,
    backgroundColor: colors.white,
  },
  selectTitle: { fontFamily: font.semibold, fontSize: 16, color: colors.black },
  selectSub: { fontFamily: font.regular, fontSize: 13, color: colors.grey600 },
  fieldLabel: { fontFamily: font.medium, fontSize: 13, color: colors.black },
  field: {
    width: '100%',
    height: 50,
    borderWidth: 1.5,
    borderColor: colors.grey200,
    borderRadius: 10,
    paddingHorizontal: 16,
    fontFamily: font.regular,
    fontSize: 15,
    color: colors.black,
  },
});
