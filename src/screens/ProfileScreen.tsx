import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ProfileStackParams } from '../navigation/types';
import { colors, font, space } from '../theme';
import { ChevronRight, Bell } from '../components/icons';
import { useStore } from '../store';

type Props = NativeStackScreenProps<ProfileStackParams, 'Profile'>;

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={{ gap: 2 }}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function Row({ label, value, onPress }: { label: string; value?: string; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.grey50 }]}>
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        {value ? <Text style={styles.rowValue}>{value}</Text> : null}
        <ChevronRight size={18} color={colors.grey400} />
      </View>
    </Pressable>
  );
}

export function ProfileScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { user, unreadCount, signOut } = useStore();

  return (
    <View style={{ flex: 1, backgroundColor: colors.white, paddingTop: insets.top }}>
      <View style={styles.topBar}>
        <Pressable onPress={() => navigation.navigate('Notifications')} hitSlop={10}>
          <View>
            <Bell size={22} color={colors.black} />
            {unreadCount > 0 ? <View style={styles.badgeDot} /> : null}
          </View>
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        <View style={styles.identity}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user.initials}</Text>
          </View>
          <Text style={styles.name}>{user.name}</Text>
          <Text style={styles.handle}>{user.handle}</Text>
        </View>

        <View style={{ paddingHorizontal: space.screenX, paddingTop: 8, paddingBottom: 12 }}>
          <View style={styles.stats}>
            <Stat value="12" label="Activations" />
            <Stat value="94%" label="Completion" />
            <Stat value="38" label="Items this mo." />
          </View>
        </View>

        <View style={{ paddingHorizontal: space.screenX, paddingTop: 8 }}>
          <Text style={styles.section}>SETTINGS</Text>
        </View>
        <View style={{ paddingHorizontal: space.screenX }}>
          {!user.profileComplete ? (
            <Row label="Complete your profile" value="1 step" onPress={() => navigation.navigate('CompleteProfile')} />
          ) : null}
          <Row label="Notifications" value={unreadCount > 0 ? `${unreadCount} new` : undefined} onPress={() => navigation.navigate('Notifications')} />
          <Row label="Account" onPress={() => navigation.navigate('Account')} />
          <Pressable onPress={signOut} style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.grey50 }]}>
            <Text style={[styles.rowLabel, { color: colors.red }]}>Sign out</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: space.screenX, paddingTop: 8, height: 40, alignItems: 'center' },
  badgeDot: { position: 'absolute', top: -1, right: -1, width: 8, height: 8, borderRadius: 4, backgroundColor: colors.red },
  identity: { alignItems: 'center', paddingTop: 24, paddingBottom: 16, gap: 8 },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.black, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: font.bold, fontSize: 24, color: colors.white },
  name: { fontFamily: font.bold, fontSize: 19, color: colors.black },
  handle: { fontFamily: font.mono, fontSize: 12, color: colors.grey600 },
  stats: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: colors.grey50, borderRadius: 12, padding: 16 },
  statValue: { fontFamily: font.bold, fontSize: 17, color: colors.black },
  statLabel: { fontFamily: font.mono, fontSize: 10, color: colors.grey600 },
  section: { fontFamily: font.monoMedium, fontSize: 10, color: colors.grey600, letterSpacing: 0.4, marginBottom: 4 },
  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.grey100,
  },
  rowLabel: { fontFamily: font.medium, fontSize: 15, color: colors.black },
  rowValue: { fontFamily: font.mono, fontSize: 11, color: colors.grey600 },
});
