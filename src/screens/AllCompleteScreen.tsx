import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParams } from '../navigation/types';
import { colors, font, space } from '../theme';
import { Body, IconButton, Button } from '../components/ui';
import { ChevronLeft, Check } from '../components/icons';
import { useStore } from '../store';

type Props = NativeStackScreenProps<HomeStackParams, 'AllComplete'>;
const times = ['9:12 AM', '9:30 AM', '9:38 AM', '9:45 AM', '9:52 AM'];

export function AllCompleteScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { activation, progressOf } = useStore();
  const [tab, setTab] = useState<'client' | 'my'>('client');
  const a = activation(route.params.activationId);
  if (!a) return null;

  const fullyApproved = progressOf(a.id) === 100;
  const items = a.items.filter((i) => i.owner === tab);

  return (
    <View style={{ flex: 1, backgroundColor: colors.white, paddingTop: insets.top }}>
      <View style={styles.topBar}>
        <IconButton onPress={() => navigation.goBack()} style={{ marginLeft: -6 }}>
          <ChevronLeft />
        </IconButton>
      </View>

      <View style={styles.head}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={styles.title}>{a.title}</Text>
          <View style={styles.badge}>
            <View style={styles.badgeDot} />
            <Text style={styles.badgeLabel}>{fullyApproved ? 'ALL APPROVED' : 'ALL ITEMS DELIVERED'}</Text>
          </View>
        </View>
        <Text style={styles.subtitle}>{a.subtitle}</Text>
      </View>

      <View style={{ paddingHorizontal: space.screenX, paddingBottom: 8, paddingTop: 4 }}>
        <View style={styles.banner}>
          <Text style={styles.bannerTitle}>{fullyApproved ? `Approved by ${a.title}` : 'Waiting on brand to review'}</Text>
          <Text style={styles.bannerSub}>{fullyApproved ? 'All items approved by brand' : 'Client notified 9:41 AM'}</Text>
        </View>
      </View>

      <View style={styles.tabs}>
        <Pressable onPress={() => setTab('client')}>
          <Body style={[styles.tab, tab === 'client' ? styles.tabActive : styles.tabInactive]}>Client items</Body>
        </Pressable>
        <Pressable onPress={() => setTab('my')}>
          <Body style={[styles.tab, tab === 'my' ? styles.tabActive : styles.tabInactive]}>My items</Body>
        </Pressable>
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {items.map((item, idx) => (
          <View key={item.id} style={styles.row}>
            <View style={styles.check}>
              <Check size={13} color={colors.white} />
            </View>
            <View style={{ gap: 3 }}>
              <Text style={styles.rowTitle}>{item.title}</Text>
              <Text style={[styles.rowMeta, item.state === 'approved' && { color: colors.success }]}>
                {item.state === 'approved' ? `Approved ${times[idx % times.length]}` : `Delivered ${times[idx % times.length]}`}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={{ paddingHorizontal: space.screenX, paddingBottom: insets.bottom + 16, paddingTop: 8 }}>
        <Button label="Back to Activations" variant="secondary" onPress={() => navigation.popToTop()} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: { paddingHorizontal: space.screenX, paddingTop: 8, height: 40, justifyContent: 'center' },
  head: { paddingHorizontal: space.screenX, paddingTop: 8, paddingBottom: 10, gap: 6 },
  title: { fontFamily: font.bold, fontSize: 22, color: colors.black },
  subtitle: { fontFamily: font.regular, fontSize: 14, color: colors.grey600 },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.grey100,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
  },
  badgeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.green },
  badgeLabel: { fontFamily: font.monoMedium, fontSize: 10, color: colors.black, letterSpacing: 0.2 },
  banner: { backgroundColor: colors.black, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 14, gap: 4 },
  bannerTitle: { fontFamily: font.semibold, fontSize: 14, color: colors.white },
  bannerSub: { fontFamily: font.mono, fontSize: 11, color: colors.grey300 },
  tabs: { flexDirection: 'row', gap: 20, paddingHorizontal: space.screenX, paddingTop: 18, paddingBottom: 8 },
  tab: { fontSize: 15 },
  tabActive: { fontFamily: font.semibold, color: colors.black },
  tabInactive: { fontFamily: font.regular, color: colors.grey300 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: space.screenX, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: colors.grey100,
  },
  check: { width: 20, height: 20, borderRadius: 5, backgroundColor: colors.black, alignItems: 'center', justifyContent: 'center' },
  rowTitle: { fontFamily: font.medium, fontSize: 15, color: colors.black },
  rowMeta: { fontFamily: font.mono, fontSize: 11, color: colors.grey600 },
});
