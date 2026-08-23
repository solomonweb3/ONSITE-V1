import React, { useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ProfileStackParams } from '../navigation/types';
import { colors, font, space } from '../theme';
import { IconButton } from '../components/ui';
import { ChevronLeft } from '../components/icons';
import { useStore } from '../store';

type Props = NativeStackScreenProps<ProfileStackParams, 'Notifications'>;

export function NotificationsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { notifications, markAllRead } = useStore();

  // Mark read when the screen is left.
  useEffect(() => () => markAllRead(), []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <View style={{ flex: 1, backgroundColor: colors.white, paddingTop: insets.top }}>
      <View style={styles.topBar}>
        <IconButton onPress={() => navigation.goBack()} style={{ marginLeft: -6 }}>
          <ChevronLeft />
        </IconButton>
      </View>
      <View style={{ paddingHorizontal: space.screenX, paddingTop: 12, paddingBottom: 8 }}>
        <Text style={styles.title}>Notifications</Text>
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: space.screenX, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {notifications.map((n) => (
          <View key={n.id} style={styles.row}>
            <View style={{ gap: 3, flex: 1 }}>
              <Text style={styles.rowTitle}>{n.title}</Text>
              <Text style={styles.rowBody}>{n.body}</Text>
              <Text style={styles.rowTime}>{n.time}</Text>
            </View>
            {n.unread ? <View style={styles.unread} /> : null}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: { paddingHorizontal: space.screenX, paddingTop: 8, height: 40, justifyContent: 'center' },
  title: { fontFamily: font.bold, fontSize: 22, color: colors.black },
  row: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.grey100,
  },
  rowTitle: { fontFamily: font.semibold, fontSize: 14, color: colors.black },
  rowBody: { fontFamily: font.regular, fontSize: 13, color: colors.grey600 },
  rowTime: { fontFamily: font.mono, fontSize: 10, color: colors.grey300 },
  unread: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.black, marginTop: 4 },
});
