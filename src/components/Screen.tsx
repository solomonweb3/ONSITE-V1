import React from 'react';
import { View, StyleSheet, ScrollView, StyleProp, ViewStyle, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, space } from '../theme';
import { ScreenTitle, Subtitle, IconButton } from './ui';
import { ChevronLeft } from './icons';

export function Screen({
  children,
  scroll = false,
  padded = true,
  style,
  contentStyle,
}: {
  children: React.ReactNode;
  scroll?: boolean;
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
}) {
  const insets = useSafeAreaInsets();
  const base: StyleProp<ViewStyle> = [
    { paddingTop: insets.top, backgroundColor: colors.white, flex: 1 },
    style,
  ];
  const inner: StyleProp<ViewStyle> = [padded && { paddingHorizontal: space.screenX }, contentStyle];

  if (scroll) {
    return (
      <View style={base}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[inner, { paddingBottom: 32 }]}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      </View>
    );
  }
  return <View style={base}><View style={[{ flex: 1 }, inner]}>{children}</View></View>;
}

export function Header({
  title,
  subtitle,
  onBack,
  right,
  large = false,
}: {
  title?: string;
  subtitle?: string;
  onBack?: () => void;
  right?: React.ReactNode;
  large?: boolean;
}) {
  return (
    <View style={styles.header}>
      <View style={styles.headerRow}>
        {onBack ? (
          <IconButton onPress={onBack} style={styles.back}>
            <ChevronLeft />
          </IconButton>
        ) : null}
        {title ? <ScreenTitle style={large ? undefined : { fontSize: 24 }}>{title}</ScreenTitle> : <View />}
        <View style={styles.right}>{right}</View>
      </View>
      {subtitle ? <Subtitle style={{ marginTop: 4 }}>{subtitle}</Subtitle> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop: 12, paddingBottom: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  back: { marginLeft: -6, marginRight: 2 },
  right: { marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 12 },
});
