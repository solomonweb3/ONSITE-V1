import React, { useState } from 'react';
import { View, ScrollView, Pressable, StyleSheet, Share, Platform, Alert } from 'react-native';
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
  const { activation, progressOf, getReviewLink, peekReviewLink, regenerateReviewLink, revokeReviewLink } = useStore();
  const [tab, setTab] = useState<TabKey>('client');
  const [sharing, setSharing] = useState(false);
  const a = activation(route.params.activationId);
  if (!a) return null;

  const items = a.items.filter((i) => i.owner === tab);
  const approved = a.items.filter((i) => i.state === 'approved').length;
  const awaiting = a.items.filter((i) => i.state === 'submitted').length;
  const changes = a.items.filter((i) => i.state === 'rejected').length;
  const allDone = progressOf(a.id) === 100;

  // Reflect what the brand has actually done, most-urgent first.
  const reviewLabel =
    changes > 0
      ? `${changes} change${changes === 1 ? '' : 's'} requested`
      : allDone
      ? 'All items approved'
      : awaiting > 0
      ? `${awaiting} awaiting brand review`
      : 'Ready to share for review';
  const reviewColor = changes > 0 ? colors.pendingAmber : allDone ? colors.success : colors.black;

  const deliverLink = async (url: string) => {
    if (Platform.OS === 'web') {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        Alert.alert('Link copied', 'Send it to the brand — they can review without an account.');
      } else {
        window.prompt('Copy this brand review link:', url);
      }
    } else {
      await Share.share({ message: `Review the deliverables for ${a.title}: ${url}`, url });
    }
  };

  const guard = async (fn: () => Promise<void>) => {
    try {
      await fn();
    } catch (e) {
      Alert.alert('Something went wrong', e instanceof Error ? e.message : 'Please try again.');
    }
  };

  const shareReviewLink = async () => {
    setSharing(true);
    try {
      const existing = await peekReviewLink(a.id);
      // No link yet, or on web: mint (if needed) and share/copy straight away.
      if (!existing || Platform.OS === 'web') {
        await deliverLink(existing ?? (await getReviewLink(a.id)));
        return;
      }
      // A link already exists — offer to reshare, rotate, or kill it.
      Alert.alert('Brand review link', 'This activation already has a shareable link.', [
        { text: 'Share link', onPress: () => guard(() => deliverLink(existing)) },
        {
          text: 'Regenerate (invalidates old link)',
          onPress: () => guard(async () => deliverLink(await regenerateReviewLink(a.id))),
        },
        {
          text: 'Revoke link',
          style: 'destructive',
          onPress: () =>
            guard(async () => {
              await revokeReviewLink(a.id);
              Alert.alert('Link revoked', 'The old link no longer works. Share again to create a new one.');
            }),
        },
        { text: 'Cancel', style: 'cancel' },
      ]);
    } catch (e) {
      Alert.alert('Could not create link', e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setSharing(false);
    }
  };

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
          <Body style={[styles.reviewLabel, { color: reviewColor }]}>{reviewLabel}</Body>
          <Meta style={{ fontSize: 12 }}>{`${approved}/${a.items.length} approved`}</Meta>
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

      <View style={{ paddingHorizontal: space.screenX, paddingBottom: insets.bottom + 16, gap: 10 }}>
        <Button
          label={sharing ? 'Creating link…' : 'Share brand review link'}
          onPress={shareReviewLink}
          loading={sharing}
        />
        {allDone ? (
          <Button
            label="View delivery summary"
            variant="secondary"
            onPress={() => navigation.navigate('AllComplete', { activationId: a.id })}
          />
        ) : (
          <Button
            label="Preview as brand"
            variant="secondary"
            onPress={() => navigation.navigate('BrandPreview', { activationId: a.id })}
          />
        )}
      </View>
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
