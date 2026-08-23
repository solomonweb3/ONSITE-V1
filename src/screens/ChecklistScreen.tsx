import React, { useState } from 'react';
import { View, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParams } from '../navigation/types';
import { colors, font, radius, space } from '../theme';
import { Body, Meta, StatusBadge, IconButton, Button } from '../components/ui';
import { ChevronLeft } from '../components/icons';
import { ChecklistRow } from '../components/ChecklistRow';
import { useStore } from '../store';

type Props = NativeStackScreenProps<HomeStackParams, 'Checklist'>;
type TabKey = 'client' | 'my';

export function ChecklistScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { activation, progressOf } = useStore();
  const [tab, setTab] = useState<TabKey>('client');
  const a = activation(route.params.activationId);
  if (!a) return null;

  const items = a.items.filter((i) => i.owner === tab);
  const approved = a.items.filter((i) => i.state === 'approved').length;
  const allDone = progressOf(a.id) === 100;

  return (
    <View style={{ flex: 1, backgroundColor: colors.white, paddingTop: insets.top }}>
      <View style={styles.topBar}>
        <IconButton onPress={() => navigation.goBack()} style={{ marginLeft: -6 }}>
          <ChevronLeft />
        </IconButton>
      </View>

      <View style={styles.head}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Body style={styles.title}>{a.title}</Body>
          <StatusBadge status={a.status} />
        </View>
        <Body style={styles.subtitle}>{a.subtitle}</Body>
      </View>

      <View style={{ paddingHorizontal: space.screenX }}>
        <View style={styles.reviewPill}>
          <Body style={styles.reviewLabel}>{allDone ? 'All items delivered' : 'Pending client review'}</Body>
          <Meta style={{ fontSize: 12 }}>{`${approved}/${a.items.length} items`}</Meta>
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

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        {items.map((item) => (
          <ChecklistRow
            key={item.id}
            item={item}
            onPress={() => navigation.navigate('ItemDetail', { activationId: a.id, itemId: item.id })}
          />
        ))}
        {items.length === 0 ? (
          <View style={{ padding: 24 }}>
            <Meta>No {tab === 'client' ? 'client' : 'personal'} items yet.</Meta>
          </View>
        ) : null}
      </ScrollView>

      {allDone ? (
        <View style={{ paddingHorizontal: space.screenX, paddingBottom: insets.bottom + 16 }}>
          <Button label="View delivery summary" onPress={() => navigation.navigate('AllComplete', { activationId: a.id })} />
        </View>
      ) : (
        <View style={{ paddingHorizontal: space.screenX, paddingBottom: insets.bottom + 16 }}>
          <Button
            label="Preview as brand"
            variant="secondary"
            onPress={() => navigation.navigate('BrandPreview', { activationId: a.id })}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: { paddingHorizontal: space.screenX, paddingTop: 8, height: 40, justifyContent: 'center' },
  head: { paddingHorizontal: space.screenX, paddingTop: 8, paddingBottom: 16, gap: 8 },
  title: { fontFamily: font.bold, fontSize: 22, color: colors.black },
  subtitle: { fontSize: 14, color: colors.grey600 },
  reviewPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.grey50,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  reviewLabel: { fontFamily: font.medium, fontSize: 13, color: colors.black },
  tabs: { flexDirection: 'row', gap: 20, paddingHorizontal: space.screenX, paddingTop: 20, paddingBottom: 8 },
  tab: { fontSize: 15 },
  tabActive: { fontFamily: font.semibold, color: colors.black },
  tabInactive: { fontFamily: font.regular, color: colors.grey300 },
});
