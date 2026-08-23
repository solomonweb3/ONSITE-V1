import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { colors, font } from '../theme';

// Figma tab bar: 84px, white, top hairline; each item = 6px dot + 11px label.
// Active => black filled dot + black semibold label; inactive => grey dot + grey label.
export function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bar, { paddingBottom: insets.bottom || 12, height: 72 + (insets.bottom || 12) }]}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label = (options.tabBarLabel as string) ?? options.title ?? route.name;
        const focused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
        };

        return (
          <Pressable key={route.key} onPress={onPress} style={styles.item}>
            <View style={[styles.dot, { backgroundColor: focused ? colors.black : colors.grey200 }]} />
            <Text
              style={[
                styles.label,
                { color: focused ? colors.black : colors.grey600, fontFamily: focused ? font.semibold : font.regular },
              ]}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.grey100,
    paddingTop: 14,
  },
  item: { flex: 1, alignItems: 'center', justifyContent: 'flex-start', gap: 6, maxWidth: 125 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  label: { fontSize: 11 },
});
