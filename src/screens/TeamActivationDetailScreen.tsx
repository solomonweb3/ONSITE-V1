import React, { useEffect, useState } from 'react';
import { View, Text, Image, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { TeamStackParams } from '../navigation/types';
import { colors, font, space } from '../theme';
import { StatusBadge, ProgressBar, IconButton } from '../components/ui';
import { ChevronLeft, Check } from '../components/icons';
import { VideoPreview, isVideoLabel } from '../components/VideoPreview';
import { useStore } from '../store';
import * as api from '../data/api';
import { supabase } from '../lib/supabase';
import type { ChecklistItem, Activation } from '../store';

const activationProgress = (items: ChecklistItem[]) =>
  items.length ? Math.round((items.filter((i) => i.state === 'approved').length / items.length) * 100) : 0;

type Props = NativeStackScreenProps<TeamStackParams, 'TeamActivationDetail'>;

const stateLabel: Record<ChecklistItem['state'], string> = {
  approved: 'Approved',
  submitted: 'In review',
  rejected: 'Needs changes',
  todo: 'Not started',
};

function DeliverableCard({ item }: { item: ChecklistItem }) {
  const hasUpload = item.state === 'submitted' || item.state === 'approved';
  const approved = item.state === 'approved';
  return (
    <View style={styles.card}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <View style={[styles.stateChip, approved && { backgroundColor: '#E6F2E9' }, item.state === 'submitted' && { backgroundColor: colors.grey100 }]}>
          {approved ? <Check size={12} color={colors.success} /> : null}
          <Text style={[styles.stateText, approved && { color: colors.success }]}>{stateLabel[item.state]}</Text>
        </View>
      </View>
      <Text style={styles.cardMeta}>
        {item.owner === 'client' ? 'Client item' : 'Creator item'} · {item.due === 'Delivered' ? 'Delivered' : `Due ${item.due}`}
      </Text>

      {hasUpload ? (
        <View style={{ gap: 8 }}>
          {item.mediaUri ? (
            isVideoLabel(item.photoLabel) || isVideoLabel(item.mediaUri) ? (
              <VideoPreview uri={item.mediaUri} style={styles.media} />
            ) : (
              <Image source={{ uri: item.mediaUri }} style={styles.media} resizeMode="cover" />
            )
          ) : (
            <View style={styles.media} />
          )}
          <Text style={styles.uploadName} numberOfLines={1}>{item.photoLabel}</Text>
          {item.caption ? <Text style={styles.uploadCaption}>{item.caption}</Text> : null}
        </View>
      ) : (
        <Text style={styles.awaiting}>Awaiting upload from creator</Text>
      )}
    </View>
  );
}

export function TeamActivationDetailScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { myTeam } = useStore();
  const [a, setA] = useState<Activation>(route.params.activation);

  // Live sync: reload this activation whenever the member changes its items.
  useEffect(() => {
    if (!myTeam) return;
    const reload = async () => {
      try {
        const acts = await api.loadMemberActivations(myTeam.id, route.params.memberId);
        const fresh = acts.find((x) => x.id === route.params.activation.id);
        if (fresh) setA(fresh);
      } catch {
        /* ignore */
      }
    };
    const channel = supabase
      .channel(`activation-${route.params.activation.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'checklist_items', filter: `activation_id=eq.${route.params.activation.id}` }, reload)
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [myTeam, route.params.memberId, route.params.activation.id]);

  if (!a) return null;

  const progress = activationProgress(a.items);
  const approved = a.items.filter((i) => i.state === 'approved').length;

  return (
    <View style={{ flex: 1, backgroundColor: colors.white, paddingTop: insets.top }}>
      <View style={styles.topBar}>
        <IconButton onPress={() => navigation.goBack()} style={{ marginLeft: -6 }}>
          <ChevronLeft />
        </IconButton>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        <View style={{ paddingHorizontal: space.screenX, paddingTop: 8 }}>
          <Text style={styles.kicker}>{route.params.memberName.toUpperCase()} · TEAM ADMIN VIEW</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
            <Text style={styles.title}>{a.title}</Text>
            <StatusBadge status={a.status} />
          </View>
          <Text style={styles.subtitle}>{a.subtitle}</Text>
        </View>

        {/* Progress */}
        <View style={{ paddingHorizontal: space.screenX, paddingTop: 16 }}>
          <View style={styles.progressBox}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
              <Text style={styles.progressLabel}>Progress</Text>
              <Text style={styles.progressMeta}>{approved}/{a.items.length} approved · {progress}%</Text>
            </View>
            <ProgressBar value={progress} />
          </View>
        </View>

        {/* Deliverables + uploads */}
        <View style={{ paddingHorizontal: space.screenX, paddingTop: 16 }}>
          <Text style={styles.section}>UPLOADS & DELIVERABLES</Text>
        </View>
        <View style={{ paddingHorizontal: space.screenX, paddingTop: 8, gap: 12 }}>
          {a.items.map((item) => (
            <DeliverableCard key={item.id} item={item} />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: { paddingHorizontal: space.screenX, paddingTop: 8, height: 40, justifyContent: 'center' },
  kicker: { fontFamily: font.mono, fontSize: 10, color: colors.grey600, letterSpacing: 0.2 },
  title: { fontFamily: font.bold, fontSize: 22, color: colors.black },
  subtitle: { fontFamily: font.regular, fontSize: 14, color: colors.grey600, marginTop: 2 },
  progressBox: { backgroundColor: colors.grey50, borderRadius: 12, padding: 16 },
  progressLabel: { fontFamily: font.semibold, fontSize: 13, color: colors.black },
  progressMeta: { fontFamily: font.mono, fontSize: 11, color: colors.grey600 },
  section: { fontFamily: font.monoMedium, fontSize: 10, color: colors.grey600, letterSpacing: 0.4 },
  card: { borderWidth: 1, borderColor: colors.grey100, borderRadius: 12, padding: 16, gap: 8 },
  cardTitle: { fontFamily: font.semibold, fontSize: 15, color: colors.black, flexShrink: 1, paddingRight: 8 },
  cardMeta: { fontFamily: font.mono, fontSize: 11, color: colors.grey600 },
  stateChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.grey100, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
  stateText: { fontFamily: font.monoMedium, fontSize: 10, color: colors.grey600, letterSpacing: 0.2 },
  media: { width: '100%', height: 200, borderRadius: 10, backgroundColor: colors.black, overflow: 'hidden' },
  uploadName: { fontFamily: font.mono, fontSize: 11, color: colors.grey600 },
  uploadCaption: { fontFamily: font.regular, fontSize: 12, color: colors.grey600 },
  awaiting: { fontFamily: font.mono, fontSize: 11, color: colors.grey400 },
});
